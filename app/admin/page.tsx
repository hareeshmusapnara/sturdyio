"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Brain, Users, Eye, TrendingUp, BarChart3, Globe,
  RefreshCw, LogOut, Loader2, Calendar, Clock,
  Monitor, Shield, Smartphone, Tablet, Download,
  Activity, Percent, Layers, Search, ChevronUp,
  ChevronDown, Sun, Moon, X, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────
interface DailyPoint { date: string; count: number }
interface HourlyPoint { hour: string; count: number }
interface PageRow { page: string; count: number }
interface RefRow { ref: string; count: number }
interface BrowserRow { browser: string; count: number }
interface RecentRow { page: string; time: string; ref: string; ua: string; device: string; browser: string }
interface Stats {
  totalVisits: number; uniqueVisitors: number;
  todayVisits: number; weekVisits: number;
  uniqueInRange: number; bounceRate: number;
  avgPagesPerSession: number;
  topPages: PageRow[]; topReferrers: RefRow[];
  dailyChart: DailyPoint[]; hourlyChart: HourlyPoint[];
  devices: { mobile: number; tablet: number; desktop: number };
  browserChart: BrowserRow[]; recent: RecentRow[];
  lastReset: string; rangeDays: number;
}

type BarDatum = { [key: string]: string | number };

const RANGE_OPTIONS = [
  { label: "7d", value: 7 }, { label: "14d", value: 14 },
  { label: "30d", value: 30 }, { label: "90d", value: 90 },
];

