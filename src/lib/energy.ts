// 心力状态 5 级常量，供工作台快选、energy 路由、日历着色复用，避免标签/颜色漂移。
export const ENERGY_LEVELS = [
  { level: 1, label: "很低", dot: "#f85149", tint: "rgba(248,81,73,0.18)" },
  { level: 2, label: "较低", dot: "#f0883e", tint: "rgba(240,136,62,0.16)" },
  { level: 3, label: "一般", dot: "#d29922", tint: "rgba(210,153,34,0.16)" },
  { level: 4, label: "良好", dot: "#3fb950", tint: "rgba(63,185,80,0.16)" },
  { level: 5, label: "很高", dot: "#2da44e", tint: "rgba(45,164,78,0.2)" },
] as const;

export function energyLabel(level: number): string {
  return ENERGY_LEVELS.find((e) => e.level === level)?.label ?? String(level);
}

export function energyMeta(level: number) {
  return ENERGY_LEVELS.find((e) => e.level === level) ?? ENERGY_LEVELS[2];
}
