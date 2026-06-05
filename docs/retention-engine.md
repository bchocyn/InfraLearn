# Retention engine

This is the technical reference for the layer that keeps learners coming
back and keeps lessons from evaporating after the read. The design
principle is that engagement attaches to **tested** items (recall, review,
quiz) rather than to recognition (passively re-reading). Reading a lesson
gets a lightweight +5 XP acknowledgment; the real XP lives in recall.

All state is in `src/store/useStore.js` (Zustand + `persist` to
`localStorage`).

## Streak

Fields:

- `streak` — current consecutive-day count
- `lastActivityDate` — `'YYYY-MM-DD'` of the last day with any activity
- `streakFreezes` — earned freezes, spent manually before a known miss
- `pendingFreeze` — when true, the next gap day burns a freeze instead of
  resetting the streak
- `weekendPasses` — auto-consumed when the missed day was Sat/Sun; the
  store refills to 2 at the start of each calendar month
- `weekendPassMonth` — `'YYYY-MM'` of the last refill, used as the
  idempotency key
- `streakHighWater` — best streak ever, surfaced in CelebrationMoment when
  the current run crosses it

### `recordActivity` flow

Call once per lesson completion, daily-practice answer, or self-graded
review. Same-day calls are no-ops.

1. Refill weekend passes if it's a new month.
2. If `lastActivityDate` is null → first activity ever, set `streak = 1`.
3. Compute `gap = daysBetween(lastActivityDate, today)`.
4. `gap <= 0` → no change (same day or clock skew).
5. `gap === 1` → consecutive day, `streak += 1`.
6. `gap > 1` → forgiveness ladder:
   - If `pendingFreeze` → consume a freeze, treat gap as continuous,
     `streak += 1`.
   - Else if the **single missed day** was Saturday or Sunday and a
     weekend pass is available → consume one, `streak += 1`.
   - Else → `streak = 1` (reset).
7. After update, check streak-milestone XP bonuses (3, 7, 14, 30, 100)
   and grant the matching `streak:N` badge.

### Weekend Pass mechanic

Modeled on the Duolingo Weekend Amulet A/B result — pure streak anxiety
without forgiveness underperforms streak + insurance. Two passes per
month, auto-consumed only when the **single missed day** was a weekend.
Multi-day gaps still break the streak even with passes available.

### Manual freeze

Set `pendingFreeze = true` from the Settings screen when the user knows
they'll miss tomorrow (travel, surgery, etc.). The next `recordActivity`
call with `gap > 1` burns it instead of resetting. There is no automatic
freeze — the forgiveness here is opt-in to keep the streak number
trustworthy.

## Free-recall mode

Toggle in Daily Practice. The standard daily-practice card shows a
multiple-choice question; free-recall mode shows only the prompt and a
"reveal answer" button, and the user self-grades with `✗ Miss / ⚠ Hard /
✓ Got it / ★ Easy`.

The four grades feed straight into `scheduleReview(conceptId, grade)`
with grade `1 / 2 / 3 / 4`. The XP gain on a successful free-recall is
weighted heavier than the equivalent multiple-choice correct, because
the evidence (Dunlosky 2013, Rowland 2014) is that production retrieval
outperforms recognition for durable retention.

First successful free-recall grants `recall:first`.

## Spaced repetition (FSRS-flavored)

Stored in `reviewQueue: { [conceptId]: { lastSeen, dueAt, stability,
difficulty, reps, lapses } }`. The `/reviews` screen surfaces every entry
where `dueAt <= today`, sorted by `dueAt` ascending.

### Scheduler

```
grade = 1 (miss):
  stability = 1
  difficulty = min(10, difficulty + 0.5)
  lapses += 1
  interval = 1

grade ∈ {2, 3, 4}:
  mult = { 2: 1.2, 3: 2.5, 4: 3.5 }[grade]
  stability = min(36500, stability * mult)
  if grade === 4: difficulty = max(1, difficulty - 0.15)
  interval = max(1, ceil(stability * difficulty^-0.5))

dueAt = today + interval days
```

Notes:

- Initial values are `stability = 1`, `difficulty = 5`.
- The `difficulty^-0.5` term is the inverse of FSRS-6's relationship —
  harder cards come back sooner. Easies push them further out via the
  difficulty decay.
- Misses always re-schedule for tomorrow, not today — Cepeda 2006's
  optimal-gap inverted-U is flat near zero, so massing the retry on
  the same day buys nothing.
- Lesson completion auto-enters the queue with grade 3 (a "good" review)
  so the user sees it again at the FSRS-good interval before they would
  otherwise forget it.

### The `/reviews` screen

- Lists every concept with `dueAt <= today`, joined to `PATHS[*].lessons`
  for the title + tagline.
- Each row has four self-grade buttons. Picking one calls
  `markReviewed(conceptId, grade)` which runs `scheduleReview` plus
  `recordActivity` (so reviewing counts toward the streak).
