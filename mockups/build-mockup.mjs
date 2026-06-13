// Builds a self-contained HTML mockup of the Byte Beast "Wardrobe" tab
// redesign (see BEAST_TABS_MOCKUP.md). Real sprite art is inlined as base64
// so the single .html opens anywhere with no asset dependencies. Run:
//   node mockups/build-mockup.mjs  →  mockups/beast-tabs-mockup.html
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const enc = (rel) => {
  try { return 'data:image/png;base64,' + readFileSync(root + rel).toString('base64'); }
  catch { return ''; }
};

const A = {
  // loadout hero + weapon
  faang_gold: enc('public/armor/faang_gold.png'),
  weapon_faang: enc('public/armor/weapon_faang.png'),
  // FAANG + DevOps armor lines (chips)
  faang_bronze: enc('public/armor/faang_bronze.png'),
  faang_silver: enc('public/armor/faang_silver.png'),
  devops_bronze: enc('public/armor/devops_bronze.png'),
  devops_silver: enc('public/armor/devops_silver.png'),
  devops_gold: enc('public/armor/devops_gold.png'),
  mlops_bronze: enc('public/armor/mlops_bronze.png'),
  // tamers
  ember: enc('public/tamers/ember_warden_south.png'),
  tide: enc('public/tamers/tide_caller_south.png'),
  thorn: enc('public/tamers/thorn_ranger_south.png'),
  sky: enc('public/tamers/sky_courier_south.png'),
  cipher: enc('public/tamers/cipher_sage_south.png'),
  circuit: enc('public/tamers/circuit_smith_south.png'),
  nullw: enc('public/tamers/null_walker_south.png'),
  dawn: enc('public/tamers/dawn_shield_south.png'),
};

// A figure (tamer or armor set) optionally WIELDING its legendary weapon —
// the weapon sprite is overlaid at the hand, angled, so it reads as held.
const heldFigure = (fig, wpn, w, h, cls = 'hero') => `
  <span class="fig" style="width:${w}px;height:${h}px">
    <img class="${cls}" src="${fig}" alt="" style="width:${w}px;height:${h}px;object-fit:contain;image-rendering:pixelated">
    ${wpn ? `<img class="held" src="${wpn}" alt="" style="width:${Math.round(w * 0.5)}px;left:${Math.round(w * 0.5)}px;bottom:${Math.round(h * 0.08)}px">` : ''}
  </span>`;

const chip = (img, label, { mark = '', locked = false, weapon = '' } = {}) => `
  <button class="variant ${locked ? 'locked' : ''} ${mark === 'on' ? 'active' : ''}">
    <span class="variant-prev">${img ? `<img src="${img}" alt="">` : ''}</span>
    <span class="variant-name">${label}</span>
    ${mark === 'on' ? '<span class="variant-mark">●</span>' : ''}
    ${mark === '✓' ? '<span class="variant-mark ok">✓</span>' : ''}
    ${weapon ? `<img class="variant-weapon" src="${weapon}" alt="">` : ''}
    ${locked ? '<span class="variant-lock">🔒</span>' : ''}
  </button>`;

