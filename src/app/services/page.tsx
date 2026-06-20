"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { Layers, Euro, ArrowRight } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { usePeriod } from "@/contexts/PeriodContext";
import { useTheme, THEMES } from "@/contexts/ThemeContext";

// ── Constants ─────────────────────────────────────────────────────────────────

const PIE_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#ef4444", "#14b8a6", "#f97316", "#84cc16",
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Summary {
  total: number;
  count: number;
}

interface ByMonth {
  mesiac: string;
  total: number;
  count: number;
}

interface TopService {
  entryName: string;
  suma: number;
}

interface ServicesData {
  companyName: string;
  periodLabel: string;
  summary: Summary;
  byMonth: ByMonth[];
  topServices: TopService[];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const { selectedCn } = useCompany();
  const { year, monthFrom, monthTo, periodLabel: ctxLabel, periodsLoading } = usePeriod();
  const { theme } = useTheme();
  const accentHex = THEMES.find((t) => t.dir === theme)?.accent ?? "#ff7900";

  const [data, setData]     = useState<ServicesData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback((cn: string, yr: string, mFrom: string, mTo: string) => {
    if (!yr) return;
    setLoading(true);
    const params = new URLSearchParams({ year: yr, monthFrom: mFrom, monthTo: mTo });
    if (cn) params.set("cn", cn);
    fetch(`/api/services?${params}`)
      .then((r) => r.json())
      .then((d: ServicesData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (periodsLoading || !year) return;
    fetchData(selectedCn, year, monthFrom, monthTo);
  }, [selectedCn, year, monthFrom, monthTo, periodsLoading, fetchData]);

  const barData = data?.byMonth.map((m) => ({
    mesiac: m.mesiac.replace(/^\d{4}-/, ""),
    "Služby (€)": m.total,
  })) ?? [];

  const hasPie = (data?.topServices.length ?? 0) > 0;
  const periodLabel = ctxLabel || data?.periodLabel || "";

  const totalServices = data?.topServices.reduce((sum, s) => sum + s.suma, 0) ?? 1;

  const tooltipStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "8px",
    fontSize: 12,
  };

  const card: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: "1.25rem",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent-soft)", borderRadius: "var(--radius)" }}
        >
          <Layers size={18} style={{ color: "var(--accent-ink)" }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--ink)" }}>
            Služby spoločnosti
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>
            MAIN-CONS záznamy z Orange výpisu
          </p>
        </div>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-4 animate-pulse" style={{ ...card, minHeight: 88 }}>
              <div className="h-3 rounded mb-3 w-3/4" style={{ background: "var(--faint)" }} />
              <div className="h-6 rounded w-1/2" style={{ background: "var(--faint)" }} />
            </div>
          ))}
        </div>
      ) : data?.summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div style={card}>
            <div
              className="inline-flex p-2 mb-3"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent-ink)",
                borderRadius: "calc(var(--radius) * 0.75)",
              }}
            >
              <Euro size={18} />
            </div>
            <div className="font-serif text-2xl tabular-nums leading-none mb-0.5" style={{ color: "var(--ink)" }}>
              {data.summary.total.toFixed(2)} €
            </div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Celková suma štandardných služieb
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>
              bez DPH · {periodLabel}
            </div>
          </div>

          <div style={card}>
            <div
              className="inline-flex p-2 mb-3"
              style={{
                background: "var(--paper)",
                color: "var(--muted)",
                borderRadius: "calc(var(--radius) * 0.75)",
              }}
            >
              <Layers size={18} />
            </div>
            <div className="font-serif text-2xl tabular-nums leading-none mb-0.5" style={{ color: "var(--ink)" }}>
              {data.summary.count}
            </div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Počet MAIN-CONS záznamov
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>
              štandardné firemné služby
            </div>
          </div>
        </div>
      ) : null}

      {!loading && data && (
        <>
          {/* Bar chart */}
          {barData.length > 0 && (
            <div style={card}>
              <div className="mb-4">
                <div className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                  Štandardné služby po mesiacoch
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>
                  MAIN-CONS · bez DPH
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="mesiac" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} unit=" €" />
                  <Tooltip
                    formatter={(v: number) => `${v.toFixed(2)} €`}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="Služby (€)" fill={accentHex} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top services pie + progress bars */}
          {hasPie && (
            <div style={card}>
              <div className="mb-4">
                <div className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                  Top štandardné služby
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>
                  {periodLabel} · podľa sumy bez DPH
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-full sm:w-[40%] flex-shrink-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.topServices}
                        dataKey="suma"
                        nameKey="entryName"
                        cx="50%" cy="50%"
                        outerRadius={80} innerRadius={40}
                      >
                        {data.topServices.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => `${v.toFixed(2)} €`}
                        contentStyle={tooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-3 text-xs">
                  {data.topServices.map((s, i) => {
                    const pct = Math.round((s.suma / totalServices) * 100);
                    return (
                      <div key={i}>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="truncate flex-1" style={{ color: "var(--muted)" }}>
                            {s.entryName}
                          </span>
                          <span className="font-semibold tabular-nums flex-shrink-0" style={{ color: "var(--ink)" }}>
                            {s.suma.toFixed(2)} €
                          </span>
                          <span className="tabular-nums flex-shrink-0 w-8 text-right" style={{ color: "var(--faint)" }}>
                            {pct}%
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div
                          className="relative overflow-hidden"
                          style={{ height: 3, borderRadius: 9999, background: "var(--line)" }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              inset: "0 auto 0 0",
                              width: `${pct}%`,
                              background: PIE_COLORS[i % PIE_COLORS.length],
                              borderRadius: 9999,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Per-month table */}
          {data.byMonth.length > 0 && (
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
                  Prehľad po mesiacoch
                </span>
              </div>
              <div>
                {data.byMonth.slice().reverse().map((m) => (
                  <Link
                    key={m.mesiac}
                    href={`/services/${m.mesiac}${selectedCn ? `?cn=${encodeURIComponent(selectedCn)}` : ""}`}
                    className="flex items-center justify-between px-5 py-3.5 transition-colors"
                    style={{ borderBottom: "1px solid var(--line)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--paper)";
                      const arrow = e.currentTarget.querySelector<HTMLElement>(".arrow-icon");
                      if (arrow) arrow.style.color = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      const arrow = e.currentTarget.querySelector<HTMLElement>(".arrow-icon");
                      if (arrow) arrow.style.color = "var(--faint)";
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                        {m.mesiac}
                      </span>
                      <span className="text-xs" style={{ color: "var(--faint)" }}>
                        {m.count} záznamov
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                        {m.total.toFixed(2)} €
                      </span>
                      <ArrowRight
                        size={15}
                        className="arrow-icon"
                        style={{ color: "var(--faint)", transition: "color 0.15s" }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && (!data || data.byMonth.length === 0) && (
        <div className="text-center py-16" style={{ color: "var(--faint)" }}>
          <p>Žiadne MAIN-CONS záznamy pre vybrané obdobie.</p>
          <Link
            href="/import"
            className="mt-2 block text-sm hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Importovať výpis →
          </Link>
        </div>
      )}
    </div>
  );
}
