"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { Phone, Euro, Building2, TrendingUp } from "lucide-react";
import { SignalBars } from "@/components/SignalBars";
import { usePeriod } from "@/contexts/PeriodContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, THEMES } from "@/contexts/ThemeContext";
import { formatEur, formatInt } from "@/lib/format";

// ── Types ────────────────────────────────────────────────────────────────────

interface MonthlyTrend {
  mesiac: string;
  celkovaNaklady: number;
  sumaNadlimitov: number;
  pocetNadlimitov: number;
}

interface CompanyStat {
  cn: string;
  companyName: string;
  celkovaNaklady: number;
  pocetCisel: number;
  pocetNadlimitov: number;
  sumaNadlimitov: number;
  podiel: number;
}

interface PeriodStats {
  pocetCisel: number;
  celkovaNaklady: number;
  pocetNadlimitov: number;
  sumaNadlimitov: number;
}

interface ComplexData {
  periodLabel: string;
  periodStats: PeriodStats;
  monthlyTrend: MonthlyTrend[];
  byCompany: CompanyStat[];
  companyOrder: string[];
  monthlyByCompany: Array<Record<string, number | string>>;
}

// ── Company colour palette — readable on all themes ──────────────────────────
const COMPANY_COLORS = [
  "#ff7900", "#6366f1", "#10b981", "#ec4899", "#3b82f6",
  "#f59e0b", "#8b5cf6", "#14b8a6", "#ef4444", "#84cc16",
  "#0ea5e9", "#d946ef", "#22c55e", "#fb7185", "#a855f7",
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ComplexOverviewPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { year, monthFrom, monthTo, periodLabel: ctxLabel, periodsLoading } = usePeriod();
  const { theme } = useTheme();

  const accentHex = THEMES.find((t) => t.dir === theme)?.accent ?? "#ff7900";
  const dangerHex = "#ef4444";

  const [data, setData] = useState<ComplexData | null>(null);
  const [loading, setLoading] = useState(true);

  // Client-side guard — middleware nepozná príznak (JWT nesie len rolu)
  const allowed = !!user && (user.role === "admin" || user.complexOverview === true);
  useEffect(() => {
    if (!authLoading && user && !allowed) {
      router.replace("/overview");
    }
  }, [authLoading, user, allowed, router]);

  const fetchData = useCallback((yr: string, mFrom: string, mTo: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (yr) {
      params.set("year", yr);
      params.set("monthFrom", mFrom);
      params.set("monthTo", mTo);
    }
    fetch(`/api/complex-overview?${params.toString()}`)
      .then((r) => r.json())
      .then((d: ComplexData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!allowed || periodsLoading || !year) return;
    fetchData(year, monthFrom, monthTo);
  }, [allowed, year, monthFrom, monthTo, periodsLoading, fetchData]);

  const subtitle = ctxLabel || data?.periodLabel || "";

  const trendData =
    data?.monthlyTrend.map((m) => ({
      mesiac: m.mesiac.replace(/^\d{4}-/, ""),
      "Náklady (€)": m.celkovaNaklady,
      "Nadlimity (€)": m.sumaNadlimitov,
    })) ?? [];

  const stackedData =
    data?.monthlyByCompany.map((row) => ({
      ...row,
      mesiac: (row.mesiac as string).replace(/^\d{4}-/, ""),
    })) ?? [];

  const hasStacked = (data?.companyOrder.length ?? 0) > 0 && stackedData.length > 0;
  const hasPie = (data?.byCompany.length ?? 0) > 0;

  const card: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: "1.25rem",
  };

  if (!authLoading && user && !allowed) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--ink)" }}>
          Komplexný prehľad
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--faint)" }}>
          Náklady za všetky spoločnosti · {subtitle}
        </p>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse p-4" style={{ ...card, minHeight: 90 }}>
              <div className="h-3 rounded mb-3 w-3/4" style={{ background: "var(--faint)" }} />
              <div className="h-6 rounded w-1/2" style={{ background: "var(--faint)" }} />
            </div>
          ))}
        </div>
      ) : data?.periodStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Celkové náklady"
            value={formatEur(data.periodStats.celkovaNaklady)}
            icon={<Euro size={16} />}
            variant="accent"
            subtitle="bez DPH"
          />
          <KpiCard
            title="Spoločností"
            value={formatInt(data.byCompany.length)}
            icon={<Building2 size={16} />}
            variant="neutral"
            subtitle="s nákladmi v období"
          />
          <KpiCard
            title="Čísiel celkom"
            value={formatInt(data.periodStats.pocetCisel)}
            icon={<Phone size={16} />}
            variant="neutral"
            subtitle={subtitle}
          />
          <KpiCard
            title="Suma nadlimitov"
            value={formatEur(data.periodStats.sumaNadlimitov)}
            icon={<TrendingUp size={16} />}
            variant="danger"
            subtitle="bez DPH"
          />
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <SignalBars size="sm" />
        </div>
      ) : (
        <>
          {/* ── Mesačný trend nákladov a nadlimitov ───────────────────────── */}
          <div style={card}>
            <ChartHeader title="Mesačný trend nákladov a nadlimitov" subtitle={`Bez DPH · ${subtitle}`} />
            {trendData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="mesiac" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} unit=" €" tickFormatter={(v) => formatInt(v)} />
                  <Tooltip
                    formatter={(v: number) => formatEur(v)}
                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "8px", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Náklady (€)" stroke={accentHex} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="Nadlimity (€)" stroke={dangerHex} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Náklady po spoločnostiach po mesiacoch (stacked) ───────────── */}
          <div style={card}>
            <ChartHeader
              title="Náklady po spoločnostiach"
              subtitle={`Mesačný rozpad · bez DPH · ${subtitle}`}
            />
            {!hasStacked ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stackedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="mesiac" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} unit=" €" tickFormatter={(v) => formatInt(v)} />
                  <Tooltip
                    formatter={(v: number) => formatEur(v)}
                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "8px", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {data!.companyOrder.map((name, i) => (
                    <Bar
                      key={name}
                      dataKey={name}
                      stackId="a"
                      fill={COMPANY_COLORS[i % COMPANY_COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Podiel spoločností: donut + tabuľka ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div style={card}>
              <ChartHeader title="Podiel spoločností na nákladoch" subtitle={`${subtitle} · % z celku`} />
              {!hasPie ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data!.byCompany}
                      dataKey="celkovaNaklady"
                      nameKey="companyName"
                      cx="50%" cy="50%"
                      outerRadius={90} innerRadius={48}
                    >
                      {data!.byCompany.map((_, i) => (
                        <Cell key={i} fill={COMPANY_COLORS[i % COMPANY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, _n, p) => [`${formatEur(v)} · ${(p.payload as CompanyStat).podiel}%`, (p.payload as CompanyStat).companyName]}
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "8px", fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={card}>
              <ChartHeader title="Spoločnosti — náklady a podiel" subtitle={subtitle} />
              {!hasPie ? (
                <EmptyState />
              ) : (
                <div className="space-y-1.5 text-xs">
                  {data!.byCompany.map((c, i) => (
                    <div key={c.cn} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: COMPANY_COLORS[i % COMPANY_COLORS.length] }}
                      />
                      <span className="truncate flex-1" style={{ color: "var(--muted)" }}>
                        {c.companyName}
                      </span>
                      <span className="tabular-nums" style={{ color: "var(--faint)" }}>
                        {c.podiel}%
                      </span>
                      <span className="font-semibold tabular-nums w-24 text-right" style={{ color: "var(--ink)" }}>
                        {formatEur(c.celkovaNaklady)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Detailná tabuľka po spoločnostiach ────────────────────────── */}
          {hasPie && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                overflow: "hidden",
              }}
            >
              <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
                <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                  Detail po spoločnostiach — {subtitle}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr style={{ background: "var(--paper)" }}>
                      {["Spoločnosť", "Čísiel", "Celkové náklady", "% z celku", "Nadlimity"].map((h, i) => (
                        <th
                          key={h}
                          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide ${i === 0 ? "text-left" : "text-right"}`}
                          style={{ color: "var(--faint)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data!.byCompany.map((c, rowIdx) => (
                      <tr
                        key={c.cn}
                        style={{
                          borderTop: "1px solid var(--line)",
                          background: rowIdx % 2 === 0 ? "transparent" : "var(--paper)",
                        }}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--ink)" }}>
                          {c.companyName}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums" style={{ color: "var(--muted)" }}>
                          {formatInt(c.pocetCisel)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums" style={{ color: "var(--muted)" }}>
                          {formatEur(c.celkovaNaklady)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums" style={{ color: "var(--muted)" }}>
                          {c.podiel}%
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {c.sumaNadlimitov > 0 ? (
                            <span className="font-semibold" style={{ color: "var(--danger)" }}>
                              {formatEur(c.sumaNadlimitov)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--faint)" }}>—</span>
                          )}
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
    variant === "accent" ? "var(--accent)" : variant === "danger" ? "var(--danger)" : "var(--ink)";

  return (
    <div className="p-4" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
      <div className="inline-flex p-2 mb-3" style={{ ...iconStyle, borderRadius: "calc(var(--radius) * 0.75)" }}>
        {icon}
      </div>
      <div className="font-serif text-2xl tabular-nums leading-none mb-0.5" style={{ color: valueColor }}>
        {value}
      </div>
      <div className="text-xs font-medium" style={{ color: "var(--ink)" }}>{title}</div>
      {subtitle && <div className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>{subtitle}</div>}
    </div>
  );
}

function ChartHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <div className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{title}</div>
      {subtitle && <div className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>{subtitle}</div>}
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
