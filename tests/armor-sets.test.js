// Armor sets: data integrity, unlock gating, sprite paths, store persistence,
// and AvatarSprite/AvatarCreator rendering. Client-rendered via createRoot/act
// (same harness as the other screen tests — renderToString only sees zustand's
// initial state under v4).

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useStore } from '../src/store/useStore.js';
import { PATHS, PATH_KEYS } from '../src/data/content.js';
import {
  ARMOR_SETS,
  ARMOR_KEYS,
  ARMOR_BY_PATH,
  ARMOR_TIERS,
  isArmorUnlocked,
  armorUnlockHint,
  armorSrc,
  weaponSrc,
} from '../src/data/armorSets.js';
import AvatarSprite from '../src/components/AvatarSprite.jsx';
import Wardrobe from '../src/components/Wardrobe.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function render(el) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(el));
  const html = container.innerHTML;
  act(() => root.unmount());
  container.remove();
  return html;
}

beforeEach(() => {
  localStorage.clear();
  useStore.getState().resetAll();
});

describe('armor set data', () => {
  it('defines a bronze/silver/gold line for all eight provinces', () => {
    expect(ARMOR_BY_PATH).toHaveLength(8);
    expect(ARMOR_KEYS).toHaveLength(24);
    for (const path of PATH_KEYS) {
      for (const tier of ARMOR_TIERS) {
        const set = ARMOR_SETS[`${path}_${tier}`];
        expect(set, `${path}_${tier} missing`).toBeTruthy();
        expect(set.name).toBeTruthy();
        expect(set.epithet).toBeTruthy();
        expect(set.path).toBe(path);
        expect(set.tier).toBe(tier);
      }
    }
  });

  it('only the gold tier carries a legendary weapon', () => {
    for (const id of ARMOR_KEYS) {
      const set = ARMOR_SETS[id];
      if (set.tier === 'gold') expect(set.weapon, `${id} should have a weapon`).toBeTruthy();
      else expect(set.weapon, `${id} should not have a weapon`).toBeNull();
    }
  });

  it('builds sprite/weapon paths under the public/armor dir', () => {
    expect(armorSrc('faang_gold')).toMatch(/armor\/faang_gold\.png$/);
    expect(weaponSrc('faang')).toMatch(/armor\/weapon_faang\.png$/);
  });
});

describe('armor unlock gating', () => {
  it('locks every tier on a fresh account and unlocks by path progress', () => {
    // Fresh store → nothing earned.
    for (const id of ARMOR_KEYS) {
      expect(isArmorUnlocked(id, {})).toBe(false);
    }
    // Complete every fundamentals lesson → its full line unlocks; other
    // provinces stay locked.
    const completed = {};
    for (const l of PATHS.fundamentals.lessons) completed[l.id] = true;
    expect(isArmorUnlocked('fundamentals_bronze', completed)).toBe(true);
    expect(isArmorUnlocked('fundamentals_silver', completed)).toBe(true);
    expect(isArmorUnlocked('fundamentals_gold', completed)).toBe(true);
    expect(isArmorUnlocked('faang_bronze', completed)).toBe(false);
  });

  it('gives a tier-aware unlock hint for locked sets', () => {
    expect(armorUnlockHint('faang_gold')).toMatch(/Gold/);
    expect(armorUnlockHint('faang_gold')).toMatch(/100%/);
    expect(armorUnlockHint('cybersec_bronze')).toMatch(/Bronze/);
  });
});

describe('AvatarSprite armor rendering', () => {
  it('renders the equipped armor figure in place of the custom build', () => {
    const html = render(createElement(AvatarSprite, { avatar: { armor: 'mlops_gold' }, size: 64 }));
    expect(html).toContain('armor/mlops_gold.png');
  });

  it('armor outranks a tamer when both are set', () => {
    const html = render(
      createElement(AvatarSprite, { avatar: { armor: 'swe_gold', tamer: 'ember_warden' }, size: 64 })
    );
    expect(html).toContain('armor/swe_gold.png');
    expect(html).not.toContain('tamers/ember_warden');
  });

  it('defaults to a Beast Tamer when no armor/tamer is set (custom avatar removed)', () => {
    const html = render(createElement(AvatarSprite, { avatar: {}, size: 64 }));
    expect(html).not.toContain('armor/');
    expect(html).toContain('tamers/ember_warden');
    expect(html).not.toContain('<svg');
  });

  it('wields the gold set\'s legendary weapon on the figure', () => {
    const html = render(createElement(AvatarSprite, { avatar: { armor: 'faang_gold' }, size: 64 }));
    expect(html).toContain('armor/faang_gold.png');
    expect(html).toContain('armor/weapon_faang.png'); // overlaid, held
  });
});

describe('Wardrobe', () => {
  it('surfaces the equipped set + wielded weapon in the loadout strip + a collection counter', () => {
    const completed = {};
    for (const l of PATHS.faang.lessons) completed[l.id] = true;
    useStore.setState({ completed });

    const html = render(
      createElement(Wardrobe, { avatar: { armor: 'faang_gold' }, onChange: () => {} })
    );
    expect(html).toContain('Ancient Dragon Lord');
    expect(html).toContain('armor/weapon_faang.png');
    // Looks/Armor toggle exposes the x/24 collection counter.
    expect(html).toMatch(/ARMOR\s*·\s*\d+\/24/);
  });
});

describe('armor persistence', () => {
  it('round-trips a valid armor id and rejects an unknown one on import', () => {
    // exportData wraps state under `data` — write the armor field there.
    const blob = JSON.parse(useStore.getState().exportData());
    blob.data.avatar = { ...blob.data.avatar, armor: 'faang_gold' };
    useStore.getState().importData(JSON.stringify(blob), 'replace');
    expect(useStore.getState().avatar.armor).toBe('faang_gold');

    blob.data.avatar = { ...blob.data.avatar, armor: 'not_a_real_set' };
    useStore.getState().importData(JSON.stringify(blob), 'replace');
    expect(useStore.getState().avatar.armor).toBeNull();
  });
});
