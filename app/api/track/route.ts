import { NextRequest, NextResponse } from "next/server";
import { recordHit } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const { page } = await req.json();

    // Get real IP — works behind Vercel / most proxies
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const ref = req.headers.get("referer") || undefined;
    const ua = req.headers.get("user-agent") || undefined;

    // Skip bot / health check traffic
    if (ua && /bot|crawl|spider|slurp|lighthouse|headless|prerender/i.test(ua)) {
      return NextResponse.json({ ok: true });
    }

    recordHit(page || "/", ip, ref, ua);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