const tamers = [
  [A.ember, 'Ember'], [A.tide, 'Tide', '✓'], [A.thorn, 'Thorn'], [A.sky, 'Sky'],
  [A.cipher, 'Cipher'], [A.circuit, 'Circuit'], [A.nullw, 'Null'], [A.dawn, 'Dawn'],
];

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Byte Beast — Wardrobe Redesign Mockup</title>
<style>
  :root{
    --bg-base:#0B0A08;--bg-elevated:#13110E;--bg-card:#17140F;--bg-card-hover:#1D1A14;
    --border-subtle:#2A2620;--border-default:#3A352D;--border-strong:#4D4639;
    --text-primary:#F4EFE3;--text-secondary:#C7BFA9;--text-tertiary:#8E8773;--text-quaternary:#5C574A;
    --accent-amber:#F5B842;--accent-amber-dim:#C99634;--accent-amber-bg:rgba(245,184,66,.08);
    --el-fire:#E07856;--status-success:#8FA876;
    --serif:"Fraunces",Georgia,serif;--mono:"JetBrains Mono",ui-monospace,monospace;
  }
  *{box-sizing:border-box}
  body{margin:0;background:#070605;color:var(--text-primary);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    padding:24px 12px 60px;line-height:1.5}
  .page-title{max-width:820px;margin:0 auto 6px;font-family:var(--serif);font-size:26px}
  .page-sub{max-width:820px;margin:0 auto 22px;color:var(--text-secondary);font-size:14px}
  .row{display:flex;gap:24px;flex-wrap:wrap;justify-content:center;align-items:flex-start}
  .col{display:flex;flex-direction:column;gap:14px;align-items:center}
  .label{font-family:var(--mono);font-size:11px;letter-spacing:.12em;color:var(--accent-amber);
    text-transform:uppercase}
  .recommended{color:var(--status-success)}
  /* phone frame */
  .phone{width:375px;background:var(--bg-base);border:1px solid var(--border-default);
    border-radius:22px;padding:14px 12px 16px;box-shadow:0 14px 40px rgba(0,0,0,.6)}
  .phone.small{width:300px;opacity:.96}
  .kicker{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;
    color:var(--accent-amber);margin:0 0 4px}
  .h1{font-family:var(--serif);font-size:24px;margin:0 0 6px}
  .h1 .dot{color:var(--accent-amber)}
  .pills{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
  .pill{font-family:var(--mono);font-size:9px;letter-spacing:.08em;border-radius:999px;
    padding:4px 8px;border:1px solid var(--border-strong);color:var(--text-secondary)}
  .pill.fire{border-color:var(--el-fire);color:var(--el-fire)}
  .pill.gold{border-color:var(--accent-amber);color:var(--accent-amber)}
  .caption{font-size:11px;color:var(--text-secondary)}
  /* beast stage */
  .stage{position:relative;height:150px;border-radius:12px;overflow:hidden;margin-bottom:12px;
    background:linear-gradient(180deg,#16263a 0%,#3a4a63 48%,#5c4a3a 78%,#2a2018 100%);
    border:1px solid var(--border-subtle)}
  .stage-label{position:absolute;top:8px;left:10px;font-family:var(--mono);font-size:9px;
    letter-spacing:.12em;color:var(--accent-amber);opacity:.9}
  .stage-figs{position:absolute;bottom:8px;left:0;right:0;display:flex;gap:10px;
    align-items:flex-end;justify-content:center}
  .stage-figs img{image-rendering:pixelated}
  .stage .beast{font-size:64px;filter:drop-shadow(0 6px 6px rgba(0,0,0,.5))}
  /* tabs */
  .tabs{display:flex;gap:6px;margin-bottom:12px}
  .tab{flex:1;text-align:center;font-family:var(--mono);font-size:11px;letter-spacing:.02em;
    padding:9px 4px;border:1px solid var(--border-default);border-radius:9px;
    color:var(--text-secondary);white-space:nowrap}
  .tab.active{border-color:var(--accent-amber);color:var(--accent-amber)}
  /* loadout strip */
  .loadout{display:flex;gap:12px;align-items:center;background:var(--bg-card);
    border:1px solid var(--accent-amber);border-radius:12px;padding:10px 12px;margin-bottom:12px;
    background-image:linear-gradient(135deg,rgba(245,184,66,.12),rgba(224,120,86,.06))}
  .loadout img.hero{width:54px;height:81px;object-fit:contain;image-rendering:pixelated}
  .fig{position:relative;display:inline-block;flex:0 0 auto}
  .fig .held{position:absolute;image-rendering:pixelated;transform:rotate(38deg);
    transform-origin:bottom center;filter:drop-shadow(0 2px 3px rgba(0,0,0,.65))}
  .loadout .meta{display:flex;flex-direction:column;gap:3px}
  .loadout .name{font-family:var(--serif);font-size:17px}
  .loadout .sub{display:flex;gap:6px;align-items:center}
  .loadout .weapon{display:flex;gap:5px;align-items:center;font-size:11px;color:var(--text-secondary)}
  .loadout .weapon img{width:18px;height:24px;object-fit:contain;image-rendering:pixelated}
  /* segmented toggle */
  .seg{display:flex;border:1px solid var(--border-strong);border-radius:10px;overflow:hidden;margin-bottom:14px}
  .seg div{flex:1;text-align:center;padding:9px;font-family:var(--mono);font-size:11px;letter-spacing:.06em;
    color:var(--text-secondary)}
  .seg div.on{background:var(--accent-amber-bg);color:var(--accent-amber);
    box-shadow:inset 0 -2px 0 var(--accent-amber)}
  /* variant grid */
  .grid-head{display:flex;justify-content:space-between;align-items:baseline;margin:2px 0 8px}
  .variants{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .variants.armor{grid-template-columns:repeat(3,1fr)}
  .variant{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;
    background:var(--bg-card);border:1.5px solid var(--border-subtle);border-radius:10px;
    padding:8px 4px 6px;color:var(--text-secondary);font:inherit}
  .variant.active{border-color:var(--accent-amber)}
  .variant.locked{opacity:.45}
  .variant-prev{width:44px;height:44px;display:flex;align-items:flex-end;justify-content:center}
  .variant-prev img{width:44px;height:44px;object-fit:contain;image-rendering:pixelated}
  .variant-name{font-family:var(--mono);font-size:8px;letter-spacing:.06em;text-transform:uppercase}
  .variant-mark{position:absolute;top:4px;left:5px;font-size:10px;color:var(--accent-amber)}
  .variant-mark.ok{color:var(--status-success)}
  .variant-weapon{position:absolute;bottom:3px;left:3px;width:15px;height:15px;object-fit:contain;
    image-rendering:pixelated;filter:drop-shadow(0 1px 2px #000)}
  .variant-lock{position:absolute;top:4px;right:5px;font-size:11px}
  .prov-head{display:flex;justify-content:space-between;align-items:baseline;margin:12px 0 6px}
  .prov-head .nm{font-family:var(--serif);font-size:13px}
  .prov-head .st{font-family:var(--mono);font-size:9px;color:var(--text-tertiary)}
  .prov-head .st.gold{color:var(--accent-amber)}
  .foot{font-size:11px;color:var(--text-tertiary);margin-top:12px}
  .mini{font-size:11px;color:var(--text-secondary)}
  .note{max-width:820px;margin:26px auto 0;padding:14px 16px;border:1px solid var(--border-default);
    border-radius:12px;background:var(--bg-elevated);font-size:13px;color:var(--text-secondary)}
  .note b{color:var(--text-primary)}
  /* compact concept sketches */
  .sketch{font-family:var(--mono);font-size:10px;color:var(--text-secondary);white-space:pre;
    background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:10px;padding:12px;
    line-height:1.45}
</style></head>
<body>
  <h1 class="page-title">Byte Beast — Wardrobe tab redesign</h1>
  <p class="page-sub">Three concepts for reworking the cramped <b>AVATAR</b> tab now that the
  custom part-builder is removed and 24 armor sets + 8 weapons landed. <b>Concept B is
  recommended.</b> Open this file in a browser; reply with the concept you want built.</p>

  <div class="row">
    <!-- ============ CONCEPT B (recommended) — LOOKS pane ============ -->
    <div class="col">
      <div class="label recommended">★ Concept B · Wardrobe + Looks/Armor toggle</div>
      <div class="phone">
        <div class="kicker">BYTE BEAST</div>
        <div class="h1">Pyre Wyrm<span class="dot">.</span></div>
        <div class="pills">
          <span class="pill">TIER 3 · DRAGON</span>
          <span class="pill fire">🔥 FIRE</span>
          <span class="pill">🏆 TROPHIES</span>
          <span class="pill">📖 CODEX</span>
        </div>
        <div class="stage">
          <div class="stage-label">MEADOW</div>
          <div class="stage-figs">
            ${heldFigure(A.faang_gold, A.weapon_faang, 46, 69)}
            <span class="beast">🐉</span>
          </div>
        </div>
        <div class="tabs">
          <div class="tab">🧬 EVOLVE</div><div class="tab">🖼 SCENES</div>
          <div class="tab">🏆 BADGES</div><div class="tab active">🎽 WRDRB</div>
        </div>
        <div class="kicker">Equipped loadout</div>
        <div class="loadout">
          ${heldFigure(A.faang_gold, A.weapon_faang, 54, 81)}
          <div class="meta">
            <div class="name">Ancient Dragon Lord</div>
            <div class="sub"><span class="pill gold">FAANG · GOLD ★</span></div>
            <div class="weapon"><img src="${A.weapon_faang}" alt="">Flamebrand</div>
          </div>
        </div>
        <div class="seg"><div class="on">● LOOKS</div><div>ARMOR · 7/24</div></div>
        <div class="grid-head"><span class="kicker">Beast Tamers</span><span class="caption">8 looks</span></div>
        <div class="variants">
          ${tamers.map(([img, name, m]) => chip(img, name, { mark: m === '✓' ? '✓' : '' })).join('')}
        </div>
        <div class="foot">Tamers are always available. Armor is earned by path mastery.</div>
      </div>
    </div>

    <!-- ============ CONCEPT B — ARMOR pane ============ -->
    <div class="col">
      <div class="label">Concept B · Armor pane (toggle flipped)</div>
      <div class="phone">
        <div class="kicker">BYTE BEAST</div>
        <div class="h1">Pyre Wyrm<span class="dot">.</span></div>
        <div class="pills">
          <span class="pill">TIER 3 · DRAGON</span><span class="pill fire">🔥 FIRE</span>
          <span class="pill">🗺 JOURNEY</span>
        </div>
        <div class="tabs">
          <div class="tab">🧬 EVOLVE</div><div class="tab">🖼 SCENES</div>
          <div class="tab">🏆 BADGES</div><div class="tab active">🎽 WRDRB</div>
        </div>
        <div class="kicker">Equipped loadout</div>
        <div class="loadout">
          ${heldFigure(A.faang_gold, A.weapon_faang, 54, 81)}
          <div class="meta">
            <div class="name">Ancient Dragon Lord</div>
            <div class="sub"><span class="pill gold">FAANG · GOLD ★</span></div>
            <div class="weapon"><img src="${A.weapon_faang}" alt="">Flamebrand</div>
          </div>
        </div>
        <div class="seg"><div>LOOKS</div><div class="on">● ARMOR · 7/24</div></div>
        <div class="prov-head"><span class="nm">FAANG Prep</span><span class="st gold">3/3 · GOLD</span></div>
        <div class="variants armor">
          ${chip(A.faang_bronze, 'Bronze', { mark: '✓' })}
          ${chip(A.faang_silver, 'Silver', { mark: '✓' })}
          ${chip(A.faang_gold, 'Gold', { mark: 'on', weapon: A.weapon_faang })}
        </div>
        <div class="prov-head"><span class="nm">DevOps</span><span class="st">1/3</span></div>
        <div class="variants armor">
          ${chip(A.devops_bronze, 'Bronze', { mark: '✓' })}
          ${chip(A.devops_silver, 'Silver', { locked: true })}
          ${chip(A.devops_gold, 'Gold', { locked: true, weapon: A.weapon_faang })}
        </div>
        <div class="prov-head"><span class="nm">MLOps</span><span class="st">0/3 🔒</span></div>
        <div class="variants armor">
          ${chip(A.mlops_bronze, 'Bronze', { locked: true })}
          ${chip(A.devops_silver, 'Silver', { locked: true })}
          ${chip(A.devops_gold, 'Gold', { locked: true })}
        </div>
        <div class="foot">Fundamentals · SWE · ML Eng · Full-Stack · Cybersecurity ↓</div>
      </div>
    </div>
  </div>

  <!-- ============ A & C compact comparison ============ -->
  <div class="row" style="margin-top:30px">
    <div class="col">
      <div class="label">Concept A · split into a 5th tab</div>
      <div class="phone small">
        <div class="tabs" style="gap:4px">
          <div class="tab" style="font-size:9px;padding:7px 2px">🧬EVO</div>
          <div class="tab" style="font-size:9px;padding:7px 2px">🖼SCN</div>
          <div class="tab" style="font-size:9px;padding:7px 2px">🏆BDG</div>
          <div class="tab active" style="font-size:9px;padding:7px 2px">🎽WRDRB</div>
          <div class="tab" style="font-size:9px;padding:7px 2px">🧑TAMR</div>
        </div>
        <div class="sketch">EQUIPPED
[hero] Ancient Dragon Lord  GOLD★
       ⚔ Flamebrand        [Change]

ARMOR SETS              7 / 24
FAANG  [B✓][S✓][G★⚔]
DevOps [B✓][S🔒][G🔒]
…scroll 6 more provinces…</div>
        <div class="mini" style="margin-top:10px">Roomiest, but 5 tabs crowd 375px and
        re-split the two exclusive looks across a tab boundary.</div>
      </div>
    </div>
    <div class="col">
      <div class="label">Concept C · collection-book accordion</div>
      <div class="phone small">
        <div class="tabs" style="gap:4px">
          <div class="tab" style="font-size:10px;padding:7px 3px">🧬EVOLVE</div>
          <div class="tab" style="font-size:10px;padding:7px 3px">🖼SCN</div>
          <div class="tab" style="font-size:10px;padding:7px 3px">🏆BDG</div>
          <div class="tab active" style="font-size:10px;padding:7px 3px">🎽WRDRB</div>
        </div>
        <div class="sketch">Equipped: Dragon Lord ⚔
▼ BEAST TAMERS        1 worn
  [44][44✓][44][44]
▶ FAANG PREP        3/3 ★⚔
▶ DEVOPS            1/3
▶ FUNDAMENTALS      2/3
▶ MLOPS             0/3 🔒
▶ … 4 more provinces</div>
        <div class="mini" style="margin-top:10px">Most compact; "album to fill" framing —
        but 9 accordions = lots of tapping, can't compare two provinces at once.</div>
      </div>
    </div>
  </div>

  <div class="note">
    <b>Recommendation: Concept B.</b> Keeps the 4-tab bar people already know, turns the
    two remaining look-sources (8 Tamers + 24 Armor sets) into a clean Looks/Armor toggle,
    surfaces the equipped set + legendary weapon in a loadout strip, and gives armor a real
    collection view with an <b>x/24</b> counter and per-province progress. Reuses every
    existing armor helper — it's a presentation change, no new stored state.<br><br>
    Reply <b>"build B"</b> (or A / C) and I'll implement it, remove the custom avatar, and
    move the equipped figure onto the beast stage beside your companion.
  </div>
</body></html>`;

writeFileSync(root + 'mockups/beast-tabs-mockup.html', html);
console.log('wrote mockups/beast-tabs-mockup.html (' + (html.length / 1024).toFixed(0) + ' KB)');
