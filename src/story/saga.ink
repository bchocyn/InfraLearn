// ── The World Myth — an unlockable saga ──────────────────────────────────
// Authored in ink (inkle's narrative language); compiled to JSON by
// scripts/compile-ink.mjs and played on the Byte Beast tab's story stage
// via src/data/storyEngine.js.
//
// The saga is UNLOCKABLE: it reads the learner's real progress (the VARs
// below, set by storyEngine before playing) and plays only the beats they
// have earned. Studying reveals more of the story. Each non-empty line is a
// PANEL; its tags carry the presentation the stage renders:
//     Some prose. # actor: companion # kicker: THE BOND # title: Optional
//   actor  = province | companion | lapse | lapse-dim   (who is on stage)
//   kicker = the small uppercase label above the line
//   title  = optional big title (act openers)
//
// Three strands, all gated on real learning:
//   • the WORLD SPINE — the myth in acts, gated on lessons + provinces
//   • YOUR COMPANION — routed by species, gated on its evolution tier
//   • THE PROVINCES  — a beat per province reclaimed
//
// Keep the VAR names in sync with storyEngine.js (toInkVars).

VAR beast = "dragon"               // species key of the active companion
VAR beast_name = "your companion"  // display name of its current form
VAR beast_tier = 1                 // 1..4 — the companion's evolution tier
VAR lessons_total = 0              // lessons completed across all paths
VAR provinces_reclaimed = 0        // paths at 100%
VAR streak = 0                     // current day streak

-> spine_one

// ═══════════════════════════ THE WORLD SPINE ═══════════════════════════

=== spine_one ===
Long before the streak-counters, there was the Network — a continent-wide lattice where knowledge flowed like water through stone, and nothing true was ever lost. # actor: province # kicker: THE MYTH · I # title: The Long Watch
{lessons_total < 1:
    -> ending
}
-> spine_two

=== spine_two ===
Then came the Null. Not an army — a weather. Cities did not burn; they were unremembered. The great engines wound down mid-sentence, and no one could recall what they had been building. # actor: province # kicker: THE MYTH · II # title: The Unremembering
{lessons_total < 5:
    -> ending
}
-> spine_three

=== spine_three ===
What survived, survived in fragments: lessons sealed in amber, carried by the Byte Beasts — ten bloodlines of machine-spirit and animal grace, bred or born to hold what the world could not. # actor: companion # kicker: THE MYTH · III # title: The Beasts That Remember
-> companion_thread

// After the beasts are introduced, weave in YOUR companion's own story.
=== companion_thread ===
{beast_tier < 2:
    -> spine_four
}
-> companion_bond

