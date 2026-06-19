"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";

interface Detail {
  entryName: string;
  amount: number | null;
  units: number | null;
  priceWithoutVat: number;
}

interface ServiceItem {
  _id: string;
  userName: string;
  celkovaCena: number;
  details: Detail[];
}

interface ReportData {
  mesiac: string;
  cn: string;
  items: ServiceItem[];
  total: number;
}

export default function ServiceDetailPage({ params }: { params: { month: string } }) {
  const [data, setData]     = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();
  const cn = searchParams.get("cn") || "";

  useEffect(() => {
    const qs = cn ? `?cn=${encodeURIComponent(cn)}` : "";
    fetch(`/api/service-report/${params.month}${qs}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [params.month, cn]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Načítavam…</div>;
  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
            <Layers size={18} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Služby spoločnosti — {params.month}
            </h1>
            {data.cn && (
              <p className="text-xs text-gray-400 mt-0.5">CN: {data.cn}</p>
            )}
          </div>
        </div>
        {data.items.length > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{data.total.toFixed(2)} €</div>
            <div className="text-xs text-gray-400 mt-0.5">celkom bez DPH</div>
          </div>
        )}
      </div>

      {data.items.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <Layers size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Žiadne MAIN-CONS záznamy pre tento mesiac</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <div className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">
              Štandardné firemné služby (MAIN-CONS)
            </div>
            <div className="text-xl font-bold text-orange-800">
              {data.total.toFixed(2)} €
            </div>
            <div className="text-xs text-orange-500 mt-0.5">
              {data.items.length} záznamov · bez DPH
            </div>
          </div>

          {/* Items table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-orange-50 flex items-center justify-between">
              <span className="font-semibold text-sm text-orange-800">
                MAIN-CONS · {data.items.length} záznamov
              </span>
              <span className="font-bold text-sm text-orange-800">{data.total.toFixed(2)} €</span>
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
                {data.items.map((item) => (
                  <>
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleExpand(item._id)}
                    >
                      <td className="px-4 py-3 text-gray-800">
                        {item.userName || (
                          <span className="italic text-gray-400">Firemná služba (bez čísla)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {item.celkovaCena.toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {item.details.length > 0 && (
                          expanded.has(item._id)
                            ? <ChevronUp size={14} />
                            : <ChevronDown size={14} />
                        )}
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
        </div>
      )}
    </div>
  );
}
