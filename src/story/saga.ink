// ── The World Myth — an unlockable saga ──────────────────────────────────
// Authored in ink (inkle's narrative language); compiled to JSON by
// scripts/compile-ink.mjs and played on the Byte Beast tab's story stage
// via src/data/storyEngine.js.
//
// The saga is UNLOCKABLE: it reads the learner's real progress (pushed in as
// the variables below) and plays only the beats they have earned. Studying
// literally reveals more of the story. Every line is a PANEL — its tags
// carry the presentation the renderer (Cutscene.jsx) consumes:
//     Some line of prose. # actor: companion # kicker: THE BOND # title: Optional
//   actor  = province | companion | lapse | lapse-dim   (who is on stage)
//   kicker = the small uppercase label above the line
//   title  = optional big title (act openers)
//
// KEEP the variable names below in sync with storyEngine.js (it sets them
// before playing). Do not rename without updating that file.

VAR beast = "dragon"          // species key of the active companion
VAR beast_name = "your companion"  // display name of its current form
VAR beast_tier = 1            // 1..4 — the companion's evolution tier
VAR lessons_total = 0         // lessons completed across all paths
VAR provinces_reclaimed = 0   // paths at 100%
VAR streak = 0               // current day streak

-> saga

// The spine plays each act in order; each act contributes only the beats the
// Keeper has unlocked, then diverts onward. An act with nothing unlocked
// falls straight through, so the saga always ends cleanly.
=== saga ===
-> act_one

=== act_one ===
Long before the streak-counters, there was the Network — a continent-wide lattice where knowledge flowed like water through stone. # actor: province # kicker: THE MYTH · I # title: The Long Watch
{lessons_total >= 1:
    Then came the Null. Cities did not burn; they were unremembered. The great engines wound down mid-sentence. # actor: province # kicker: THE UNREMEMBERING
}
-> act_two

=== act_two ===
{lessons_total < 5:
    -> ending
}
What survived, survived in fragments — lessons sealed in amber, carried by the Byte Beasts: ten bloodlines of machine-spirit and animal grace, who do not forget. # actor: companion # kicker: THE MYTH · II # title: The Beasts That Remember
{beast_tier >= 2:
    {beast_name} is one of them. It chose a Keeper who returned — and it has been returning ever since. # actor: companion # kicker: THE BOND
}
-> act_three

=== act_three ===
{provinces_reclaimed < 1:
    -> ending
}
You have relit your first province. Where you walked, the gray thinned and a lattice-node remembered its own name. # actor: province # kicker: THE FIRST LIGHT # title: The Gray Recedes
{provinces_reclaimed >= 3:
    Three provinces answer your watchfires now. The Null has begun to notice — not with pain, but with attention. # actor: lapse-dim # kicker: IT TAKES NOTICE
}
-> ending

// The saga's living edge — reflects how far the Keeper has come, and points
// at the work that unlocks the next beat.
=== ending ===
{
- provinces_reclaimed >= 8:
    Eight provinces burn bright against the dark. The Long Watch holds — not because the Null was defeated, but because one Keeper and one beast refused to stop remembering. # actor: companion # kicker: THE WATCH UNBROKEN # title: For Now
- lessons_total < 1:
    The saga has not begun. Complete a lesson, and the first light of the myth will kindle. # actor: province # kicker: THE THRESHOLD
- else:
    Here the told story ends — for now. The rest waits in the lessons you have not yet learned. Return as you grow. # actor: province # kicker: TO BE CONTINUED
}
-> END