- 10 reviews in one calendar day grants `reviewer:10`.

## XP system

Total `xp` accumulates; derived `xpLevel` is a lookup into ten cumulative
thresholds:

```
[0, 100, 250, 500, 1000, 2000, 4000, 7500, 12000, 20000]
```

`levelFromXp(xp)` returns the highest-index threshold `<=` xp, plus one
(so xp = 0 → level 1, xp = 100 → level 2, …, xp >= 20000 → level 10).

Gain rules (call sites use short namespaced `reason` tokens so they're
greppable):

| Event                       | XP   | Reason token       |
|-----------------------------|------|--------------------|
| Lesson complete             | +5   | `lesson:complete`  |
| Daily-practice correct      | +4   | `daily:correct`    |
| Free-recall ✓ Got it / ★    | +8   | `recall:good`      |
| Free-recall ⚠ Hard          | +4   | `recall:hard`      |
| Review ✓ Good / ★ Easy      | +6   | `review:good`      |
| Review ⚠ Hard               | +3   | `review:hard`      |
| Streak day (any activity)   | +2   | `streak:day`       |
| Streak milestone 3 / 7 / 14 / 30 / 100 | +25 / 50 / 100 / 200 / 500 | `streak:milestone` |

The `xpHistory` array keeps the last 20 gains for the recent-XP strip on
the Home screen. Bounded so persisted state stays small.

## Badges

`badges: { [badgeId]: { unlockedAt: 'YYYY-MM-DD' } }`. Auto-granted by
`computeNewBadges` after any state change that could newly satisfy a
condition. Idempotent — re-granting a known badge is a no-op.

ID schema:

- `section:{normalized-section}` — every concept lesson in a content
  section completed. The section name is lowercased and `[^a-z0-9]+`
  collapsed to `-`.
- `streak:{N}` — N ∈ {3, 7, 14, 30, 100}.
- `path:{pathKey}:bronze|silver|gold` — path progress crosses 33% / 66%
  / 100%.
- `daily:perfect` — Daily Practice 5/5 in one session.
- `recall:first` — first successful free-recall.
- `reviewer:10` — 10 reviews completed in one calendar day.

## CelebrationMoment

`celebrate` is a one-shot ephemeral signal on the store. Set by `addXp`
(XP burst or level-up), `grantBadge` (badge unlock), and any caller that
wants a celebration moment. The consumer (`CelebrationMoment.jsx`) reads
it, animates, and calls `clearCelebration`.

Priority order when multiple events fire in one `addXp` call:

1. Level-up (bigger moment beats smaller)
2. Badge unlock
3. XP burst

Only one celebration shows at a time. A level-up that also unlocks a
badge queues the badge for the next state change.

## NudgeCard

Renders on Home above Daily Practice. Picks the highest-priority nudge
to show. The framing is always **forgiveness-first** — never "you missed
a day," always "welcome back, here's the gentlest re-entry."

Priority order:

1. **Streak at risk today** — user hasn't recorded activity today and
   `lastActivityDate === yesterday`. CTA: "Keep your streak — one
   review."
2. **Streak broken, fresh start** — yesterday's gap reset the streak.
   CTA: "Fresh start — try one card."
3. **Reviews due** — `reviewQueue` has any entry with `dueAt <= today`.
   CTA: "{N} ready for review."
4. **Weak spot** — `quizMisses` has any entry. CTA: "Revisit a tricky
   one."
5. **Daily practice** — nothing else applies. CTA: "Open today's set."

The component never says "you broke your streak" or any guilt phrasing.
It says "fresh start" instead. This is a load-bearing design rule.

## Evidence anchors

- **Dunlosky et al. 2013** — *Improving Students' Learning With Effective
  Learning Techniques*. Practice testing and distributed practice are the
  two techniques with the strongest evidence; both are core to this
  engine.
- **Cepeda et al. 2006** — *Distributed Practice in Verbal Recall Tasks:
  A Review and Quantitative Synthesis*. The 839-assessment meta that
  shows spacing > massing and an inverted-U optimal inter-study gap.
- **Rowland 2014** — *The Effect of Testing Versus Restudy on Retention:
  A Meta-Analytic Review of the Testing Effect*. Production retrieval
  (free-recall) outperforms recognition for durable retention; the basis
  for weighting free-recall XP heavier.
- **FSRS-6 benchmark** — `open-spaced-repetition/fsrs-benchmark`. FSRS-6
  beats SM-2 on retention prediction for 99.6% of users. The scheduler
  here is FSRS-flavored: not the full optimizer, but the
  stability/difficulty/interval shape.
- **Duolingo Weekend Amulet A/B** — streak + insurance produced +4%
  week-later return and -5% streak loss vs. pure streak anxiety. The
  basis for the Weekend Pass + manual freeze.
