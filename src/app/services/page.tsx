"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { Layers, Euro, ChevronDown, ArrowRight } from "lucide-react";
import { SelectField } from "@/components/SelectField";
import { useCompany } from "@/contexts/CompanyContext";

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "Máj", "Jún",
  "Júl", "Aug", "Sep", "Okt", "Nov", "Dec",
];

const COMPANY_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
];

const PIE_COLORS = [
  "#f97316", "#fb923c", "#fdba74", "#6366f1", "#8b5cf6",
  "#ec4899", "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];

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

export default function ServicesPage() {
  const { selectedCn, companies } = useCompany();

  const [localCn, setLocalCn] = useState(selectedCn);
  const [years, setYears]     = useState<string[]>([]);
  const [year, setYear]       = useState("");
  const [monthFrom, setMonthFrom] = useState("01");
  const [monthTo, setMonthTo]     = useState("12");

  const [data, setData]       = useState<ServicesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLocalCn(selectedCn); }, [selectedCn]);

  useEffect(() => {
    const qs = localCn ? `?cn=${encodeURIComponent(localCn)}` : "";
    fetch(`/api/periods${qs}`)
      .then((r) => r.json())
      .then((d: { years: string[]; latestYear: string; latestMonth: string }) => {
        setYears(d.years);
        setYear(d.latestYear);
        setMonthFrom("01");
        setMonthTo(d.latestMonth);
      });
  }, [localCn]);

  const fetchData = useCallback((cn: string, yr: string, mFrom: string, mTo: string) => {
    if (!yr) return;
    setLoading(true);
    const params = new URLSearchParams({ year: yr, monthFrom: mFrom, monthTo: mTo });
    if (cn) params.set("cn", cn);
    fetch(`/api/services?${params}`)
      .then((r) => r.json())
      .then((d: ServicesData) => { setData(d); setLoading(false); });
  }, []);

  useEffect(() => {
    fetchData(localCn, year, monthFrom, monthTo);
  }, [localCn, year, monthFrom, monthTo, fetchData]);

  const handleMonthFrom = (v: string) => {
    setMonthFrom(v);
    if (parseInt(v) > parseInt(monthTo)) setMonthTo(v);
  };
  const handleMonthTo = (v: string) => {
    setMonthTo(v);
    if (parseInt(v) < parseInt(monthFrom)) setMonthFrom(v);
  };

  const cnColorMap = new Map(
    companies.map((c, i) => [c.cn, COMPANY_COLORS[i % COMPANY_COLORS.length]])
  );

  const barData = data?.byMonth.map((m) => ({
    mesiac: m.mesiac.replace(/^\d{4}-/, ""),
    "Služby (€)": m.total,
  })) ?? [];

  const hasPie = (data?.topServices.length ?? 0) > 0;
  const badgeColor = cnColorMap.get(localCn) ?? COMPANY_COLORS[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
          <Layers size={18} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Služby spoločnosti</h1>
          <p className="text-xs text-gray-400 mt-0.5">MAIN-CONS záznamy z Orange výpisu</p>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <SelectField value={localCn} onChange={(e) => setLocalCn(e.target.value)}>
          <option value="">Všetky spoločnosti</option>
          {companies.map((c) => (
            <option key={c.cn} value={c.cn}>{c.companyName}</option>
          ))}
        </SelectField>

        {years.length > 0 && (
          <>
            <SelectField value={year} onChange={(e) => setYear(e.target.value)}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </SelectField>
            <span className="text-xs text-gray-400">od</span>
            <SelectField value={monthFrom} onChange={(e) => handleMonthFrom(e.target.value)}>
              {MONTH_NAMES.slice(1).map((name, i) => {
                const val = (i + 1).toString().padStart(2, "0");
                return <option key={val} value={val}>{name}</option>;
              })}
            </SelectField>
            <span className="text-xs text-gray-400">do</span>
            <SelectField value={monthTo} onChange={(e) => handleMonthTo(e.target.value)}>
              {MONTH_NAMES.slice(1).map((name, i) => {
                const val = (i + 1).toString().padStart(2, "0");
                return <option key={val} value={val}>{name}</option>;
              })}
            </SelectField>
          </>
        )}

        {data && !loading && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">{data.periodLabel}</span>
            {localCn && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
                {data.companyName}
              </span>
            )}
          </div>
        )}
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-7 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : data?.summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="inline-flex p-2 rounded-lg bg-orange-50 text-orange-600 mb-3">
              <Euro size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">
              {data.summary.total.toFixed(2)} €
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Celková suma štandardných služieb</div>
            <div className="text-xs text-gray-400">bez DPH · {data.periodLabel}</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="inline-flex p-2 rounded-lg bg-orange-50 text-orange-600 mb-3">
              <Layers size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">
              {data.summary.count}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Počet MAIN-CONS záznamov</div>
            <div className="text-xs text-gray-400">štandardné firemné služby</div>
          </div>
        </div>
      ) : null}

      {!loading && data && (
        <>
          {/* Bar chart */}
          {barData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Štandardné služby po mesiacoch</h2>
              <p className="text-xs text-gray-400 mb-4">MAIN-CONS · bez DPH</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mesiac" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit=" €" />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
                  <Bar dataKey="Služby (€)" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top services pie */}
          {hasPie && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Top štandardné služby</h2>
              <p className="text-xs text-gray-400 mb-4">{data.periodLabel} · podľa sumy bez DPH</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="40%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.topServices}
                      dataKey="suma"
                      nameKey="entryName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                    >
                      {data.topServices.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5 text-xs">
                  {data.topServices.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-gray-600 truncate flex-1">{s.entryName}</span>
                      <span className="font-medium text-gray-900 tabular-nums">{s.suma.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Per-month table with links to detail */}
          {data.byMonth.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Prehľad po mesiacoch</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {data.byMonth.slice().reverse().map((m) => (
                  <Link
                    key={m.mesiac}
                    href={`/services/${m.mesiac}${localCn ? `?cn=${encodeURIComponent(localCn)}` : ""}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-orange-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900 text-sm">{m.mesiac}</span>
                      <span className="text-xs text-gray-400">{m.count} záznamov</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900 text-sm">{m.total.toFixed(2)} €</span>
                      <ArrowRight size={15} className="text-gray-300 group-hover:text-orange-500" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && (!data || data.byMonth.length === 0) && (
        <div className="text-center py-16 text-gray-400">
          <p>Žiadne MAIN-CONS záznamy pre vybrané obdobie.</p>
          <Link href="/import" className="text-orange-500 hover:underline mt-2 block text-sm">
            Importovať výpis →
          </Link>
        </div>
      )}
    </div>
  );
}
