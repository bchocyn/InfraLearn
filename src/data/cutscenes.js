// Story cutscenes — the short in-app cinematic beats between milestones.
// Three per province, all built from the same lore tables (lore.js) so new
// provinces get their beats for free:
//
//   enter:<path>   first time the learner crosses into the province
//   notice:<path>  a third reclaimed — the province's Lapse takes notice
//   turn:<path>    two thirds — the tide turns; the Lapse feels it
//
// (The gold seal at 100% has its own full cinematic: PathAscension.)
//
// A cutscene is a list of PANELS played in order, visual-novel style. Each
// panel: { actor, kicker, title?, lines[] }. `actor` decides the centerpiece:
//   { type: 'province', icon }   — the path icon over the province scene
//   { type: 'companion' }        — the learner's Byte Beast (current tier)
//   { type: 'lapse', lapseId }   — the Null Beast boss sprite
//   { type: 'lapse-dim', lapseId } — same, but a faint silhouette presence

import { PROVINCES, FIVE_LAPSES, JOURNEY_CHAPTERS } from './lore.js';
import { PATHS } from '../data/content.js';

// Parse a cutscene id:
//   'enter|notice|turn:<path>' → { beat, pathKey }
//   'chapter:<path>:<n>'       → { beat:'chapter', pathKey, n }
// (null if malformed).
export function parseCutsceneId(id) {
  const s = String(id || '');
  const m = /^(enter|notice|turn):([a-z]+)$/.exec(s);
  if (m) return { beat: m[1], pathKey: m[2] };
  const c = /^chapter:([a-z]+):([1-9][0-9]*)$/.exec(s);
  if (c) return { beat: 'chapter', pathKey: c[1], n: Number(c[2]) };
  return null;
}

// The Journey storyline as cinematic cutscenes — one staged scene per chapter,
// so the lore actually lands instead of scrolling past as a paragraph. Five
// shared act-templates interpolate the province + its Lapse, so all eight
// provinces get a distinct 5-act arc: arrive → first watchfire → bond & relit
// relay → the Lapse revealed → province reclaimed. Played on chapter complete
// (store.completeChapter) and replayable from the Journey screen.
function chapterPanels(n, { path, province, lapse }) {
  const T = (JOURNEY_CHAPTERS[n - 1]?.title || '').toUpperCase();
  const prov = { type: 'province', icon: path.icon };
  const dim = lapse ? { type: 'lapse-dim', lapseId: province.lapse } : null;
  const boss = lapse ? { type: 'lapse', lapseId: province.lapse } : null;

  if (n === 1) {
    return [
      { actor: prov, kicker: `CHAPTER 1 · ${T}`, title: province.name,
        lines: [
          province.epithet ? `— ${province.epithet} —` : '',
          `You cross the boundary-stone and the gray thins, just a little. ${province.name} knows a Keeper walks it again.`,
        ].filter(Boolean) },
      { actor: { type: 'companion' }, kicker: 'YOUR COMPANION',
        lines: [
          'It lifts its head and tastes the air — the un-remembering hangs heavy here.',
          'Every lesson you hold relights a lantern this place lost.',
        ] },
      ...(dim ? [{ actor: dim, kicker: 'AT THE FAR END',
        lines: [
          'Behind the fog at the end of the road, something waits. It is in no hurry.',
          "It believes you'll stop on your own — the way the others did.",
        ] }] : []),
    ];
  }
  if (n === 2) {
    return [
      { actor: prov, kicker: `CHAPTER 2 · ${T}`, title: 'The First Watchfire',
        lines: [`The first watchfire of ${province.name} stands cold — a ring of stones older than the Null itself.`] },
      { actor: { type: 'companion' }, kicker: 'YOUR COMPANION',
        lines: [
          'Your companion noses the dead coals, then looks to you.',
          "You bank what you've learned against the dark, and strike. The fire catches.",
        ] },
      ...(dim ? [{ actor: dim, kicker: 'SOMEWHERE FAR OFF',
        lines: ['Something that feeds on forgetting flinches at the light.', 'Not pain — attention.'] }] : []),
    ];
  }
  if (n === 3) {
    return [
      { actor: { type: 'companion' }, kicker: `CHAPTER 3 · ${T}`, title: 'The Relay Relit',
        lines: ['Your companion has grown. It remembers the shape of the dead relay-tower, and together you climb.'] },
      { actor: prov, kicker: `${province.name.toUpperCase()} ANSWERS`,
        lines: [
          'When the beacon takes, the province answers with lights of its own —',
          'relays that waited an age for one Keeper and one beast who did not quit.',
        ] },
    ];
  }
  if (n === 4) {
    return [
      { actor: prov, kicker: `CHAPTER 4 · ${T}`, title: 'Hold the Line',
        lines: ['Seven nights on the wall. The Null probes for the gap it always finds — the missed day, the unkept patrol.'] },
      ...(dim ? [{ actor: dim, kicker: 'IT DOES NOT FIND IT',
        lines: ['On the seventh dawn the fog peels back. For one breath, you see what was watching.'] }] : []),
      ...(boss ? [{ actor: boss, kicker: `${lapse.name.toUpperCase()} · ${lapse.title.toUpperCase()}`, title: lapse.name,
        lines: [`“${lapse.voice}”`] }] : []),
      { actor: { type: 'companion' }, kicker: 'YOUR COMPANION',
        lines: [
          'It plants itself between you and the dark, and does not blink.',
          'It has noticed you. Good — named things can be fought.',
        ] },
    ];
  }
  // n === 5 — the payoff.
  return [
    { actor: prov, kicker: `CHAPTER 5 · ${T}`, title: 'Province Reclaimed',
      lines: [`The last fragment slots home and ${province.name} REMEMBERS — every shelf, every span, every name the Null unwrote.`] },
    ...(boss ? [{ actor: boss, kicker: `${lapse.name.toUpperCase()} RETREATS`,
      lines: [
        `${lapse.name} pulls back into the thinning fog.${lapse.vice ? ` Its ${lapse.vice.toLowerCase()} finds no purchase here now.` : ''}`,
        '“What you reclaimed, I will want back.”',
      ] }] : []),
    { actor: { type: 'companion' }, kicker: 'YOUR COMPANION',
      lines: ['It stands taller in the new light, and leans into your hand.'] },
    { actor: prov, kicker: 'THE WATCH HOLDS',
      lines: ['The province seal burns gold on your ledger. One more piece of the Network, remembered.'] },
  ];
}

