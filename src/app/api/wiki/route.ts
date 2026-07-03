import { NextRequest, NextResponse } from "next/server";
import fs from "fs";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") ?? "";
  const wikiIndexPath = "/home/cc/Acai-Knowledge/wiki/index.md";

  try {
    const content = fs.readFileSync(wikiIndexPath, "utf-8");
    const lines = content.split("\n").filter((l) => l.startsWith("|") && !l.includes("---") && !l.includes("标题 | 类型"));

    let results = lines.map((line) => {
      const cols = line.split("|").map((c) => c.trim());
      return {
        title: cols[1] ?? "",
        type: cols[2] ?? "",
        aliases: cols[3] ?? "",
        summary: cols[4] ?? "",
        related: cols[5] ?? "",
        status: cols[6] ?? "",
      };
    });

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.aliases.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ results: results.slice(0, 20), total: results.length });
  } catch {
    return NextResponse.json({ results: [], total: 0, error: "wiki not found" });
  }
}