// ── Utils ──────────────────────────────────────────────────────────────────────
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function exportCSV(rows: RecentRow[]) {
  const header = "Page,Time,Device,Browser,Referrer,User Agent\n";
  const body = rows.map(r =>
    [r.page, r.time, r.device, r.browser, r.ref, r.ua.replace(/,/g, ";")]
      .map(v => `"${v}"`).join(",")
  ).join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const a = Object.assign(document.createElement("a"),
    { href: URL.createObjectURL(blob), download: "sturdy-analytics.csv" });
  a.click(); URL.revokeObjectURL(a.href);
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, labelKey, valueKey, color = "#7c3aed", height = 120 }: {
  data: BarDatum[]; labelKey: string; valueKey: string; color?: string; height?: number;
}) {
  const max = Math.max(...data.map(d => Number(d[valueKey])), 1);
  const [hov, setHov] = useState<number | null>(null);
  return (
    <div className="relative w-full" style={{ height }}>
      <div className="absolute inset-0 flex items-end gap-[2px]">
        {data.map((d, i) => {
          const val = Number(d[valueKey]);
          const pct = Math.max((val / max) * 100, val > 0 ? 5 : 1);
          const isHov = hov === i;
          return (
            <div key={i} className="relative flex-1 flex flex-col justify-end h-full cursor-pointer"
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
              <div className="w-full rounded-t-[3px] transition-all duration-150"
                style={{ height: `${pct}%`, background: isHov ? "#a78bfa" : color, opacity: val > 0 ? (isHov ? 1 : 0.75) : 0.15 }} />
              {isHov && val > 0 && (
                <div className="absolute z-30 pointer-events-none"
                  style={{
                    bottom: `calc(${pct}% + 8px)`,
                    left: "50%", transform: "translateX(-50%)",
                    background: "#18181b", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8, padding: "4px 10px", whiteSpace: "nowrap",
                    color: "#f4f4f5", fontSize: 11, fontWeight: 700,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  }}>
                  {String(d[labelKey]).slice(-5)} · {val}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ slices, size = 110 }: { slices: { label: string; value: number; color: string }[]; size?: number }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  const [hov, setHov] = useState<number | null>(null);
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-card2)" strokeWidth={12} />
        {slices.map((s, i) => {
          const dash = (s.value / total) * circ;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
              strokeWidth={hov === i ? 16 : 12}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: "stroke-width 0.2s", cursor: "pointer" }}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight={800} fill="var(--text-1)">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="var(--text-3)">total</text>
      </svg>
      <div className="flex flex-col gap-2.5 flex-1 min-w-0">
        {slices.map((s, i) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <div key={i} className="cursor-pointer"
              style={{ opacity: hov === null || hov === i ? 1 : 0.35, transition: "opacity 0.15s" }}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>{s.label}</span>
                </div>
                <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-1)" }}>{pct}%</span>
              </div>
              <div className="w-full h-1 rounded-full" style={{ background: "var(--bg-card2)" }}>
                <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: s.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color, pulse, trend }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; pulse?: boolean; trend?: string;
}) {
  return (
    <div className="rounded-2xl flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "20px 22px" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest leading-none truncate"
            style={{ color: "var(--text-3)", letterSpacing: "0.07em" }}>{label}</p>
          {sub && <p className="text-xs leading-none" style={{ color: "var(--text-3)", opacity: 0.7 }}>{sub}</p>}
        </div>
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${color}20` }}>
            <Icon size={16} style={{ color }} />
          </div>
          {pulse && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 bg-emerald-400 animate-pulse"
            style={{ borderColor: "var(--bg-card)" }} />}
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="font-black tabular-nums leading-none" style={{ color, fontSize: "clamp(22px,3vw,30px)" }}>{value}</p>
        {trend && (
          <span className="flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
            <ArrowUpRight size={10} />{trend}
          </span>
        )}
      </div>
    </div>
  );
}

// ── H-Bar row ─────────────────────────────────────────────────────────────────
function HBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium truncate" style={{ color: "var(--text-2)", maxWidth: "65%" }}>{label}</span>
        <span className="text-xs font-bold tabular-nums shrink-0 ml-2" style={{ color: "var(--text-1)" }}>
          {count.toLocaleString()}
          <span className="font-normal ml-1" style={{ color: "var(--text-3)" }}>({pct}%)</span>
        </span>
      </div>
      <div className="w-full rounded-full h-1.5" style={{ background: "var(--bg-card2)" }}>
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, iconColor, badge }: {
  icon: React.ElementType; title: string; iconColor: string; badge?: string | number;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${iconColor}18` }}>
        <Icon size={13} style={{ color: iconColor }} />
      </div>
      <h3 className="font-black text-sm" style={{ color: "var(--text-1)" }}>{title}</h3>
      {badge !== undefined && (
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "var(--bg-card2)", color: "var(--text-3)" }}>{badge}</span>
      )}
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Wrong password");
      sessionStorage.setItem("admin_token", data.token); onLogin(data.token);
    } catch (e) { setErr(e instanceof Error ? e.message : "Login failed"); }
    finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen w-full flex items-center justify-center"
      style={{ background: "var(--bg)", backgroundImage: "radial-gradient(ellipse at 60% 10%, rgba(124,58,237,0.08) 0%, transparent 60%)" }}>
      <div className="w-full max-w-[380px] mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Shield size={28} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-1)" }}>Admin Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Sturdy AI · Analytics</p>
          </div>
        </div>
        {/* Card */}
        <div className="rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "32px" }}>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-widest"
                style={{ color: "var(--text-3)" }}>Password</label>
              <input type="password" placeholder="Enter admin password" value={pw} autoFocus
                onChange={e => { setPw(e.target.value); setErr(""); }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                onFocus={e => (e.target.style.borderColor = "#7c3aed")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            </div>
            {err && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <X size={12} /> {err}
              </div>
            )}
            <button type="submit" disabled={busy || !pw}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-40 rounded-xl mt-1">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} />}
              {busy ? "Authenticating…" : "Access Dashboard"}
            </button>
          </form>
          <div className="flex items-center justify-center mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
            <Link href="/" className="text-xs flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-3)" }}>
              ← Back to Sturdy AI
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState(14);
  const [view, setView] = useState<"daily" | "hourly">("daily");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<"time" | "page" | "device" | "browser">("time");
  const [sortAsc, setSortAsc] = useState(false);
  const [dark, setDark] = useState(true);
  const [lastAt, setLastAt] = useState<Date | null>(null);
  const [live, setLive] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token"); if (saved) setToken(saved);
    const theme = localStorage.getItem("theme"); const isDark = theme ? theme === "dark" : true;
    setDark(isDark); document.documentElement.classList.toggle("light", !isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark; setDark(next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const fetchStats = useCallback(async (t: string, r = range) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/stats?range=${r}`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.status === 401) { setToken(null); sessionStorage.removeItem("admin_token"); return; }
      if (!res.ok) throw new Error("Failed to load stats");
      setStats(await res.json()); setLastAt(new Date());
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }, [range]);

  useEffect(() => { if (token) fetchStats(token, range); }, [token, range, fetchStats]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (live && token) timerRef.current = setInterval(() => fetchStats(token, range), 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [live, token, range, fetchStats]);

  const handleLogout = () => { setToken(null); setStats(null); sessionStorage.removeItem("admin_token"); };

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortAsc(p => !p); else { setSortCol(col); setSortAsc(false); }
  };

  if (!token) return <LoginScreen onLogin={setToken} />;

  const filteredRecent = (stats?.recent ?? [])
    .filter(r => !search || [r.page, r.browser, r.device, r.ref].some(v => v.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      const va = sortCol === "time" ? new Date(a.time).getTime() : (a as unknown as Record<string, string>)[sortCol];
      const vb = sortCol === "time" ? new Date(b.time).getTime() : (b as unknown as Record<string, string>)[sortCol];
      return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const SortIcon = ({ col }: { col: typeof sortCol }) => (
    sortCol === col
      ? (sortAsc ? <ChevronUp size={10} className="text-violet-400" /> : <ChevronDown size={10} className="text-violet-400" />)
      : <ChevronDown size={10} style={{ opacity: 0.25 }} />
  );

  const deviceSlices = stats ? [
    { label: "Desktop", value: stats.devices.desktop, color: "#7c3aed" },
    { label: "Mobile", value: stats.devices.mobile, color: "#3b82f6" },
    { label: "Tablet", value: stats.devices.tablet, color: "#10b981" },
  ] : [];

  // Card style reuse
  const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20 };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text-1)" }}>

      {/* ═══════════════════════ HEADER ═══════════════════════ */}
      <header className="site-header sticky top-0 z-40 w-full">
        <div className="w-full px-6 sm:px-10 h-14 flex items-center justify-between gap-4">

          {/* Left — brand + badge */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <Brain size={13} className="text-white" />
              </div>
              <span className="font-bold text-sm" style={{ color: "var(--text-1)" }}>Sturdy AI</span>
            </Link>
            <span style={{ color: "var(--border)" }}>/</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: "var(--text-2)" }}>
              <Shield size={11} className="text-violet-400" /> Admin
            </span>
            {/* Live badge */}
            <button onClick={() => setLive(p => !p)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all"
              style={{
                background: live ? "rgba(16,185,129,0.12)" : "var(--bg-card2)",
                border: "1px solid " + (live ? "rgba(16,185,129,0.3)" : "var(--border)"),
                color: live ? "#10b981" : "var(--text-3)",
              }}>
              <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
              {live ? "Live" : "Paused"}
            </button>
          </div>

          {/* Right — controls */}
          <div className="flex items-center gap-2">
            {lastAt && <span className="text-xs hidden lg:block" style={{ color: "var(--text-3)" }}>↻ {lastAt.toLocaleTimeString()}</span>}

            {/* Range pill */}
            <div className="flex p-0.5 rounded-lg gap-0.5" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)" }}>
              {RANGE_OPTIONS.map(o => (
                <button key={o.value} onClick={() => setRange(o.value)}
                  className="px-2.5 py-1 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: range === o.value ? "#7c3aed" : "transparent",
                    color: range === o.value ? "#fff" : "var(--text-3)",
                  }}>
                  {o.label}
                </button>
              ))}
            </div>

            <button onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
              {dark ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            <button onClick={() => token && fetchStats(token, range)} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
              {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-red-500/10"
              style={{ border: "1px solid var(--border)", color: "#f87171" }}>
              <LogOut size={11} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════ MAIN ═══════════════════════ */}
      <main className="w-full px-6 sm:px-10 py-8 space-y-6 max-w-[1600px] mx-auto">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            <X size={14} className="shrink-0" /> {error}
            <button onClick={() => token && fetchStats(token, range)} className="ml-auto text-xs underline">Retry</button>
            <button onClick={() => setError("")}><X size={12} /></button>
          </div>
        )}

        {/* Loader */}
        {loading && !stats && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/10 flex items-center justify-center">
              <Loader2 size={28} className="text-violet-500 animate-spin" />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-3)" }}>Loading analytics…</p>
          </div>
        )}

        {stats && (
          <>
            {/* ══ PAGE TITLE ══ */}
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-1)" }}>Analytics Overview</h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>
                  Last {range} days · Tracking since {new Date(stats.lastReset).toLocaleDateString()}
                </p>
              </div>
              {loading && <Loader2 size={16} className="text-violet-500 animate-spin mb-1" />}
            </div>

            {/* ══ KPI GRID ══ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3">
              <KpiCard icon={Eye} label="All-time" value={stats.totalVisits.toLocaleString()} color="#7c3aed" />
              <KpiCard icon={Users} label="Unique IPs" value={stats.uniqueVisitors.toLocaleString()} color="#3b82f6" />
              <KpiCard icon={Calendar} label="Today" value={stats.todayVisits.toLocaleString()} color="#10b981" pulse />
              <KpiCard icon={TrendingUp} label="This week" value={stats.weekVisits.toLocaleString()} color="#f59e0b" />
              <KpiCard icon={Activity} label={`Uniq (${range}d)`} value={stats.uniqueInRange.toLocaleString()} color="#06b6d4" />
              <KpiCard icon={Percent} label="Bounce rate" value={`${stats.bounceRate}%`} color="#f43f5e" sub="1-page sessions" />
              <KpiCard icon={Layers} label="Pages/session" value={stats.avgPagesPerSession} color="#8b5cf6" sub="avg depth" />
            </div>

            {/* ══ TRAFFIC CHART ══ */}
            <div className="rounded-2xl" style={cardStyle}>
              {/* Card header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6 pb-4"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.12)" }}>
                    <BarChart3 size={13} className="text-violet-500" />
                  </div>
                  <h2 className="font-black text-sm" style={{ color: "var(--text-1)" }}>Traffic Overview</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{ background: "var(--bg-card2)", color: "var(--text-3)" }}>
                    {view === "daily"
                      ? stats.dailyChart.reduce((s, d) => s + d.count, 0).toLocaleString() + " hits"
                      : stats.hourlyChart.reduce((s, d) => s + d.count, 0).toLocaleString() + " hits today"}
                  </span>
                </div>
                {/* View toggle */}
                <div className="flex p-0.5 rounded-lg gap-0.5" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)" }}>
                  {(["daily", "hourly"] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
                      style={{
                        background: view === v ? "#7c3aed" : "transparent",
                        color: view === v ? "#fff" : "var(--text-3)",
                      }}>
                      {v === "daily" ? `Daily (${range}d)` : "Hourly (24h)"}
                    </button>
                  ))}
                </div>
              </div>
              {/* Chart body */}
              <div className="px-6 pb-6 pt-5">
                {view === "daily" ? (
                  <>
                    <BarChart data={stats.dailyChart as unknown as BarDatum[]} labelKey="date" valueKey="count" height={130} />
                    <div className="flex justify-between mt-2.5">
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>{stats.dailyChart[0]?.date}</span>
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>{stats.dailyChart.at(-1)?.date}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <BarChart data={stats.hourlyChart as unknown as BarDatum[]} labelKey="hour" valueKey="count" color="#3b82f6" height={130} />
                    <div className="flex justify-between mt-2.5">
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>12 AM</span>
                      <span className="text-xs text-center" style={{ color: "var(--text-3)" }}>12 PM</span>
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>11 PM</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ══ THREE-COL ROW ══ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Top pages */}
              <div className="rounded-2xl" style={{ ...cardStyle, padding: "24px 24px" }}>
                <SectionTitle icon={Monitor} title="Top Pages" iconColor="#7c3aed" badge={stats.topPages.length} />
                {stats.topPages.length === 0
                  ? <p className="text-xs py-4 text-center" style={{ color: "var(--text-3)" }}>No page data yet</p>
                  : <div className="space-y-4">
                    {stats.topPages.map((p, i) => (
                      <HBar key={i} label={p.page} count={p.count} max={stats.topPages[0]?.count || 1} color="#7c3aed" />
                    ))}
                  </div>}
              </div>

              {/* Top referrers */}
              <div className="rounded-2xl" style={{ ...cardStyle, padding: "24px 24px" }}>
                <SectionTitle icon={Globe} title="Top Referrers" iconColor="#3b82f6" badge={stats.topReferrers.length} />
                {stats.topReferrers.length === 0
                  ? <p className="text-xs py-4 text-center" style={{ color: "var(--text-3)" }}>No referrer data yet</p>
                  : <div className="space-y-4">
                    {stats.topReferrers.map((r, i) => (
                      <HBar key={i} label={r.ref} count={r.count} max={stats.topReferrers[0]?.count || 1} color="#3b82f6" />
                    ))}
                  </div>}
              </div>

              {/* Devices + browsers */}
              <div className="rounded-2xl flex flex-col gap-6" style={{ ...cardStyle, padding: "24px 24px" }}>
                {/* Devices */}
                <div>
                  <SectionTitle icon={Smartphone} title="Devices" iconColor="#10b981" />
                  <DonutChart slices={deviceSlices} size={110} />
                </div>
                {/* Browsers */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
                  <SectionTitle icon={Globe} title="Browsers" iconColor="#f59e0b" />
                  {stats.browserChart.length === 0
                    ? <p className="text-xs" style={{ color: "var(--text-3)" }}>No data</p>
                    : <div className="space-y-3">
                      {stats.browserChart.map((b, i) => (
                        <HBar key={i} label={b.browser} count={b.count} max={stats.browserChart[0]?.count || 1} color="#f59e0b" />
                      ))}
                    </div>}
                </div>
              </div>
            </div>

            {/* ══ RECENT VISITS TABLE ══ */}
            <div className="rounded-2xl" style={cardStyle}>
              {/* Table header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}>
                    <Clock size={13} className="text-emerald-500" />
                  </div>
                  <h3 className="font-black text-sm" style={{ color: "var(--text-1)" }}>Recent Visits</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa" }}>
                    {filteredRecent.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter visits…"
                      className="rounded-xl pl-8 pr-8 py-2 text-xs outline-none transition-all"
                      style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-1)", width: 160 }}
                      onFocus={e => (e.target.style.borderColor = "#7c3aed")}
                      onBlur={e => (e.target.style.borderColor = "var(--border)")} />
                    {search && (
                      <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-70"
                        style={{ color: "var(--text-3)" }}>
                        <X size={11} />
                      </button>
                    )}
                  </div>
                  {/* CSV export */}
                  <button onClick={() => exportCSV(filteredRecent)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors hover:opacity-80"
                    style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                    <Download size={12} /> Export CSV
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-card2)" }}>
                      {[
                        { label: "Page", col: "page" as const },
                        { label: "Time", col: "time" as const },
                        { label: "Device", col: "device" as const },
                        { label: "Browser", col: "browser" as const },
                        { label: "Referrer", col: null },
                        { label: "User Agent", col: null },
                      ].map(({ label, col }) => (
                        <th key={label} onClick={() => col && toggleSort(col)}
                          className={`text-left px-4 py-3 select-none ${col ? "cursor-pointer" : ""}`}
                          style={{
                            color: "var(--text-3)", fontSize: 10, fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "0.07em",
                            borderBottom: "1px solid var(--border)",
                          }}>
                          <span className="flex items-center gap-1.5">
                            {label}
                            {col && <SortIcon col={col} />}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecent.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: "var(--text-3)" }}>
                          {search ? "No results match your filter" : "No visits recorded yet — come back once users visit the site"}
                        </td>
                      </tr>
                    )}
                    {filteredRecent.map((r, i) => (
                      <tr key={i}
                        style={{ borderBottom: "1px solid var(--border)" }}
                        className="transition-colors hover:bg-[var(--bg-card2)]">
                        {/* Page */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold px-2 py-1 rounded-lg"
                            style={{ background: "rgba(124,58,237,0.08)", color: "#a78bfa" }}>
                            {r.page}
                          </span>
                        </td>
                        {/* Time */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--text-2)" }}>
                          {fmtTime(r.time)}
                        </td>
                        {/* Device */}
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-xs font-medium"
                            style={{ color: r.device === "desktop" ? "#7c3aed" : r.device === "mobile" ? "#3b82f6" : "#10b981" }}>
                            {r.device === "desktop" ? <Monitor size={12} /> : r.device === "mobile" ? <Smartphone size={12} /> : <Tablet size={12} />}
                            <span className="capitalize">{r.device}</span>
                          </span>
                        </td>
                        {/* Browser */}
                        <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text-2)" }}>{r.browser}</td>
                        {/* Referrer */}
                        <td className="px-4 py-3 text-xs max-w-[140px]">
                          <span className="truncate block" style={{ color: "var(--text-3)" }}>
                            {r.ref === "—" ? <span style={{ color: "var(--border)" }}>direct</span> : r.ref}
                          </span>
                        </td>
                        {/* UA */}
                        <td className="px-4 py-3 text-xs max-w-[200px]">
                          <span className="truncate block" style={{ color: "var(--text-3)" }}>
                            {r.ua.slice(0, 55)}{r.ua.length > 55 ? "…" : ""}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ══ FOOTER ══ */}
            <div className="flex items-center justify-between pb-6 text-xs" style={{ color: "var(--text-3)" }}>
              <span>
                Stored in <code className="px-1.5 py-0.5 rounded-md font-mono text-xs"
                  style={{ background: "var(--bg-card2)" }}>.analytics.json</code>
              </span>
              <span className="flex items-center gap-2">
                {live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                {live ? "Auto-refreshing every 30s" : "Auto-refresh paused"}
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
