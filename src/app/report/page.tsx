"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";

interface MonthEntry {
  cn: string;
  companyName: string;
  invoiceYear: string;
  invoiceMonth: string;
  pocetCisel: number;
  celkovaNaklady: number;
  pocetNadlimitov: number;
  sumaNadlimitov: number;
}

// Farby badgov pre spoločnosti (cyklické)
const COMPANY_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
];

export default function ReportIndexPage() {
  const { selectedCn, companies } = useCompany();
  const [months, setMonths] = useState<MonthEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = selectedCn ? `?cn=${encodeURIComponent(selectedCn)}` : "";
    fetch(`/api/reports${qs}`)
      .then((r) => r.json())
      .then((data) => {
        setMonths(data);
        setLoading(false);
      });
  }, [selectedCn]);

  // Mapa cn → farba badgu (stabilná podľa poradia spoločností)
  const cnColorMap = new Map(
    companies.map((c, i) => [c.cn, COMPANY_COLORS[i % COMPANY_COLORS.length]])
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reporty</h1>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : months.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>Žiadne importované výpisy.</p>
          <Link href="/import" className="text-orange-500 hover:underline mt-2 block text-sm">
            Importovať prvý výpis →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {months.map((m) => {
            const monthKey = `${m.invoiceYear}-${m.invoiceMonth}`;
            const badgeColor = cnColorMap.get(m.cn) ?? COMPANY_COLORS[0];
            return (
              <Link
                key={`${m.cn}-${monthKey}`}
                href={`/report/${monthKey}?cn=${encodeURIComponent(m.cn)}`}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-200 hover:bg-orange-50 transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{monthKey}</span>
                    {/* Company badge — vždy zobrazený (aj pri filtri jednej firmy) */}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
                      {m.companyName}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {m.pocetCisel} čísel · Celkom {m.celkovaNaklady.toFixed(2)} €
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {m.pocetNadlimitov > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 font-medium px-2 py-1 rounded-full">
                      {m.pocetNadlimitov} nadlimitov · {m.sumaNadlimitov.toFixed(2)} €
                    </span>
                  )}
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-orange-500" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
