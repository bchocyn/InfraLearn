// Story engine — the browser bridge between the compiled ink saga and the
// Byte Beast tab's tap-through story stage.
//
// The heavy inkjs runtime (~128 KB) and the compiled saga JSON are BOTH
// lazy-imported, so nothing here touches the eager bundle — the chunk loads
// only when a Keeper opens the story stage. We push the learner's real
// progress into the story as ink variables; the saga's own conditionals
// (authored in src/story/saga.ink) then decide which beats have been
// unlocked. One Continue() == one PANEL; its tags carry the presentation.
//
// Panel shape (consumed by the story stage, same vocabulary as Cutscene.jsx):
//   { actor: 'province'|'companion'|'lapse'|'lapse-dim', kicker, title?, line }

let enginePromise = null;
// Cache the runtime + compiled JSON once. The Story object itself is stateful
// (it walks a playhead), so we build a FRESH Story per play — but the module
// and JSON only load once.
function loadEngine() {
  if (!enginePromise) {
    enginePromise = Promise.all([
      import('inkjs'),
      import('../story/compiled/saga.json'),
    ])
      .then(([ink, jsonMod]) => ({
        Story: ink.Story || ink.default?.Story,
        json: jsonMod.default || jsonMod,
      }))
      .catch((e) => {
        enginePromise = null; // allow retry on a transient chunk-load failure
        throw e;
      });
  }
  return enginePromise;
}

// Parse ink's ["key: value", …] tag array into a panel's presentation fields.
function parseTags(tags) {
  const out = {};
  for (const t of tags || []) {
    const i = t.indexOf(':');
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}

// Map a store snapshot → the ink variable contract (kept in sync with the
// VAR block at the top of saga.ink). Defensive defaults so a missing field
// never throws inside the story.
function toInkVars(state) {
  return {
    beast: String(state.beast || 'dragon'),
    beast_name: String(state.beastName || 'your companion'),
    beast_tier: Number(state.beastTier) || 1,
    lessons_total: Number(state.lessonsTotal) || 0,
    provinces_reclaimed: Number(state.provincesReclaimed) || 0,
    streak: Number(state.streak) || 0,
  };
}

// Play the saga for a given progress snapshot → the ordered list of unlocked
// panels. Resolves [] if the runtime/JSON can't load (offline first visit,
// etc.) so the caller can show a graceful fallback rather than crash.
export async function playSaga(state) {
  let engine;
  try {
    engine = await loadEngine();
  } catch {
    return [];
  }
  const { Story, json } = engine;
  const story = new Story(typeof json === 'string' ? json : JSON.stringify(json));
  const vars = toInkVars(state);
  for (const [k, v] of Object.entries(vars)) {
    try { story.variablesState[k] = v; } catch { /* unknown var — ignore */ }
  }
  const panels = [];
  // Guard against an authoring loop: the saga is short; 500 lines is far
  // above any real length and prevents a runaway from hanging the tab.
  let guard = 0;
  while (story.canContinue && guard < 500) {
    guard += 1;
    const line = story.Continue().trim();
    if (!line) continue; // gating fall-through produced an empty line
    const t = parseTags(story.currentTags);
    panels.push({
      line,
      actor: t.actor || 'province',
      kicker: t.kicker || '',
      title: t.title || null,
    });
  }
  return panels;
}

// How many beats are currently unlocked — used for the "✦ new" pip on the
// stage (compare against the count last seen, persisted in the store).
export async function unlockedBeatCount(state) {
  const panels = await playSaga(state);
  return panels.length;
}
