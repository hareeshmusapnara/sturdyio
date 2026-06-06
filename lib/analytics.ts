/**
 * File-based analytics store — enhanced version.
 * Persists to .analytics.json in the project root.
 * Server-side only (Node runtime).
 */

import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), ".analytics.json");

export interface PageHit {
  page: string;
  ts: number;
  ref?: string;
  ua?: string;
  ip?: string; // hashed
}

export interface AnalyticsStore {
  hits: PageHit[];
  uniqueIps: string[];
  totalVisits: number;
  lastReset: number;
}

function read(): AnalyticsStore {
  try {
    if (fs.existsSync(FILE))
      return JSON.parse(fs.readFileSync(FILE, "utf-8")) as AnalyticsStore;
  } catch { /* ignore */ }
  return { hits: [], uniqueIps: [], totalVisits: 0, lastReset: Date.now() };
}

function write(store: AnalyticsStore) {
  try { fs.writeFileSync(FILE, JSON.stringify(store), "utf-8"); }
  catch (e) { console.error("[analytics] write error:", e); }
}

function hashIp(ip: string): string {
  let h = 0;
  for (let i = 0; i < ip.length; i++)
    h = (Math.imul(31, h) + ip.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

/** Parse device type from UA */
function deviceType(ua = ""): "mobile" | "tablet" | "desktop" {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

/** Parse browser name from UA */
function browserName(ua = ""): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  if (/opera|opr\//i.test(ua)) return "Opera";
  return "Other";
}

export function recordHit(page: string, ip: string, ref?: string, ua?: string) {
  const store = read();
  const hashed = hashIp(ip);
  store.hits.push({ page, ts: Date.now(), ref, ua, ip: hashed });
  store.totalVisits++;
  if (store.hits.length > 20_000) store.hits = store.hits.slice(-20_000);
  if (!store.uniqueIps.includes(hashed)) store.uniqueIps.push(hashed);
  write(store);
}

export function getStats(rangeDays = 14) {
  const store = read();
  const now = Date.now();
  const DAY = 86_400_000;
  const RANGE = rangeDays * DAY;

  const allHits = store.hits;
  const rangeHits = allHits.filter(h => now - h.ts < RANGE);
  const todayHits = allHits.filter(h => now - h.ts < DAY);
  const weekHits = allHits.filter(h => now - h.ts < 7 * DAY);

  // ── Daily chart ────────────────────────────────────────────────────────────
  const dailyCounts: Record<string, number> = {};
  for (let i = rangeDays - 1; i >= 0; i--) {
    const key = new Date(now - i * DAY).toISOString().slice(0, 10);
    dailyCounts[key] = 0;
  }
  for (const h of rangeHits) {
    const key = new Date(h.ts).toISOString().slice(0, 10);
    if (key in dailyCounts) dailyCounts[key]++;
  }
  const dailyChart = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

  // ── Hourly chart (last 24h) ────────────────────────────────────────────────
  const hourlyCounts: Record<string, number> = {};
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now - i * 3600_000);
    const key = `${d.getHours().toString().padStart(2, "0")}:00`;
    hourlyCounts[key] = 0;
  }
  for (const h of allHits.filter(x => now - x.ts < 24 * 3600_000)) {
    const key = `${new Date(h.ts).getHours().toString().padStart(2, "0")}:00`;
    if (key in hourlyCounts) hourlyCounts[key]++;
  }
  const hourlyChart = Object.entries(hourlyCounts).map(([hour, count]) => ({ hour, count }));

  // ── Top pages ──────────────────────────────────────────────────────────────
  const pageCounts: Record<string, number> = {};
  for (const h of rangeHits) pageCounts[h.page] = (pageCounts[h.page] || 0) + 1;
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([page, count]) => ({ page, count }));

  // ── Referrers ──────────────────────────────────────────────────────────────
  const refCounts: Record<string, number> = {};
  for (const h of rangeHits) {
    if (h.ref && h.ref !== "—") {
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

  // ── Device breakdown ───────────────────────────────────────────────────────
  const devices = { mobile: 0, tablet: 0, desktop: 0 };
  for (const h of rangeHits) {
    const d = deviceType(h.ua);
    devices[d]++;
  }

  // ── Browser breakdown ──────────────────────────────────────────────────────
  const browsers: Record<string, number> = {};
  for (const h of rangeHits) {
    const b = browserName(h.ua);
    browsers[b] = (browsers[b] || 0) + 1;
  }
  const browserChart = Object.entries(browsers)
    .sort((a, b) => b[1] - a[1])
    .map(([browser, count]) => ({ browser, count }));

  // ── Unique visitors in range ───────────────────────────────────────────────
  const uniqueInRange = new Set(rangeHits.map(h => h.ip).filter(Boolean)).size;

  // ── Bounce rate (single-page sessions) ────────────────────────────────────
  // Group hits by ip+day into "sessions"
  const sessions: Record<string, Set<string>> = {};
  for (const h of rangeHits) {
    const day = new Date(h.ts).toISOString().slice(0, 10);
    const key = `${h.ip || "anon"}_${day}`;
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

  // ── Recent hits ────────────────────────────────────────────────────────────
  const recent = [...allHits]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 100)
    .map(h => ({
      page: h.page,
      time: new Date(h.ts).toISOString(),
      ref: h.ref || "—",
      ua: h.ua || "—",
      device: deviceType(h.ua),
      browser: browserName(h.ua),
    }));

  return {
    totalVisits: store.totalVisits,
    uniqueVisitors: store.uniqueIps.length,
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
    lastReset: new Date(store.lastReset).toISOString(),
    rangeDays,
  };
}

export type StatsResult = ReturnType<typeof getStats>;
