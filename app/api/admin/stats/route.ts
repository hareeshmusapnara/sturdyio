import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const secret = process.env.ADMIN_SECRET || "";

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rangeDays = parseInt(req.nextUrl.searchParams.get("range") || "14", 10);
  const safeRange = [7, 14, 30, 90].includes(rangeDays) ? rangeDays : 14;

  return NextResponse.json(getStats(safeRange));
}
