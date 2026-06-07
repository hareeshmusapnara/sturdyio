/**
 * Analytics — reads from Neon DB (page_hits table).
 * The file-based store is gone; all data lives in PostgreSQL.
 */

import { db } from "@/lib/db";
import { pageHits } from "@/lib/schema";
import { gte, sql } from "drizzle-orm";

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

export async function getStats(rangeDays = 14) {
  const now = new Date();
  const DAY = 86_400_000;
  const rangeStart = new Date(Date.now() - rangeDays * DAY);
  const dayStart = new Date(Date.now() - DAY);
  const weekStart = new Date(Date.now() - 7 * DAY);

  // Fetch all hits in the selected range
  const rangeHits = await db
    .select()
    .from(pageHits)
    .where(gte(pageHits.ts, rangeStart));

  // Today + week counts
  const todayHits = rangeHits.filter(h => h.ts >= dayStart);
  const weekHits = rangeHits.filter(h => h.ts >= weekStart);

  // All-time totals
  const [totalRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(pageHits);
  const totalVisits = Number(totalRow?.count ?? 0);

  const [uniqueRow] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ip_hash)` })
    .from(pageHits);
  const uniqueVisitors = Number(uniqueRow?.count ?? 0);

  // Unique in range
  const uniqueInRange = new Set(rangeHits.map(h => h.ipHash).filter(Boolean)).size;

  // Daily chart
  const dailyCounts: Record<string, number> = {};
  for (let i = rangeDays - 1; i >= 0; i--) {
    const key = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    dailyCounts[key] = 0;
  }
  for (const h of rangeHits) {
    const key = new Date(h.ts).toISOString().slice(0, 10);
    if (key in dailyCounts) dailyCounts[key]++;
  }
  const dailyChart = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

  // Hourly chart (last 24h)
  const last24 = rangeHits.filter(h => h.ts >= new Date(Date.now() - 24 * 3600_000));
  const hourlyCounts: Record<string, number> = {};
  for (let i = 23; i >= 0; i--) {
    const key = `${new Date(Date.now() - i * 3600_000).getHours().toString().padStart(2, "0")}:00`;
    hourlyCounts[key] = 0;
  }
  for (const h of last24) {
    const key = `${new Date(h.ts).getHours().toString().padStart(2, "0")}:00`;
    if (key in hourlyCounts) hourlyCounts[key]++;
  }
  const hourlyChart = Object.entries(hourlyCounts).map(([hour, count]) => ({ hour, count }));

  // Top pages
  const pageCounts: Record<string, number> = {};
  for (const h of rangeHits) pageCounts[h.page] = (pageCounts[h.page] || 0) + 1;
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([page, count]) => ({ page, count }));

  // Top referrers
  const refCounts: Record<string, number> = {};
  for (const h of rangeHits) {
    if (h.ref) {
      try {
        const host = new URL(h.ref).hostname.replace("www.", "");
        refCounts[host] = (refCounts[host] || 0) + 1;
      } catch {
        refCounts[h.ref] = (refCounts[h.ref] || 0) + 1;
      }
    }
  }
  const topReferrers = Object.entries(refCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([ref, count]) => ({ ref, count }));

  // Device breakdown
  const devices = { mobile: 0, tablet: 0, desktop: 0 };
  for (const h of rangeHits) {
    const d = (h.device as "mobile" | "tablet" | "desktop") || deviceType(h.ua ?? "");
    devices[d]++;
  }

  // Browser breakdown
  const browsers: Record<string, number> = {};
  for (const h of rangeHits) {
    const b = h.browser || browserName(h.ua ?? "");
    browsers[b] = (browsers[b] || 0) + 1;
  }
  const browserChart = Object.entries(browsers)
    .sort((a, b) => b[1] - a[1])
    .map(([browser, count]) => ({ browser, count }));

  // Bounce rate
  const sessions: Record<string, Set<string>> = {};
  for (const h of rangeHits) {
    const day = new Date(h.ts).toISOString().slice(0, 10);
    const key = `${h.ipHash ?? "anon"}_${day}`;
    if (!sessions[key]) sessions[key] = new Set();
    sessions[key].add(h.page);
  }
  const sessionArr = Object.values(sessions);
  const bounceRate = sessionArr.length
    ? Math.round((sessionArr.filter(s => s.size === 1).length / sessionArr.length) * 100)
    : 0;
  const avgPagesPerSession = sessionArr.length
    ? Math.round((sessionArr.reduce((s, x) => s + x.size, 0) / sessionArr.length) * 10) / 10
    : 0;

  // Recent hits (last 100)
  const recent = [...rangeHits]
    .sort((a, b) => b.ts.getTime() - a.ts.getTime())
    .slice(0, 100)
    .map(h => ({
      page: h.page,
      time: h.ts.toISOString(),
      ref: h.ref || "—",
      ua: h.ua || "—",
      device: h.device || deviceType(h.ua ?? ""),
      browser: h.browser || browserName(h.ua ?? ""),
    }));

  // First hit timestamp as "tracking since"
  const [firstRow] = await db
    .select({ ts: sql<Date>`MIN(ts)` })
    .from(pageHits);

  return {
    totalVisits,
    uniqueVisitors,
    todayVisits: todayHits.length,
    weekVisits: weekHits.length,
    uniqueInRange,
    bounceRate,
    avgPagesPerSession,
    topPages,
    topReferrers,
    dailyChart,
    hourlyChart,
    devices,
    browserChart,
    recent,
    lastReset: firstRow?.ts ? new Date(firstRow.ts).toISOString() : new Date().toISOString(),
    rangeDays,
  };
}

export type StatsResult = Awaited<ReturnType<typeof getStats>>;
