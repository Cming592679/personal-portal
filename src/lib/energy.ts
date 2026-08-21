export interface EnergyLevel {
  level: 1 | 2 | 3;
  label: string;
  emoji: string;
  dot: string;
  desc: string;
}

export const ENERGY_LEVELS: EnergyLevel[] = [
  { level: 1, label: "枯竭", emoji: "🔴", dot: "#f85149", desc: "需要休息，优先恢复" },
  { level: 2, label: "还行", emoji: "🟡", dot: "#d29922", desc: "维持运转，别太勉强" },
  { level: 3, label: "活力无限", emoji: "🟢", dot: "#3fb950", desc: "精力充沛，适合攻坚" },
];

export function energyLabel(level: number): string {
  return ENERGY_LEVELS.find((e) => e.level === level)?.label ?? String(level);
}

export function energyEmoji(level: number): string {
  return ENERGY_LEVELS.find((e) => e.level === level)?.emoji ?? "⚪";
}
