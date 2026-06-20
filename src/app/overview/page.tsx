"use client";
import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { Phone, Euro, AlertTriangle, TrendingUp } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { usePeriod } from "@/contexts/PeriodContext";
import { useTheme, THEMES } from "@/contexts/ThemeContext";

// ── Types ────────────────────────────────────────────────────────────────────

interface MonthlyTrend {
  mesiac: string;
  celkovaNaklady: number;
  sumaNadlimitov: number;
  pocetNadlimitov: number;
}

interface StackedTrend {
  mesiac: string;
  zamestnanci: number;
  annex: number;
  mainCons: number;
  firemne: number;
}

interface StrediskoStat {
  stredisko: string;
  celkovaCena: number;
  nadlimit: number;
}

interface TopPrekracovatel {
  _id: { personName: string | null };
  pocetMesiacov: number;
  sumaNadlimitov: number;
  avgNadlimit: number;
}

interface TopSluzba {
  entryName: string;
  suma: number;
}

interface PeriodStats {
  pocetCisel: number;
  celkovaNaklady: number;
  pocetNadlimitov: number;
  sumaNadlimitov: number;
}

interface AnalyticsData {
  monthlyTrend: MonthlyTrend[];
  byStredisko: StrediskoStat[];
  topPrekracovateliaRaw: TopPrekracovatel[];
  lastMonth: string;
  stackedTrend: StackedTrend[];
  topFiremneSluzby: TopSluzba[];
  latestStats: PeriodStats | null;
  periodStats: PeriodStats | null;
  periodLabel: string;
}

