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

import { PROVINCES, FIVE_LAPSES } from './lore.js';
import { PATHS } from '../data/content.js';

// Parse 'enter:devops' → { beat: 'enter', pathKey: 'devops' } (null if bad).
export function parseCutsceneId(id) {
  const m = /^(enter|notice|turn):([a-z]+)$/.exec(String(id || ''));
  if (!m) return null;
  return { beat: m[1], pathKey: m[2] };
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
