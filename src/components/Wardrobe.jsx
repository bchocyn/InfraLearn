// Wardrobe — the player's look + loadout (replaces the old AvatarCreator).
//
// The custom build-from-parts avatar is gone; a look now comes from exactly
// two sources, shown under a two-segment toggle:
//   • LOOKS — the 8 Beast Tamer presets.
//   • ARMOR — the 24 wearable armor sets (8 provinces × bronze/silver/gold),
//     unlocked by path completion, each gold set wielding a legendary weapon.
// A persistent loadout strip up top shows who you are + your weapon. Picking a
// Tamer clears armor and vice-versa (they're one exclusive "look"), via the
// store's setAvatar.

import { useState } from 'react';
import AvatarSprite, { DEFAULT_TAMER } from './AvatarSprite.jsx';
import { TAMERS, TAMER_KEYS, tamerSrc } from '../data/tamers.js';
import {
  ARMOR_SETS,
  ARMOR_BY_PATH,
  ARMOR_KEYS,
  armorSrc,
  weaponSrc,
  isArmorUnlocked,
  armorUnlockHint,
} from '../data/armorSets.js';
import { useStore } from '../store/useStore.js';

const thumb = { width: 44, height: 44, objectFit: 'contain', imageRendering: 'pixelated' };
const provLabel = (path) => ARMOR_BY_PATH.find((p) => p.path === path)?.label || path;

export default function Wardrobe({ avatar, onChange }) {
  const completed = useStore((s) => s.completed);
  const [pane, setPane] = useState('looks');
  const activeArmor = avatar?.armor && ARMOR_SETS[avatar.armor] ? avatar.armor : null;
  const activeTamer = avatar?.tamer && TAMERS[avatar.tamer] ? avatar.tamer : null;
  const owned = ARMOR_KEYS.filter((id) => isArmorUnlocked(id, completed)).length;

  return (
    <div className="wardrobe">
      <LoadoutStrip avatar={avatar} activeArmor={activeArmor} activeTamer={activeTamer} />

      <div className="wardrobe-seg" role="tablist" aria-label="Wardrobe source">
        <button
          type="button" role="tab" aria-selected={pane === 'looks'}
          className={pane === 'looks' ? 'on' : ''}
          onClick={() => setPane('looks')}
        >
          {pane === 'looks' ? '● ' : ''}LOOKS
        </button>
        <button
          type="button" role="tab" aria-selected={pane === 'armor'}
          className={pane === 'armor' ? 'on' : ''}
          onClick={() => setPane('armor')}
        >
          {pane === 'armor' ? '● ' : ''}ARMOR · {owned}/{ARMOR_KEYS.length}
        </button>
      </div>

      {pane === 'looks' ? (
        <LooksPane onChange={onChange} activeArmor={activeArmor} activeTamer={activeTamer} />
      ) : (
        <ArmorPane onChange={onChange} completed={completed} activeArmor={activeArmor} />
      )}
    </div>
  );
}

// Always-visible summary of the equipped look + (for armor) its legendary
// weapon — the thing the old buried <details> never surfaced.
function LoadoutStrip({ avatar, activeArmor, activeTamer }) {
  if (activeArmor) {
    const set = ARMOR_SETS[activeArmor];
    return (
      <div className="loadout-strip">
        <span className="loadout-fig"><AvatarSprite avatar={avatar} size={48} /></span>
        <div className="loadout-meta">
          <div className="loadout-name">{set.name}</div>
          <span className="pill loadout-pill">{provLabel(set.path)} · {set.tier.toUpperCase()} ★</span>
          {set.weapon ? (
            <div className="loadout-weapon">
              <img src={weaponSrc(set.path)} alt="" />{set.weapon}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
  const t = TAMERS[activeTamer || DEFAULT_TAMER];
  return (
    <div className="loadout-strip">
      <span className="loadout-fig"><AvatarSprite avatar={{ ...(avatar || {}), armor: null }} size={48} /></span>
      <div className="loadout-meta">
        <div className="loadout-name">{t.name}</div>
        <div className="caption">{t.epithet}</div>
        <div className="loadout-weapon caption">No armor equipped — earn sets by path mastery.</div>
      </div>
    </div>
  );
}

// LOOKS — the 8 Beast Tamers. Selecting one clears any equipped armor.
function LooksPane({ onChange, activeArmor, activeTamer }) {
  const currentLook = activeArmor ? null : (activeTamer || DEFAULT_TAMER);
  return (
    <>
      <div className="wardrobe-head">
        <span className="kicker">Beast Tamers</span>
        <span className="caption">{TAMER_KEYS.length} looks</span>
      </div>
      <div className="avatar-variants">
        {TAMER_KEYS.map((id) => (
          <button
            key={id}
            type="button"
            className={`avatar-variant ${currentLook === id ? 'active' : ''}`}
            title={`${TAMERS[id].name} — ${TAMERS[id].epithet}`}
            onClick={() => onChange({ tamer: id, armor: null })}
          >
            <span className="avatar-variant-preview" aria-hidden="true">
              <img src={tamerSrc(id)} alt="" width={44} height={44} draggable={false} style={thumb} />
            </span>
            <span className="avatar-variant-name">{TAMERS[id].name}</span>
          </button>
        ))}
      </div>
      <p className="caption avatar-creator-foot">
        Tamers are always available. Armor is earned by path mastery.
      </p>
    </>
  );
}

// ARMOR — per-province bronze→silver→gold lines with locked states + the
// gold tier's wielded weapon badge. Selecting one clears any equipped Tamer.
function ArmorPane({ onChange, completed, activeArmor }) {
  return (
    <div className="wardrobe-armor">
      {ARMOR_BY_PATH.map(({ path, label, tiers }) => {
        const ownedInLine = tiers.filter((id) => isArmorUnlocked(id, completed)).length;
        const complete = ownedInLine === 3;
        return (
          <div key={path} className="armor-prov">
            <div className="prov-head">
              <span className="prov-nm">{label}</span>
              <span className={`prov-st ${complete ? 'gold' : ''}`}>
                {ownedInLine}/3{complete ? ' · GOLD' : ''}
              </span>
            </div>
            <div className="avatar-variants">
              {tiers.map((id) => {
                const set = ARMOR_SETS[id];
                const unlocked = isArmorUnlocked(id, completed);
                const active = activeArmor === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`avatar-variant ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}`}
                    title={unlocked ? `${set.name} — ${set.epithet}` : armorUnlockHint(id)}
                    disabled={!unlocked}
                    onClick={() => unlocked && onChange({ armor: id, tamer: null })}
                  >
                    <span className="avatar-variant-preview" aria-hidden="true">
                      <img src={armorSrc(id)} alt="" width={44} height={44} draggable={false} style={thumb} />
                    </span>
                    <span className="avatar-variant-name">{set.tier}</span>
                    {set.weapon ? (
                      <img className="avatar-armor-weapon" src={weaponSrc(path)} alt="" title={set.weapon} draggable={false} />
                    ) : null}
                    {!unlocked && <span className="avatar-variant-lock" aria-hidden="true">🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