export function getCutscene(id) {
  const parsed = parseCutsceneId(id);
  if (!parsed) return null;
  const { beat, pathKey } = parsed;
  const path = PATHS[pathKey];
  const province = PROVINCES[pathKey];
  if (!path || !province) return null;
  const lapse = FIVE_LAPSES[province.lapse] || null;

  if (beat === 'enter') {
    return {
      id,
      panels: [
        {
          actor: { type: 'province', icon: path.icon },
          kicker: `PROVINCE OF ${path.name.toUpperCase()}`,
          title: province.name,
          lines: [province.epithet ? `— ${province.epithet} —` : '', province.intro].filter(Boolean),
        },
        {
          actor: { type: 'companion' },
          kicker: 'YOUR COMPANION STIRS',
          lines: [
            'It smells the un-remembering on the wind here.',
            'Every lesson you hold relights a lantern someone else lost.',
          ],
        },
        ...(lapse
          ? [{
              actor: { type: 'lapse-dim', lapseId: province.lapse },
              kicker: 'SOMETHING WAITS',
              lines: [
                'At the far end of this road, behind the fog, something is patient.',
                'It is in no hurry. It thinks you will stop on your own.',
              ],
            }]
          : []),
      ],
    };
  }

  if (beat === 'chapter') {
    const ch = JOURNEY_CHAPTERS[parsed.n - 1];
    if (!ch) return null;
    const panels = chapterPanels(parsed.n, { path, province, lapse });
    return panels.length ? { id, panels } : null;
  }

  if (!lapse) return null;

  if (beat === 'notice') {
    return {
      id,
      panels: [
        {
          actor: { type: 'lapse-dim', lapseId: province.lapse },
          kicker: 'A THIRD OF THE PROVINCE RECLAIMED',
          lines: [
            'The fog at the end of the road shifts. Something turns its attention toward you.',
          ],
        },
        {
          actor: { type: 'lapse', lapseId: province.lapse },
          kicker: `${lapse.name.toUpperCase()} · ${lapse.title.toUpperCase()}`,
          title: lapse.name,
          lines: [`“${lapse.voice}”`],
        },
        {
          actor: { type: 'companion' },
          kicker: 'YOUR COMPANION ANSWERS',
          lines: [
            'It plants itself between you and the dark, and does not blink.',
            'Keep walking. Named things can be fought.',
          ],
        },
      ],
    };
  }

  // beat === 'turn'
  return {
    id,
    panels: [
      {
        actor: { type: 'province', icon: path.icon },
        kicker: 'TWO THIRDS RECLAIMED',
        title: 'The tide turns',
        lines: [
          `${province.name} is waking up. Lanterns relight behind you on roads you have already walked.`,
        ],
      },
      {
        actor: { type: 'lapse', lapseId: province.lapse },
        kicker: `${lapse.name.toUpperCase()} FEELS IT`,
        lines: [
          'For the first time, the fog pulls BACK on its own.',
          `${lapse.vice ? `Its ${lapse.vice.toLowerCase()} thins. ` : ''}The gate at the end of the road is waiting for you now — not the other way around.`,
        ],
      },
    ],
  };
}
