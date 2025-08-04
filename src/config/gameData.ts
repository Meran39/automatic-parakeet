import { Weapon, Food, WeaponType, FoodType } from '../types';

export const WEAPONS: { [key in WeaponType]: Weapon } = {
  'ナイフ': { name: 'ナイフ', damage: 10, range: 5, type: 'melee' },
  '刀': { name: '刀', damage: 25, range: 7, type: 'melee' },
  'ピストル': { name: 'ピストル', damage: 20, range: 50, type: 'ranged' },
  'ライフル': { name: 'ライフル', damage: 40, range: 100, type: 'ranged' },
};

export const FOOD: { [key in FoodType]: Food } = {
  'パン': { name: 'パン', hungerRecovery: 30 },
  'おにぎり': { name: 'おにぎり', hungerRecovery: 40 },
  '水': { name: '水', hungerRecovery: 10 },
  'フルーツジュース': { name: 'フルーツジュース', hungerRecovery: 20, happinessBonus: 5 },
  'エナジードリンク': { name: 'エナジードリンク', hungerRecovery: 5, happinessBonus: 10 }, // エネルギー回復は別で実装
};
