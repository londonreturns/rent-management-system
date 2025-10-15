"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Payment = {
  _id: string;
  rent_cost: number;
  total_amount: number;
  amount_paid: number;
  payment_month?: string; // BS YYYY-MM
  payment_date_ad?: string; // ISO
  payment_date_bs?: string | null;
};

type Timeframe = "month" | "6months" | "year" | "all";
type DateMode = "BS" | "AD";

type Point = { x: string; y: number };

const EN_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const NP_MONTHS = [
  "बैशाख","जेष्ठ","आषाढ","श्रावण","भाद्र","आश्विन",
  "कार्तिक","मंसिर","पौष","माघ","फाल्गुन","चैत्र"
];

export default function Home() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateMode, setDateMode] = useState<DateMode>("BS");
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const now = useMemo(() => new Date(), []);
  const [adYear, setAdYear] = useState<number>(now.getFullYear());
  const [bsYear, setBsYear] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/payment?limit=1000&page=1`, { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          const rows: Payment[] = (json?.data || []).map((p: any) => ({
            _id: String(p._id),
            rent_cost: Number(p.rent_cost || 0),
            total_amount: Number(p.total_amount || 0),
            amount_paid: Number(p.amount_paid || 0),
            payment_month: p.payment_month || undefined,
            payment_date_ad: p.payment_date_ad ? new Date(p.payment_date_ad).toISOString() : undefined,
            payment_date_bs: p.payment_date_bs || null,
          }));
          setPayments(rows);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (dateMode === "BS" && bsYear == null) {
      const y = getCurrentBSYearFromData();
      if (y) setBsYear(y);
    }
    // Set current month for navigation
    if (dateMode === "BS") {
      const y = bsYear ?? getCurrentBSYearFromData();
      if (y) {
        const months = payments
          .filter((p) => p.payment_month?.startsWith(String(y)))
          .map((p) => Number(String(p.payment_month).split("-")[1]))
          .filter((n) => Number.isFinite(n));
        if (months.length) {
          const m = Math.max(...months);
          setCurrentMonth({ year: y, month: m });
        }
      }
    } else {
      setCurrentMonth({ year: adYear, month: now.getMonth() + 1 });
    }
  }, [dateMode, payments, bsYear, adYear, now]);

  // Helpers
  function formatYYYYMM(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  function firstDayOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  function lastDayOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }

  function addMonths(d: Date, n: number): Date {
    return new Date(d.getFullYear(), d.getMonth() + n, 1);
  }

  function getCurrentBSYearFromData(): number | null {
    // Use the latest BS year present in data as "current" BS year
    const years = payments
      .map((p) => p.payment_month)
      .filter(Boolean)
      .map((s) => Number(String(s).split("-")[0]))
      .filter((n) => Number.isFinite(n));
    if (years.length === 0) return null;
    return Math.max(...years);
  }

  // Totals
  const totals = useMemo(() => {
    // Total rent this month
    let monthly = 0;
    let yearly = 0;

    if (dateMode === "AD") {
      const fd = firstDayOfMonth(now);
      const ld = lastDayOfMonth(now);
      for (const p of payments) {
        const ad = p.payment_date_ad ? new Date(p.payment_date_ad) : null;
        if (!ad) continue;
        if (ad >= fd && ad <= ld) monthly += p.rent_cost;
        if (ad.getFullYear() === now.getFullYear()) yearly += p.rent_cost;
      }
    } else {
      // BS: use payment_month for month/year based totals
      const currentBSYear = getCurrentBSYearFromData();
      // derive current BS month as the latest month in data for the latest year
      let currentBSMonth: number | null = null;
      if (currentBSYear) {
        const months = payments
          .filter((p) => p.payment_month?.startsWith(String(currentBSYear)))
          .map((p) => Number(String(p.payment_month).split("-")[1]))
          .filter((n) => Number.isFinite(n));
        if (months.length) currentBSMonth = Math.max(...months);
      }

      for (const p of payments) {
        if (!p.payment_month) continue;
        const [yStr, mStr] = p.payment_month.split("-");
        const y = Number(yStr);
        const m = Number(mStr);
        if (currentBSYear && y === currentBSYear) {
          yearly += p.rent_cost;
          if (currentBSMonth && m === currentBSMonth) monthly += p.rent_cost;
        }
      }
    }

    return { monthly: Math.round(monthly * 100) / 100, yearly: Math.round(yearly * 100) / 100 };
  }, [payments, dateMode, now]);

  // Time series for main chart
  const mainSeries: Point[] = useMemo(() => {
    const points: Record<string, number> = {};

    if (dateMode === "AD") {
      if (timeframe === "month") {
        // daily within current month (AD)
        let targetDate = now;
        if (currentMonth) {
          targetDate = new Date(currentMonth.year, currentMonth.month - 1, 1);
        }
        const fd = firstDayOfMonth(targetDate);
        const ld = lastDayOfMonth(targetDate);
        for (let d = new Date(fd); d <= ld; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().slice(0, 10);
          points[key] = 0;
        }
        for (const p of payments) {
          const ad = p.payment_date_ad ? new Date(p.payment_date_ad) : null;
          if (!ad) continue;
          if (ad >= fd && ad <= ld) {
            const key = ad.toISOString().slice(0, 10);
            points[key] = (points[key] || 0) + p.rent_cost;
          }
        }
      } else if (timeframe === "6months") {
        // last 6 months (AD) by month
        const monthKeys: string[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = addMonths(now, -i);
          monthKeys.push(formatYYYYMM(d));
        }
        for (const k of monthKeys) points[k] = 0;
        for (const p of payments) {
          const ad = p.payment_date_ad ? new Date(p.payment_date_ad) : null;
          if (!ad) continue;
          const key = formatYYYYMM(ad);
          if (key in points) points[key] += p.rent_cost;
        }
      } else if (timeframe === "year") {
        // selected AD year by month
        for (let m = 0; m < 12; m++) {
          const key = `${adYear}-${String(m + 1).padStart(2, "0")}`;
          points[key] = 0;
        }
        for (const p of payments) {
          const ad = p.payment_date_ad ? new Date(p.payment_date_ad) : null;
          if (!ad) continue;
          if (ad.getFullYear() === adYear) {
            const key = formatYYYYMM(ad);
            points[key] += p.rent_cost;
          }
        }
      } else {
        // all time by month (AD)
        for (const p of payments) {
          const ad = p.payment_date_ad ? new Date(p.payment_date_ad) : null;
          if (!ad) continue;
          const key = formatYYYYMM(ad);
          points[key] = (points[key] || 0) + p.rent_cost;
        }
      }
    } else {
      // BS mode: use payment_month (YYYY-MM) for month aggregation
      if (timeframe === "month") {
        // Use currentMonth state for navigation, fallback to data-based month
        let currentBSYear: number | null = null;
        let currentBSMonth: number | null = null;
        
        if (currentMonth) {
          currentBSYear = currentMonth.year;
          currentBSMonth = currentMonth.month;
        } else {
          currentBSYear = getCurrentBSYearFromData();
          if (currentBSYear) {
            const months = payments
              .filter((p) => p.payment_month?.startsWith(String(currentBSYear)))
              .map((p) => Number(String(p.payment_month).split("-")[1]))
              .filter((n) => Number.isFinite(n));
            if (months.length) currentBSMonth = Math.max(...months);
          }
        }
        
        if (currentBSYear && currentBSMonth) {
          const bsMonthPrefix = `${currentBSYear}-${String(currentBSMonth).padStart(2, "0")}`;
          
          // Always create daily points for the entire month (1 to 30)
          for (let day = 1; day <= 30; day++) {
            const key = `${bsMonthPrefix}-${String(day).padStart(2, "0")}`;
            points[key] = 0;
          }
          
          // Process payments for this month
          for (const p of payments) {
            if (!p.payment_month) continue;
            const [yStr, mStr] = p.payment_month.split("-");
            const y = Number(yStr);
            const m = Number(mStr);
            if (y === currentBSYear && m === currentBSMonth) {
              if (p.payment_date_bs && /\d{4}-\d{2}-\d{2}/.test(p.payment_date_bs)) {
                // Use the specific payment date
                const paymentDay = Number(p.payment_date_bs.split("-")[2]);
                if (paymentDay >= 1 && paymentDay <= 30) {
                  points[p.payment_date_bs] = (points[p.payment_date_bs] || 0) + p.rent_cost;
                }
              } else {
                // If no specific day, put it on day 1
                const key = `${yStr}-${mStr}-01`;
                points[key] = (points[key] || 0) + p.rent_cost;
              }
            }
          }
          
        }
      } else if (timeframe === "6months") {
        const currentBSYear = getCurrentBSYearFromData();
        let currentBSMonth: number | null = null;
        if (currentBSYear) {
          const months = payments
            .filter((p) => p.payment_month?.startsWith(String(currentBSYear)))
            .map((p) => Number(String(p.payment_month).split("-")[1]))
            .filter((n) => Number.isFinite(n));
          if (months.length) currentBSMonth = Math.max(...months);
        }
        const keys: string[] = [];
        if (currentBSYear && currentBSMonth) {
          let y = currentBSYear;
          let m = currentBSMonth;
          const pushKey = () => keys.push(`${y}-${String(m).padStart(2, "0")}`);
          const dec = () => {
            m -= 1;
            if (m < 1) {
              m = 12;
              y -= 1;
            }
          };
          const stack: string[] = [];
          for (let i = 0; i < 6; i++) {
            stack.push(`${y}-${String(m).padStart(2, "0")}`);
            dec();
          }
          keys.push(...stack.reverse());
        }
        for (const k of keys) points[k] = 0;
        for (const p of payments) {
          if (!p.payment_month) continue;
          if (p.payment_month in points) points[p.payment_month] += p.rent_cost;
        }
      } else if (timeframe === "year") {
        const currentBSYear = bsYear ?? getCurrentBSYearFromData();
        if (currentBSYear) {
          for (let m = 1; m <= 12; m++) {
            const key = `${currentBSYear}-${String(m).padStart(2, "0")}`;
            points[key] = 0;
          }
          for (const p of payments) {
            if (!p.payment_month) continue;
            if (p.payment_month.startsWith(String(currentBSYear))) {
              points[p.payment_month] += p.rent_cost;
            }
          }
        }
      } else {
        for (const p of payments) {
          if (!p.payment_month) continue;
          points[p.payment_month] = (points[p.payment_month] || 0) + p.rent_cost;
        }
      }
    }

    const sortedKeys = Object.keys(points).sort();
    return sortedKeys.map((k) => ({ x: k, y: Math.round(points[k] * 100) / 100 }));
  }, [payments, dateMode, timeframe, now, adYear, bsYear, currentMonth]);

  // Cumulative series for current year (always rendered)
  const cumulativeSeries: Point[] = useMemo(() => {
    const monthly: Record<string, number> = {};
    if (dateMode === "AD") {
      for (let m = 0; m < 12; m++) {
        const key = `${adYear}-${String(m + 1).padStart(2, "0")}`;
        monthly[key] = 0;
      }
      for (const p of payments) {
        const ad = p.payment_date_ad ? new Date(p.payment_date_ad) : null;
        if (!ad) continue;
        if (ad.getFullYear() === adYear) {
          const key = formatYYYYMM(ad);
          monthly[key] += p.rent_cost;
        }
      }
    } else {
      const y = bsYear ?? getCurrentBSYearFromData();
      if (y) {
        for (let m = 1; m <= 12; m++) monthly[`${y}-${String(m).padStart(2, "0")}`] = 0;
        for (const p of payments) {
          if (!p.payment_month) continue;
          if (p.payment_month.startsWith(String(y))) monthly[p.payment_month] += p.rent_cost;
        }
      }
    }
    const keys = Object.keys(monthly).sort();
    let run = 0;
    return keys.map((k) => {
      run += monthly[k];
      return { x: k, y: Math.round(run * 100) / 100 };
    });
  }, [payments, dateMode, now, adYear, bsYear]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <div className="flex items-center gap-4">
          {/* Date mode toggle (affects both charts) */}
          <RadioGroup
            className="flex items-center gap-3"
            value={dateMode}
            onValueChange={(v) => setDateMode((v as DateMode) || "BS")}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="mode-bs" value="BS" />
              <label htmlFor="mode-bs" className="text-sm">Bikram Sambat (BS)</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="mode-ad" value="AD" />
              <label htmlFor="mode-ad" className="text-sm">Gregorian (AD)</label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-md border p-4 bg-white/50">
          <div className="text-sm text-muted-foreground">Total rent this month</div>
          <div className="mt-1 text-2xl font-semibold">{loading ? "…" : totals.monthly.toFixed(2)}</div>
        </div>
        <div className="rounded-md border p-4 bg-white/50">
          <div className="text-sm text-muted-foreground">Total rent this year</div>
          <div className="mt-1 text-2xl font-semibold">{loading ? "…" : totals.yearly.toFixed(2)}</div>
        </div>
      </div>

      {/* Main line chart */}
      <ChartCard
        title="Rent trend"
        subtitle={timeframe === "month" && currentMonth
          ? `${currentMonth.year} ${dateMode} • ${dateMode === "AD" ? EN_MONTHS[currentMonth.month - 1] : NP_MONTHS[currentMonth.month - 1]}`
          : `${dateMode} • ${labelForTimeframe(timeframe)}${
              timeframe === "year"
                ? ` • ${dateMode === "AD" ? adYear : (bsYear ?? getCurrentBSYearFromData() ?? "")}`
                : timeframe === "6months"
                  ? ` • ${dateMode === "AD" ? adYear : (bsYear ?? getCurrentBSYearFromData() ?? "")}`
                  : ""
            }`}
        loading={loading}
        actions={
          <div className="flex gap-2">
            {([
              { k: "month", lbl: "This month" },
              { k: "6months", lbl: "Past 6 months" },
              { k: "year", lbl: "This year" },
              { k: "all", lbl: "All time" },
            ] as { k: Timeframe; lbl: string }[]).map(({ k, lbl }) => (
              <Button
                key={k}
                variant={timeframe === k ? "default" : "secondary"}
                onClick={() => {
                  setTimeframe(k);
                  // Reset to current month when "This month" is clicked
                  if (k === "month") {
                    if (dateMode === "AD") {
                      setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() + 1 });
                    } else {
                      // For BS mode, use the current BS year and month from data
                      const currentBSYear = getCurrentBSYearFromData();
                      if (currentBSYear) {
                        const months = payments
                          .filter((p) => p.payment_month?.startsWith(String(currentBSYear)))
                          .map((p) => Number(String(p.payment_month).split("-")[1]))
                          .filter((n) => Number.isFinite(n));
                        if (months.length) {
                          const currentBSMonth = Math.max(...months);
                          setCurrentMonth({ year: currentBSYear, month: currentBSMonth });
                        }
                      }
                    }
                  }
                }}
                className="transition-colors duration-200 hover:bg-black hover:text-white"
              >
                {lbl}
              </Button>
            ))}
            {timeframe === "month" && currentMonth && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (dateMode === "AD") {
                      const newMonth = currentMonth.month === 1 ? 12 : currentMonth.month - 1;
                      const newYear = currentMonth.month === 1 ? currentMonth.year - 1 : currentMonth.year;
                      setCurrentMonth({ year: newYear, month: newMonth });
                    } else {
                      const newMonth = currentMonth.month === 1 ? 12 : currentMonth.month - 1;
                      const newYear = currentMonth.month === 1 ? currentMonth.year - 1 : currentMonth.year;
                      setCurrentMonth({ year: newYear, month: newMonth });
                    }
                  }}
                  className="transition-colors duration-200 hover:bg-black hover:text-white"
                >
                  ← Prev Month
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (dateMode === "AD") {
                      const newMonth = currentMonth.month === 12 ? 1 : currentMonth.month + 1;
                      const newYear = currentMonth.month === 12 ? currentMonth.year + 1 : currentMonth.year;
                      setCurrentMonth({ year: newYear, month: newMonth });
                    } else {
                      const newMonth = currentMonth.month === 12 ? 1 : currentMonth.month + 1;
                      const newYear = currentMonth.month === 12 ? currentMonth.year + 1 : currentMonth.year;
                      setCurrentMonth({ year: newYear, month: newMonth });
                    }
                  }}
                  className="transition-colors duration-200 hover:bg-black hover:text-white"
                >
                  Next Month →
                </Button>
              </>
            )}
          </div>
        }
      >
        <LineChart
          width={900}
          height={240}
          series={mainSeries}
          formatX={(x) => formatXAxisLabel(x, dateMode, timeframe, currentMonth)}
          timeframe={timeframe}
        />
      </ChartCard>

      {/* Cumulative chart */}
      <ChartCard
        title="Cumulative rent"
        subtitle={`${dateMode} • ${dateMode === "AD" ? adYear : (bsYear ?? getCurrentBSYearFromData() ?? "")}`}
        loading={loading}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (dateMode === "AD") setAdYear((y) => y - 1);
                else setBsYear((y) => (y ?? getCurrentBSYearFromData() ?? new Date().getFullYear()) - 1);
              }}
              className="transition-colors duration-200 hover:bg-black hover:text-white"
            >
              Past Year
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (dateMode === "AD") setAdYear(now.getFullYear());
                else setBsYear(getCurrentBSYearFromData() ?? null);
              }}
              className="transition-colors duration-200 hover:bg-black hover:text-white"
            >
              This Year
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (dateMode === "AD") setAdYear((y) => y + 1);
                else setBsYear((y) => (y ?? getCurrentBSYearFromData() ?? new Date().getFullYear()) + 1);
              }}
              className="transition-colors duration-200 hover:bg-black hover:text-white"
            >
              Next Year
            </Button>
          </div>
        }
      >
        <LineChart
          width={900}
          height={240}
          series={cumulativeSeries}
          formatX={(x) => formatXAxisLabel(x, dateMode, "year", null)}
          timeframe="year"
        />
      </ChartCard>
    </div>
  );
}

function labelForTimeframe(tf: Timeframe): string {
  switch (tf) {
    case "month":
      return "This month";
    case "6months":
      return "Past 6 months";
    case "year":
      return "This year";
    case "all":
      return "All time";
  }
}

function ChartCard({ title, subtitle, loading, actions, children }: { title: string; subtitle?: string; loading?: boolean; actions?: React.ReactNode; children: React.ReactNode; }) {
  return (
    <div className="rounded-md border p-4 bg-white/50">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">{title}</div>
          {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="overflow-x-auto">
        {loading ? <div className="p-8 text-sm text-muted-foreground">Loading…</div> : children}
      </div>
    </div>
  );
}

function LineChart({ width, height, series, formatX, timeframe }: { width: number; height: number; series: Point[]; formatX?: (x: string) => string; timeframe?: Timeframe }) {
  const padding = { top: 10, right: 16, bottom: 24, left: 40 };
  const innerW = Math.max(0, width - padding.left - padding.right);
  const innerH = Math.max(0, height - padding.top - padding.bottom);

  const xs = series.map((p) => p.x);
  const ys = series.map((p) => p.y);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(1, ...ys);

  function xPos(i: number): number {
    if (series.length <= 1) return padding.left + innerW / 2;
    const t = i / (series.length - 1);
    return padding.left + t * innerW;
    }

  function yPos(v: number): number {
    const range = maxY - minY || 1;
    const t = (v - minY) / range;
    return padding.top + (1 - t) * innerH;
  }

  const path = series
    .map((p, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPos(p.y)}`)
    .join(" ");

  // Area under the line (shaded)
  const baselineValue = minY < 0 && maxY > 0 ? 0 : minY;
  const baseY = yPos(baselineValue);
  const areaPath = series.length
    ? `M${xPos(0)},${baseY} ` +
      series.map((p, i) => `L${xPos(i)},${yPos(p.y)}`).join(" ") +
      ` L${xPos(series.length - 1)},${baseY} Z`
    : "";

  const yTicks = 4;
  const ticks: number[] = Array.from({ length: yTicks + 1 }, (_, i) => minY + (i * (maxY - minY)) / yTicks);

  const animKey = series.map((p) => `${p.x}:${p.y}`).join("|");

  // Compute optional month label if all x share same YYYY-MM
  const monthPrefix = useMemo(() => {
    if (xs.length === 0) return "";
    const first = xs[0];
    const m = first.match(/^(\d{4}-\d{2})-\d{2}$/);
    if (!m) return "";
    const prefix = m[1];
    const allSame = xs.every((x) => x.startsWith(prefix + "-"));
    return allSame ? prefix : "";
  }, [xs]);

  return (
    <svg key={animKey} width={width} height={height} className="min-w-full">
      <style>{`
        @keyframes lineDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes areaReveal { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dotPop { 0% { opacity: 0; r: 0; } 60% { opacity: 1; r: 3; } 100% { r: 2; } }
      `}</style>
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Axes */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#e5e7eb" />
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#e5e7eb" />

      {/* Y grid and labels */}
      {ticks.map((t, i) => {
        const y = yPos(t);
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f3f4f6" />
            <text x={padding.left - 8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-gray-500 text-[10px]">
              {t.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* X labels (sparse) */}
      {xs.map((x, i) => {
        // For monthly view, show key days (1, 6, 12, 18, 24, 30)
        let show = false;
        if (timeframe === "month") {
          const dayMatch = x.match(/-(\d{2})$/);
          if (dayMatch) {
            const day = Number(dayMatch[1]);
            show = day === 1 || day === 6 || day === 12 || day === 18 || day === 24 || day === 30;
          } else {
            show = i === 0 || i === xs.length - 1;
          }
        } else if (timeframe === "year") {
          // For year view (cumulative chart), show all months
          show = true;
        } else {
          show = i === 0 || i === xs.length - 1 || i % Math.ceil(xs.length / 6) === 0;
        }
        if (!show) return null;
        const base = monthPrefix ? x.split("-")[2] : x;
        const label = formatX ? formatX(base) : base;
        return (
          <text key={i} x={xPos(i)} y={height - padding.bottom + 14} textAnchor="middle" className="fill-gray-500 text-[10px]">
            {label}
          </text>
        );
      })}

      {/* Line */}
      {areaPath && <path d={areaPath} fill="url(#lineGradient)" style={{ animation: "areaReveal 450ms ease-out" }} />}
      <path d={path} fill="none" stroke="#000000" strokeWidth={2} pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: "lineDraw 650ms ease-out forwards" }} />

      {/* Dots */}
      {series.map((p, i) => (
        <circle key={i} cx={xPos(i)} cy={yPos(p.y)} r={2} fill="#000000" style={{ animation: `dotPop 500ms ease-out forwards`, animationDelay: `${Math.min(i * 30, 240)}ms` }} />
      ))}
    </svg>
  );
}

function monthHeaderForSeries(series: Point[]): string | "" {
  if (series.length === 0) return "";
  const xs = series.map((p) => p.x);
  const m = xs[0].match(/^(\d{4}-\d{2})-\d{2}$/);
  if (!m) return "";
  const prefix = m[1];
  const allSame = xs.every((x) => x.startsWith(prefix + "-"));
  return allSame ? prefix : "";
}

function formatXAxisLabel(x: string, mode: DateMode, tf: Timeframe, currentMonth: { year: number; month: number } | null): string {
  // For 6 months and year, convert YYYY-MM labels to month names
  if (tf === "6months" || tf === "year") {
    const m = x.match(/^(\d{4})-(\d{2})$/);
    if (m) {
      const monthNum = Number(m[2]);
      if (mode === "AD") return EN_MONTHS[(monthNum - 1 + 12) % 12];
      return NP_MONTHS[(monthNum - 1 + 12) % 12];
    }
  }
  // For month view, show day numbers only (extract day from YYYY-MM-DD)
  if (tf === "month") {
    const dayMatch = x.match(/-(\d{2})$/);
    if (dayMatch) {
      return String(Number(dayMatch[1])); // Remove leading zero
    }
    // Handle case where x might be in YYYY-MM format (fallback to single monthly point)
    const monthMatch = x.match(/^(\d{4})-(\d{2})$/);
    if (monthMatch) {
      return "1"; // Show as day 1 for monthly aggregated data
    }
    return x;
  }
  return x;
}
