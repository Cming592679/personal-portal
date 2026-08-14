import path from "path";

// 个人数据根目录（外部存储，绝不进入 Git）。
// 仅在服务端使用；不要在浏览器端引用（非 NEXT_PUBLIC）。
export function getPersonalDataDir(): string {
  const dir = process.env.PERSONAL_DATA_DIR;
  if (!dir || !dir.trim()) {
    throw new Error(
      "PERSONAL_DATA_DIR is not configured. 请在项目根目录创建 .env.local 并设置，例如：PERSONAL_DATA_DIR=/home/cc/personal-portal-data"
    );
  }
  return dir.trim();
}

// 拼接个人数据目录下的相对路径，例如 getDataPath("portal.db") / getDataPath("task-logs")。
export function getDataPath(...segments: string[]): string {
  return path.join(getPersonalDataDir(), ...segments);
}
