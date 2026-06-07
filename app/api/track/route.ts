import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageHits } from "@/lib/schema";

function deviceType(ua = ""): "mobile" | "tablet" | "desktop" {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

function browserName(ua = ""): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  if (/opera|opr\//i.test(ua)) return "Opera";
  return "Other";
}

function hashIp(ip: string): string {
  let h = 0;
  for (let i = 0; i < ip.length; i++)
    h = (Math.imul(31, h) + ip.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

export async function POST(req: NextRequest) {
  try {
    const { page } = await req.json();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";

    const ref = req.headers.get("referer") || undefined;
    const ua = req.headers.get("user-agent") || undefined;

    // Skip bots
    if (ua && /bot|crawl|spider|slurp|lighthouse|headless|prerender/i.test(ua)) {
      return NextResponse.json({ ok: true });
    }

    // Write to DB (fire-and-forget)
    db.insert(pageHits).values({
      page: (page || "/").slice(0, 256),
      ipHash: hashIp(ip).slice(0, 16),
      ref: ref?.slice(0, 500) ?? null,
      ua: ua?.slice(0, 500) ?? null,
      device: deviceType(ua),
      browser: browserName(ua),
    }).catch(e => console.error("[track] DB insert error:", e));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
