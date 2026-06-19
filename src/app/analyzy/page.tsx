"use client";
import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { Phone, Euro, AlertTriangle, TrendingUp } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { useCompany } from "@/contexts/CompanyContext";

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "Máj", "Jún",
  "Júl", "Aug", "Sep", "Okt", "Nov", "Dec",
];

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

interface LatestStats {
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
  latestStats: LatestStats | null;
  periodStats: PeriodStats | null;
  periodLabel: string;
}

const PIE_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#ef4444", "#14b8a6", "#f97316", "#84cc16",
];

type TabKey = "sfz" | "marketing" | "all";

const TABS: { key: TabKey; label: string; cn: string }[] = [
  { key: "sfz",       label: "SFZ",            cn: "0252080007" },
  { key: "marketing", label: "SFZ Marketing",  cn: "0252219878" },
  { key: "all",       label: "Všetky",          cn: "" },
];

function cnToTab(cn: string): TabKey {
  if (cn === "0252080007") return "sfz";
  if (cn === "0252219878") return "marketing";
  return "all";
}

export default function AnalyzyPage() {
  const { selectedCn } = useCompany();
  const [activeTab, setActiveTab] = useState<TabKey>(cnToTab(selectedCn));
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Period filter state
  const [years, setYears] = useState<string[]>([]);
  const [year, setYear] = useState("");
  const [monthFrom, setMonthFrom] = useState("01");
  const [monthTo, setMonthTo] = useState("12");

  // Fetch available years on mount / tab change
  useEffect(() => {
    const cn = TABS.find((t) => t.key === activeTab)?.cn ?? "";
    const qs = cn ? `?cn=${cn}` : "";
    fetch(`/api/periods${qs}`)
      .then((r) => r.json())
      .then((d: { years: string[]; latestYear: string; latestMonth: string }) => {
        setYears(d.years);
        setYear(d.latestYear);
        setMonthFrom("01");
        setMonthTo(d.latestMonth);
      });
  }, [activeTab]);

  const fetchData = useCallback((tab: TabKey, yr: string, mFrom: string, mTo: string) => {
    setLoading(true);
    const cn = TABS.find((t) => t.key === tab)?.cn ?? "";
    const params = new URLSearchParams();
    if (cn) params.set("cn", cn);
    if (yr) { params.set("year", yr); params.set("monthFrom", mFrom); params.set("monthTo", mTo); }
    fetch(`/api/analytics?${params.toString()}`)
      .then((r) => r.json())
      .then((d: AnalyticsData) => { setData(d); setLoading(false); });
  }, []);

  // Fetch data when tab or period changes
  useEffect(() => {
    if (!year) return; // wait for periods to load
    fetchData(activeTab, year, monthFrom, monthTo);
  }, [activeTab, year, monthFrom, monthTo, fetchData]);

  // Sync tab when sidebar switcher changes
  useEffect(() => {
    setActiveTab(cnToTab(selectedCn));
  }, [selectedCn]);

  // Clamp monthTo >= monthFrom
  const handleMonthFrom = (v: string) => {
    setMonthFrom(v);
    if (parseInt(v) > parseInt(monthTo)) setMonthTo(v);
  };
  const handleMonthTo = (v: string) => {
    setMonthTo(v);
    if (parseInt(v) < parseInt(monthFrom)) setMonthFrom(v);
  };

  const trendData = data?.monthlyTrend.map((m) => ({
    mesiac: m.mesiac.replace(/^\d{4}-/, ""),
    "Náklady (€)": m.celkovaNaklady,
    "Nadlimity (€)": m.sumaNadlimitov,
  })) ?? [];

  const stackedData = data?.stackedTrend.map((m) => ({
    mesiac: m.mesiac.replace(/^\d{4}-/, ""),
    "Zamestnanci (€)": m.zamestnanci,
    "Firemné (€)": m.firemne,
  })) ?? [];

  const hasFiremne = data?.stackedTrend.some((m) => m.firemne > 0) ?? false;
  const hasPie = (data?.topFiremneSluzby.length ?? 0) > 0;

  // Determine which KPI to show: periodStats if we have a period, else latestStats
  const kpiStats = data?.periodStats ?? data?.latestStats;
  const kpiSubtitle = data?.periodLabel ?? data?.lastMonth ?? "";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analýzy a trendy</h1>

      {/* Tabs + Period filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Period filters */}
        {years.length > 0 && (
          <div className="flex items-center gap-2">
            <CustomSelect
              value={year}
              onChange={setYear}
              className="w-28"
              options={years.map((y) => ({ value: y, label: y }))}
            />
            <span className="text-xs text-gray-400">od</span>
            <CustomSelect
              value={monthFrom}
              onChange={handleMonthFrom}
              className="w-24"
              options={MONTH_NAMES.slice(1).map((name, i) => ({
                value: (i + 1).toString().padStart(2, "0"),
                label: name,
              }))}
            />
            <span className="text-xs text-gray-400">do</span>
            <CustomSelect
              value={monthTo}
              onChange={handleMonthTo}
              className="w-24"
              options={MONTH_NAMES.slice(1).map((name, i) => ({
                value: (i + 1).toString().padStart(2, "0"),
                label: name,
              }))}
            />
          </div>
        )}
      </div>

      {/* KPI widgets — skeleton or real */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-7 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : kpiStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Čísiel celkom"
            value={kpiStats.pocetCisel}
            icon={<Phone size={18} />}
            color="blue"
            subtitle={kpiSubtitle}
          />
          <KpiCard
            title="Celkové náklady"
            value={`${kpiStats.celkovaNaklady.toFixed(2)} €`}
            icon={<Euro size={18} />}
            color="gray"
            subtitle="bez DPH"
          />
          <KpiCard
            title="Nadlimitov"
            value={kpiStats.pocetNadlimitov}
            icon={<AlertTriangle size={18} />}
            color="red"
            subtitle="zamestnancov"
          />
          <KpiCard
            title="Suma nadlimitov"
            value={`${kpiStats.sumaNadlimitov.toFixed(2)} €`}
            icon={<TrendingUp size={18} />}
            color="orange"
            subtitle="bez DPH"
          />
        </div>
      ) : null}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Načítavam analýzy…</div>
      ) : (
        <>
          {/* Stacked: zamestnanci vs firma */}
          {hasFiremne && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">
                Celkové náklady — zamestnanci vs. spoločnosť
              </h2>
              <p className="text-xs text-gray-400 mb-4">Bez DPH · {kpiSubtitle}</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stackedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mesiac" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit=" €" />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
                  <Legend />
                  <Bar dataKey="Zamestnanci (€)" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Firemné (€)" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Trend zamestnaneckých nákladov */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-1">Zamestnanecké náklady a nadlimity</h2>
            <p className="text-xs text-gray-400 mb-4">Bez DPH · {kpiSubtitle}</p>
            {trendData.length === 0 ? (
              <p className="text-gray-400 text-sm">Zatiaľ žiadne dáta</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mesiac" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit=" €" />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
                  <Legend />
                  <Line type="monotone" dataKey="Náklady (€)" stroke="#6366f1" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="Nadlimity (€)" stroke="#ef4444" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Náklady po strediskách */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Náklady po strediskách</h2>
              <p className="text-xs text-gray-400 mb-4">{kpiSubtitle}</p>
              {!data?.byStredisko.length ? (
                <p className="text-gray-400 text-sm">Žiadne dáta</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.byStredisko} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} unit=" €" />
                    <YAxis type="category" dataKey="stredisko" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
                    <Bar dataKey="celkovaCena" fill="#6366f1" radius={[0, 4, 4, 0]} name="Celkom (€)" />
                    <Bar dataKey="nadlimit" fill="#ef4444" radius={[0, 4, 4, 0]} name="Nadlimit (€)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Firemné náklady — rozklad po službách */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Štruktúra firemných poplatkov</h2>
              <p className="text-xs text-gray-400 mb-4">{kpiSubtitle} · top služby</p>
              {!hasPie ? (
                <div className="text-gray-400 text-sm py-6 text-center">
                  Žiadne firemné poplatky (reimportujte výpis)
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={data!.topFiremneSluzby}
                        dataKey="suma"
                        nameKey="entryName"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                      >
                        {data!.topFiremneSluzby.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5 text-xs">
                    {data!.topFiremneSluzby.map((s, i) => (
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
              )}
            </div>
          </div>

          {/* Top opakovní prekračovatelia */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-1">Opakovní prekračovatelia</h2>
            <p className="text-xs text-gray-400 mb-4">Posledných 6 mesiacov</p>
            {!data?.topPrekracovateliaRaw.length ? (
              <p className="text-gray-400 text-sm">Žiadni opakovní prekračovatelia</p>
            ) : (
              <div className="space-y-3">
                {data.topPrekracovateliaRaw.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-900">
                        {p._id.personName || "Nespárované"}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {p.pocetMesiacov}× prekročil · ø {p.avgNadlimit.toFixed(2)} €
                      </span>
                    </div>
                    <span className="text-red-600 font-semibold">{p.sumaNadlimitov.toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sumarizačná tabuľka po strediskách */}
          {(data?.byStredisko.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Detail po strediskách — {kpiSubtitle}</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Stredisko</th>
                    <th className="px-4 py-3 text-right">Celkové náklady</th>
                    <th className="px-4 py-3 text-right">Nadlimity</th>
                    <th className="px-4 py-3 text-right">% nadlimitov</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data!.byStredisko.map((s) => (
                    <tr key={s.stredisko} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{s.stredisko || <span className="text-gray-400 italic">Bez strediska</span>}</td>
                      <td className="px-4 py-3 text-right">{s.celkovaCena.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-right">
                        {s.nadlimit > 0 ? (
                          <span className="text-red-600 font-medium">{s.nadlimit.toFixed(2)} €</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {s.celkovaCena > 0 ? `${((s.nadlimit / s.celkovaCena) * 100).toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({
  title, value, icon, color, subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "gray" | "red" | "orange";
  subtitle?: string;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    gray: "bg-gray-100 text-gray-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{title}</div>
      {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
    </div>
  );
}
