import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare("DELETE FROM subscriptions WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
