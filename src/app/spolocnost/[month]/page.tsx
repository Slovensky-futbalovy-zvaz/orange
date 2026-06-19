"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Building2 } from "lucide-react";

interface Detail {
  entryName: string;
  amount: number | null;
  units: number | null;
  priceWithoutVat: number;
}

interface CompanyItem {
  _id: string;
  invoiceType: string;
  userName: string;
  celkovaCena: number;
  details: Detail[];
}

interface ReportData {
  mesiac: string;
  cn: string;
  annex: CompanyItem[];      // ANNEX + userName="" (firemné poplatky)
  mainCons: CompanyItem[];   // ANNEX + userName≠"" (zamestnanecké ANNEX)
  totalAnnex: number;
  totalMainCons: number;
  total: number;
}

function Section({
  title,
  subtitle,
  items,
  total,
  colorClass,
}: {
  title: string;
  subtitle?: string;
  items: CompanyItem[];
  total: number;
  colorClass: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className={`px-5 py-3 border-b border-gray-100 flex items-center justify-between ${colorClass}`}>
        <div>
          <span className="font-semibold text-sm">{title}</span>
          {subtitle && <span className="text-xs ml-2 opacity-60">{subtitle}</span>}
          <span className="text-xs ml-2 opacity-70">({items.length} záznamov)</span>
        </div>
        <span className="font-bold text-sm">{total.toFixed(2)} €</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-2 text-left">Popis / Telefónne číslo</th>
            <th className="px-4 py-2 text-right">Cena bez DPH</th>
            <th className="px-4 py-2 w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <>
              <tr
                key={item._id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => toggle(item._id)}
              >
                <td className="px-4 py-3 text-gray-800">
                  {item.userName || <span className="italic text-gray-400">Firemná služba (bez čísla)</span>}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {item.celkovaCena.toFixed(2)} €
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {item.details.length > 0 &&
                    (expanded.has(item._id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </td>
              </tr>
              {expanded.has(item._id) && item.details.length > 0 && (
                <tr key={`${item._id}-det`} className="bg-gray-50">
                  <td colSpan={3} className="px-6 py-3">
                    <div className="text-xs text-gray-500 space-y-1">
                      {item.details.map((d, i) => (
                        <div key={i} className="flex justify-between gap-4">
                          <span className="flex-1">{d.entryName}</span>
                          {d.amount != null && (
                            <span className="text-gray-400">{d.amount} ks</span>
                          )}
                          <span
                            className={`font-mono ${
                              d.priceWithoutVat < 0 ? "text-green-600" : "text-gray-700"
                            }`}
                          >
                            {d.priceWithoutVat.toFixed(4)} €
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SpolocnostDetailPage({ params }: { params: { month: string } }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const cn = searchParams.get("cn") || "";

  useEffect(() => {
    const qs = cn ? `?cn=${encodeURIComponent(cn)}` : "";
    fetch(`/api/company-report/${params.month}${qs}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [params.month, cn]);

  if (loading) return <div className="text-center py-20 text-gray-400">Načítavam…</div>;
  if (!data) return null;

  const isEmpty = data.annex.length === 0 && data.mainCons.length === 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 size={18} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Poplatky spoločnosti — {params.month}
            </h1>
            {data.cn && (
              <p className="text-xs text-gray-400 mt-0.5">CN: {data.cn}</p>
            )}
          </div>
        </div>
        {!isEmpty && (
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{data.total.toFixed(2)} €</div>
            <div className="text-xs text-gray-400 mt-0.5">celkom bez DPH</div>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <Building2 size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Žiadne firemné poplatky pre tento mesiac</p>
          <p className="text-sm mt-1">
            Reimportujte výpis — ANNEX záznamy sa uložia automaticky.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Sumárne karty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">
                Firemné poplatky
              </div>
              <div className="text-xl font-bold text-blue-800">
                {data.totalAnnex.toFixed(2)} €
              </div>
              <div className="text-xs text-blue-500 mt-0.5">
                {data.annex.length} záznamov · bez viazby na číslo
              </div>
            </div>
            {data.mainCons.length > 0 && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <div className="text-xs text-purple-600 font-medium uppercase tracking-wide mb-1">
                  ANNEX — Zamestnanecké
                </div>
                <div className="text-xl font-bold text-purple-800">
                  {data.totalMainCons.toFixed(2)} €
                </div>
                <div className="text-xs text-purple-500 mt-0.5">
                  {data.mainCons.length} záznamov · viazané na číslo
                </div>
              </div>
            )}
          </div>

          <Section
            title="Firemné poplatky"
            subtitle="ANNEX · bez telefónneho čísla"
            items={data.annex}
            total={data.totalAnnex}
            colorClass="bg-blue-50 text-blue-800"
          />
          <Section
            title="ANNEX — Zamestnanecké"
            subtitle="viazané na konkrétne číslo"
            items={data.mainCons}
            total={data.totalMainCons}
            colorClass="bg-purple-50 text-purple-800"
          />
        </div>
      )}
    </div>
  );
}