// ── Pie colours — fixed palette, readable on all themes ──────────────────────
const PIE_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#ef4444", "#14b8a6", "#f97316", "#84cc16",
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyzyPage() {
  const { selectedCn } = useCompany();
  const { year, monthFrom, monthTo, periodLabel: ctxLabel, periodsLoading } = usePeriod();
  const { theme } = useTheme();

  // Derive chart colours from the current theme
  const accentHex = THEMES.find((t) => t.dir === theme)?.accent ?? "#ff7900";
  const dangerHex = "#ef4444";
  const amberHex = "#f59e0b";

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(
    (cn: string, yr: string, mFrom: string, mTo: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (cn) params.set("cn", cn);
      if (yr) {
        params.set("year", yr);
        params.set("monthFrom", mFrom);
        params.set("monthTo", mTo);
      }
      fetch(`/api/analytics?${params.toString()}`)
        .then((r) => r.json())
        .then((d: AnalyticsData) => {
          setData(d);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    },
    []
  );

  // Re-fetch when company or period (from context) changes
  useEffect(() => {
    if (periodsLoading || !year) return;
    fetchData(selectedCn, year, monthFrom, monthTo);
  }, [selectedCn, year, monthFrom, monthTo, periodsLoading, fetchData]);

  const trendData =
    data?.monthlyTrend.map((m) => ({
      mesiac: m.mesiac.replace(/^\d{4}-/, ""),
      "Náklady (€)": m.celkovaNaklady,
      "Nadlimity (€)": m.sumaNadlimitov,
    })) ?? [];

  const stackedData =
    data?.stackedTrend.map((m) => ({
      mesiac: m.mesiac.replace(/^\d{4}-/, ""),
      "Zamestnanci (€)": m.zamestnanci,
      "Firemné (€)": m.firemne,
    })) ?? [];

  const hasFiremne = data?.stackedTrend.some((m) => m.firemne > 0) ?? false;
  const hasPie = (data?.topFiremneSluzby.length ?? 0) > 0;

  const kpiStats = data?.periodStats ?? data?.latestStats;
  const kpiSubtitle = ctxLabel || data?.periodLabel || data?.lastMonth || "";

  // ── Shared card style ─────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: "1.25rem",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold" style={{ color: "var(--ink)" }}>
        Analýzy a trendy
      </h1>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse p-4"
              style={{ ...card, minHeight: 90 }}
            >
              <div className="h-3 rounded mb-3 w-3/4" style={{ background: "var(--faint)" }} />
              <div className="h-6 rounded w-1/2" style={{ background: "var(--faint)" }} />
            </div>
          ))}
        </div>
      ) : kpiStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Čísiel celkom"
            value={kpiStats.pocetCisel}
            icon={<Phone size={16} />}
            variant="accent"
            subtitle={kpiSubtitle}
          />
          <KpiCard
            title="Celkové náklady"
            value={`${kpiStats.celkovaNaklady.toFixed(2)} €`}
            icon={<Euro size={16} />}
            variant="neutral"
            subtitle="bez DPH"
          />
          <KpiCard
            title="Nadlimitov"
            value={kpiStats.pocetNadlimitov}
            icon={<AlertTriangle size={16} />}
            variant="danger"
            subtitle="zamestnancov"
          />
          <KpiCard
            title="Suma nadlimitov"
            value={`${kpiStats.sumaNadlimitov.toFixed(2)} €`}
            icon={<TrendingUp size={16} />}
            variant="danger"
            subtitle="bez DPH"
          />
        </div>
      ) : null}

      {loading ? (
        <div
          className="text-sm text-center py-16"
          style={{ color: "var(--faint)" }}
        >
          Načítavam analýzy…
        </div>
      ) : (
        <>
          {/* ── Stacked: zamestnanci vs firma ─────────────────────────────── */}
          {hasFiremne && (
            <div style={card}>
              <ChartHeader title="Náklady — zamestnanci vs. spoločnosť" subtitle={`Bez DPH · ${kpiSubtitle}`} />
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stackedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="mesiac" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} unit=" €" />
                  <Tooltip
                    formatter={(v: number) => `${v.toFixed(2)} €`}
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Zamestnanci (€)" stackId="a" fill={accentHex} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Firemné (€)" stackId="a" fill={amberHex} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Trend line chart ──────────────────────────────────────────── */}
          <div style={card}>
            <ChartHeader title="Zamestnanecké náklady a nadlimity" subtitle={`Bez DPH · ${kpiSubtitle}`} />
            {trendData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="mesiac" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} unit=" €" />
                  <Tooltip
                    formatter={(v: number) => `${v.toFixed(2)} €`}
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Náklady (€)" stroke={accentHex} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="Nadlimity (€)" stroke={dangerHex} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Side-by-side: Strediska + Donut ──────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Náklady po strediskách */}
            <div style={card}>
              <ChartHeader title="Náklady po strediskách" subtitle={kpiSubtitle} />
              {!data?.byStredisko.length ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(220, data.byStredisko.length * 32)}
                >
                  <BarChart
                    data={data.byStredisko}
                    layout="vertical"
                    margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} unit=" €" />
                    <YAxis
                      type="category"
                      dataKey="stredisko"
                      tick={{ fontSize: 11, fill: "var(--muted)" }}
                      width={180}
                    />
                    <Tooltip
                      formatter={(v: number) => `${v.toFixed(2)} €`}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="celkovaCena" fill={accentHex} radius={[0, 4, 4, 0]} name="Celkom (€)" />
                    <Bar dataKey="nadlimit" fill={dangerHex} radius={[0, 4, 4, 0]} name="Nadlimit (€)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Donut — firemné služby */}
            <div style={card}>
              <ChartHeader title="Štruktúra firemných poplatkov" subtitle={`${kpiSubtitle} · top služby`} />
              {!hasPie ? (
                <div className="text-sm py-8 text-center" style={{ color: "var(--faint)" }}>
                  Žiadne firemné poplatky
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-[40%] flex-shrink-0">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={data!.topFiremneSluzby}
                          dataKey="suma"
                          nameKey="entryName"
                          cx="50%" cy="50%"
                          outerRadius={80} innerRadius={40}
                        >
                          {data!.topFiremneSluzby.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => `${v.toFixed(2)} €`}
                          contentStyle={{
                            background: "var(--surface)",
                            border: "1px solid var(--line)",
                            borderRadius: "8px",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 w-full space-y-1.5 text-xs">
                    {data!.topFiremneSluzby.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="truncate flex-1" style={{ color: "var(--muted)" }}>
                          {s.entryName}
                        </span>
                        <span
                          className="font-semibold tabular-nums"
                          style={{ color: "var(--ink)" }}
                        >
                          {s.suma.toFixed(2)} €
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Opakovní prekračovatelia ──────────────────────────────────── */}
          <div style={card}>
            <ChartHeader title="Opakovní prekračovatelia" subtitle="Posledných 6 mesiacov" />
            {!data?.topPrekracovateliaRaw.length ? (
              <EmptyState label="Žiadni opakovní prekračovatelia" />
            ) : (
              <div className="space-y-2">
                {data.topPrekracovateliaRaw.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 text-sm"
                    style={{ borderBottom: "1px solid var(--line)" }}
                  >
                    <div>
                      <span className="font-medium" style={{ color: "var(--ink)" }}>
                        {p._id.personName || "Nespárované"}
                      </span>
                      <span className="text-xs ml-2" style={{ color: "var(--faint)" }}>
                        {p.pocetMesiacov}× prekročil · ø {p.avgNadlimit.toFixed(2)} €
                      </span>
                    </div>
                    <span className="font-semibold tabular-nums" style={{ color: "var(--danger)" }}>
                      {p.sumaNadlimitov.toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Tabuľka po strediskách ────────────────────────────────────── */}
          {(data?.byStredisko.length ?? 0) > 0 && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                overflow: "hidden",
              }}
            >
              <div
                className="px-5 py-3"
                style={{ borderBottom: "1px solid var(--line)" }}
              >
                <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                  Detail po strediskách — {kpiSubtitle}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr style={{ background: "var(--paper)" }}>
                      {["Stredisko", "Celkové náklady", "Nadlimity", "% nadlimitov"].map(
                        (h, i) => (
                          <th
                            key={h}
                            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide ${
                              i === 0 ? "text-left" : "text-right"
                            }`}
                            style={{ color: "var(--faint)" }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data!.byStredisko.map((s, rowIdx) => (
                      <tr
                        key={s.stredisko}
                        style={{
                          borderTop: "1px solid var(--line)",
                          background: rowIdx % 2 === 0 ? "transparent" : "var(--paper)",
                        }}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--ink)" }}>
                          {s.stredisko || (
                            <span style={{ color: "var(--faint)", fontStyle: "italic" }}>
                              Bez strediska
                            </span>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-right tabular-nums"
                          style={{ color: "var(--muted)" }}
                        >
                          {s.celkovaCena.toFixed(2)} €
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {s.nadlimit > 0 ? (
                            <span className="font-semibold" style={{ color: "var(--danger)" }}>
                              {s.nadlimit.toFixed(2)} €
                            </span>
                          ) : (
                            <span style={{ color: "var(--faint)" }}>—</span>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-right tabular-nums"
                          style={{ color: "var(--muted)" }}
                        >
                          {s.celkovaCena > 0
                            ? `${((s.nadlimit / s.celkovaCena) * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  title, value, icon, variant, subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant: "accent" | "neutral" | "danger";
  subtitle?: string;
}) {
  const iconStyle: React.CSSProperties =
    variant === "accent"
      ? { background: "var(--accent-soft)", color: "var(--accent)" }
      : variant === "danger"
      ? { background: "color-mix(in srgb, var(--danger) 10%, transparent)", color: "var(--danger)" }
      : { background: "var(--paper)", color: "var(--muted)" };

  const valueColor =
    variant === "accent"
      ? "var(--accent)"
      : variant === "danger"
      ? "var(--danger)"
      : "var(--ink)";

  return (
    <div
      className="p-4"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius)",
      }}
    >
      <div
        className="inline-flex p-2 mb-3"
        style={{ ...iconStyle, borderRadius: "calc(var(--radius) * 0.75)" }}
      >
        {icon}
      </div>
      <div
        className="font-serif text-2xl tabular-nums leading-none mb-0.5"
        style={{ color: valueColor }}
      >
        {value}
      </div>
      <div className="text-xs font-medium" style={{ color: "var(--ink)" }}>
        {title}
      </div>
      {subtitle && (
        <div className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function ChartHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <div className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
        {title}
      </div>
      {subtitle && (
        <div className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function EmptyState({ label = "Zatiaľ žiadne dáta" }: { label?: string }) {
  return (
    <div className="text-sm py-8 text-center" style={{ color: "var(--faint)" }}>
      {label}
    </div>
  );
}
