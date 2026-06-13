// AvatarCreator — full pixel-character builder.
//
// Props: { avatar, onChange }
//
// - Big preview at top using <AvatarSprite>.
// - Row of slot tabs (Hair / Eyes / Top / Bottom / Shoes / Hat / Held).
// - Active tab shows a grid of variant chips; locked variants are dimmed and
//   show 🔒 with a tooltip hint explaining the unlock requirement.
// - Hair and Top tabs additionally expose a swatch row for the two color
//   slots (hair color, top color).
//
// Clicking a variant calls onChange({ [slot]: variantId }). Clicking a color
// swatch calls onChange({ hairColor: '#…' } | { topColor: '#…' }). The parent
// (typically the Byte Beast tab) wires onChange to the store's setAvatar
// action so changes persist.

import { useState } from 'react';
import AvatarSprite from './AvatarSprite.jsx';
import {
  AVATAR_PARTS,
  AVATAR_COLORS,
  AVATAR_SLOTS,
  isUnlocked,
  unlockHint,
} from '../data/avatarParts.js';
import { TAMERS, TAMER_KEYS, tamerSrc } from '../data/tamers.js';
import { useStore } from '../store/useStore.js';

export default function AvatarCreator({ avatar, onChange }) {
  const [slot, setSlot] = useState('hair');
  const completed = useStore((s) => s.completed);
  const slotMeta = AVATAR_SLOTS.find((s) => s.key === slot) || AVATAR_SLOTS[0];
  const variants = AVATAR_PARTS[slot] || [];
  const currentId = avatar?.[slot] ?? 0;
  const activeTamer = avatar?.tamer && TAMERS[avatar.tamer] ? avatar.tamer : null;

  const colorKey = slotMeta.colorKey;
  const colorField = colorKey === 'hair' ? 'hairColor' : colorKey === 'top' ? 'topColor' : null;
  const colorList = colorKey ? AVATAR_COLORS[colorKey] : null;
  const currentColor = colorField ? avatar?.[colorField] : null;

  return (
    <div className="avatar-creator">
      {/* Preview ─────────────────────────────────────── */}
      <div className="avatar-stage">
        <AvatarSprite avatar={avatar} size={120} />
      </div>

      {/* Tamer presets — PixelLab-drawn Beast Tamers. Picking one swaps the
          whole look; "Custom" returns to the layered part-builder below. */}
      <div className="kicker" style={{ margin: '10px 0 6px' }}>Beast Tamer</div>
      <div className="avatar-variants">
        <button
          type="button"
          className={`avatar-variant ${activeTamer ? '' : 'active'}`}
          title="Build your own from parts"
          onClick={() => onChange({ tamer: null })}
        >
          <span className="avatar-variant-preview" aria-hidden="true">
            <AvatarSprite avatar={{ ...(avatar || {}), tamer: null }} size={44} />
          </span>
          <span className="avatar-variant-name">Custom</span>
        </button>
        {TAMER_KEYS.map((id) => (
          <button
            key={id}
            type="button"
            className={`avatar-variant ${activeTamer === id ? 'active' : ''}`}
            title={`${TAMERS[id].name} — ${TAMERS[id].epithet}`}
            onClick={() => onChange({ tamer: id })}
          >
            <span className="avatar-variant-preview" aria-hidden="true">
              <img
                src={tamerSrc(id)}
                alt=""
                width={44}
                height={44}
                draggable={false}
                style={{ width: 44, height: 44, objectFit: 'contain', imageRendering: 'pixelated' }}
              />
            </span>
            <span className="avatar-variant-name">{TAMERS[id].name}</span>
          </button>
        ))}
      </div>

      {/* The part-builder only applies to the Custom avatar — hide it while
          a Tamer preset is wearing the stage. */}
      {activeTamer ? (
        <p className="caption avatar-creator-foot">
          {TAMERS[activeTamer].name} — {TAMERS[activeTamer].epithet}. Switch to Custom to build your own.
        </p>
      ) : (
        <CustomBuilder
          avatar={avatar}
          onChange={onChange}
          slot={slot}
          setSlot={setSlot}
          completed={completed}
          variants={variants}
          currentId={currentId}
          colorKey={colorKey}
          colorField={colorField}
          colorList={colorList}
          currentColor={currentColor}
        />
      )}
    </div>
  );
}

function CustomBuilder({ avatar, onChange, slot, setSlot, completed, variants, currentId, colorKey, colorField, colorList, currentColor }) {
  return (
    <>
      {/* Slot tabs ───────────────────────────────────── */}
      <div className="avatar-slots" role="tablist" aria-label="Avatar slots">
        {AVATAR_SLOTS.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={slot === s.key}
            className={`avatar-slot ${slot === s.key ? 'active' : ''}`}
            onClick={() => setSlot(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Color swatches (Hair / Top only) ────────────── */}
      {colorList && colorField && (
        <div className="avatar-color-row">
          <span className="kicker" style={{ marginRight: 8 }}>
            {colorKey === 'hair' ? 'Hair color' : 'Top color'}
          </span>
          {colorList.map((hex) => (
            <button
              key={hex}
              type="button"
              className={`avatar-color-swatch ${currentColor === hex ? 'active' : ''}`}
              style={{ background: hex }}
              aria-label={`${colorKey} color ${hex}`}
              onClick={() => onChange({ [colorField]: hex })}
            />
          ))}
        </div>
      )}

      {/* Variant grid ────────────────────────────────── */}
      <div className="avatar-variants">
        {variants.map((v) => {
          const unlocked = isUnlocked(v.unlock, completed);
          const active = currentId === v.id;
          const hint = unlocked ? v.name : unlockHint(v.unlock);
          return (
            <button
              key={v.id}
              type="button"
              className={`avatar-variant ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}`}
              title={hint}
              disabled={!unlocked}
              onClick={() => unlocked && onChange({ [slot]: v.id })}
            >
              <span className="avatar-variant-preview" aria-hidden="true">
                <VariantPreview slot={slot} variant={v} avatar={avatar} />
              </span>
              <span className="avatar-variant-name">{v.name}</span>
              {!unlocked && <span className="avatar-variant-lock" aria-hidden="true">🔒</span>}
            </button>
          );
        })}
      </div>

      <p className="caption avatar-creator-foot">
        Some items unlock as you complete paths.
      </p>
    </>
  );
}

// Tiny per-cell preview — render the entire avatar but with this slot's
// variant overridden so the chip shows what you'd be picking. Cheap and keeps
// the look consistent with the big preview.
function VariantPreview({ slot, variant, avatar }) {
  const overlay = { ...(avatar || {}), [slot]: variant.id };
  return <AvatarSprite avatar={overlay} size={44} />;
}