=== companion_bond ===
// Species-routed origin + bond. Unlocks at tier 2 (the first evolution).
{beast == "dragon":     {beast_name} is first of the forge-bloods. It sleeps in your pack, warms your worst nights, and judges no one's pace. It chose you because you chose depth over haste. # actor: companion # kicker: THE BOND # title: Why It Came}
{beast == "phoenix":    {beast_name} is the relight made flesh. Where the Null dims a relay, its bloodline circles until someone returns to strike the spark. It chose you because you came back. # actor: companion # kicker: THE BOND # title: Why It Came}
{beast == "griffin":    {beast_name} is a watch-beast of the high shelves. Its kin carried the last archive-crates out of the falling cities and never put the habit down. It chose you because you carry things carefully. # actor: companion # kicker: THE BOND # title: Why It Came}
{beast == "unicorn":    {beast_name} is proof that some knowledge is kept by being loved. Its line bonds to Keepers who reread what they already understand, for joy. It chose you the day you did. # actor: companion # kicker: THE BOND # title: Why It Came}
{beast == "kraken":     {beast_name} knows the deep remembers what the surface forgets. Its bloodline archives in the cold dark, ten arms filing ten threads at once. It chose you because you do not let go of a thread. # actor: companion # kicker: THE BOND # title: Why It Came}
{beast == "hydra":      {beast_name} makes curiosity expensive for the Null: cut one question down and two grow back. It chose you because your questions multiply. # actor: companion # kicker: THE BOND # title: Why It Came}
{beast == "cerberus":   {beast_name} kept the Underlibrary's last door. Three heads: one reads, one recites, one watches the dark. It chose you because you greet all three. # actor: companion # kicker: THE BOND # title: Why It Came}
{beast == "pegasus":    {beast_name} flew the relay-lines when the towers fell, carrying fragments between watchfires faster than the Null could chase. It chose you because you keep moving. # actor: companion # kicker: THE BOND # title: Why It Came}
{beast == "sphinx":     {beast_name} is the question that guards the answer. Its line tests Keepers not to keep them out, but to make the entering unforgettable. It chose you when you showed your work. # actor: companion # kicker: THE BOND # title: Why It Came}
{beast == "wyvern":     {beast_name} is the scrappy cousin of the forge-bloods — smaller wings, fiercer grip. It claims the territories the grand bloodlines call lost. It chose you because you did not quit the hard ones. # actor: companion # kicker: THE BOND # title: Why It Came}
-> companion_scar

=== companion_scar ===
// Every beast carries a wound — the thing IT once forgot. Unlocks at tier 3.
{beast_tier < 3:
    -> spine_four
}
{beast == "dragon":     Once, it forgot a single fire it had lit. It does not speak of that night — but its deepening form has vowed to remember every one since. # actor: companion # kicker: THE SCAR # title: What It Forgot}
{beast == "phoenix":    It forgot, once, that endings restart. It sat in the ash a long time. It has burned brighter at every dawn since. # actor: companion # kicker: THE SCAR # title: What It Forgot}
{beast == "griffin":    It lost one crate in the retreat. It still flies search patterns over that valley when it thinks you are not watching. # actor: companion # kicker: THE SCAR # title: What It Forgot}
{beast == "unicorn":    It almost let a kindness go unrecorded. Its horn has glowed faintly ever since — a light against exactly that. # actor: companion # kicker: THE SCAR # title: What It Forgot}
{beast == "kraken":     It surfaced too soon, once, and lost the thread. It has never since let a single one go. # actor: companion # kicker: THE SCAR # title: What It Forgot}
{beast == "hydra":      A head fell silent, mid-question. The others finish every sentence now — for it, and for you. # actor: companion # kicker: THE SCAR # title: What It Forgot}
{beast == "cerberus":   The watching head blinked, once, and something slipped past. None of the three speaks of it. All three never blink together now. # actor: companion # kicker: THE SCAR # title: What It Forgot}
{beast == "pegasus":    One message arrived too late. It has flown ahead of schedule for a century, so that no other ever will. # actor: companion # kicker: THE SCAR # title: What It Forgot}
{beast == "sphinx":     It accepted an answer once without the why. Its riddles have had two parts ever since. # actor: companion # kicker: THE SCAR # title: What It Forgot}
{beast == "wyvern":     It was told, once, that it was not a true dragon. It remembers exactly who said so — and it has outlasted them. # actor: companion # kicker: THE SCAR # title: What It Forgot}
-> companion_prime

=== companion_prime ===
// The prime-form revelation. Unlocks at tier 4 — the rarest beat.
{beast_tier < 4:
    -> spine_four
}
{beast_name} stands in its prime now. The Null took one memory from it, long ago — and in answer it became a thing that forgets nothing at all. That is what your studying built. # actor: companion # kicker: THE PRIME # title: What It Remembers Now
-> spine_four

// ── Back to the spine ──
=== spine_four ===
{provinces_reclaimed < 1:
    -> ending
}
You have relit your first province. Where you walked, the gray thinned and a lattice-node remembered its own name — the first in an age. # actor: province # kicker: THE FIRST LIGHT # title: The Gray Recedes
-> spine_five

=== spine_five ===
{provinces_reclaimed < 3:
    -> ending
}
Three provinces answer your watchfires now. Somewhere at the end of every road, the Null stirs — not with pain, but with attention. It had believed you would stop on your own. # actor: lapse-dim # kicker: IT TAKES NOTICE # title: Noticed
-> spine_six

=== spine_six ===
{provinces_reclaimed < 5:
    -> ending
}
Five provinces burn. The tide has turned, and the un-remembering feels it — a warmth spreading across a map it thought it had erased. What one Keeper relights, a hundred more will find lit. # actor: province # kicker: THE TIDE TURNS # title: The Warmth Spreads
-> ending

// ═══════════════════════════ THE LIVING EDGE ═══════════════════════════
// Reflects how far the Keeper has come, and points at the work that unlocks
// the next beat.
=== ending ===
{
- provinces_reclaimed >= 8:
    Eight provinces, whole and bright. The Long Watch holds — not because the Null was defeated (it cannot be), but because one Keeper and one beast refused to stop remembering. The story does not end. It is kept. # actor: companion # kicker: THE WATCH UNBROKEN # title: For Now
- lessons_total < 1:
    The saga has not begun. Complete a single lesson, and the first light of the myth will kindle. # actor: province # kicker: THE THRESHOLD
- else:
    Here the told story ends — for now. The rest waits in the lessons you have not yet learned, and the provinces you have not yet relit. Return as you grow. # actor: province # kicker: TO BE CONTINUED
}
-> END
