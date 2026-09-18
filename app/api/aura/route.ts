import { NextResponse } from "next/server";
import { getAuraResponse } from "@/lib/auraSearch";

// Powers the floating Aura widget (client-side, no page navigation). The
// full /aura page uses the same lib/auraSearch helper directly server-side.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const response = await getAuraResponse(q);
  return NextResponse.json(response);
}
