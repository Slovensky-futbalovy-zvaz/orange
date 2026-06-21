"use client";
import { useState } from "react";
import { formatEur, formatInt } from "@/lib/format";
import { Upload, CheckCircle, AlertCircle, FileUp, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface ImportResult {
  ok: boolean;
  mesiac: string;
  pocetCisel: number;
  nespárovane: number;
  celkovaNaklady: number;
  pocetNadlimitov: number;
  sumaNadlimitov: number;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chyba pri importe");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Neznáma chyba");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".xml")) setFile(f);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Import mesačného výpisu</h1>
      <p className="text-gray-500 text-sm mb-6">
        Nahraj XML súbor <strong>Hromadný export</strong> z Orange portálu.
        Systém automaticky spáruje čísla s databázou osôb a vypočíta nadlimity.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          drag ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-white hover:border-orange-300"
        }`}
      >
        <FileUp size={36} className="mx-auto text-gray-300 mb-3" />
        {file ? (
          <div>
            <p className="font-medium text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
            <button
              onClick={() => setFile(null)}
              className="text-xs text-red-500 mt-2 hover:underline"
            >
              Odstrániť
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-1">Pretiahni XML súbor sem, alebo</p>
            <label className="cursor-pointer text-orange-600 hover:underline font-medium text-sm">
              vyber súbor
              <input
                type="file"
                accept=".xml"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        )}
      </div>

      {file && !result && (
        <button
          onClick={handleImport}
          disabled={loading}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          {loading ? (
            <><RefreshCw size={16} className="animate-spin" /> Spracovávam...</>
          ) : (
            <><Upload size={16} /> Importovať</>
          )}
        </button>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Chyba pri importe</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 p-5 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-green-600" />
            <h3 className="font-semibold text-green-800">Import úspešný — {result.mesiac}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Stat label="Počet čísel" value={formatInt(result.pocetCisel)} />
            <Stat label="Nespárované" value={formatInt(result.nespárovane)} warn={result.nespárovane > 0} />
            <Stat label="Celkové náklady" value={formatEur(result.celkovaNaklady)} />
            <Stat label="Suma nadlimitov" value={formatEur(result.sumaNadlimitov)} warn={result.sumaNadlimitov > 0} />
          </div>
          {result.pocetNadlimitov > 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              ⚠️ {formatInt(result.pocetNadlimitov)} osôb prekročilo limit na volania
            </p>
          )}
          <Link
            href={`/personal/${result.mesiac}`}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Otvoriť report →
          </Link>
        </div>
      )}

      {/* ── Helper — kde nájsť export ── */}
      <div className="mt-8 border border-gray-200 rounded-xl overflow-hidden bg-white">
        <button
          onClick={() => setHelpOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-orange-600 text-sm font-bold">?</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Kde nájdem súbor na import?</p>
              <p className="text-xs text-gray-400">Orange portál → Hromadný export → Export detailov faktúr</p>
            </div>
          </div>
          {helpOpen
            ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
            : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
        </button>

        {helpOpen && (
          <div className="border-t border-gray-100 px-5 py-5 space-y-5">

            {/* Step-by-step */}
            <div className="space-y-3">
              <Step n={1} text="Prihlás sa na Orange portál" />
              <Step n={2} text='V ľavom menu klikni na "Exporty" → "Hromadný export"' />
              <Step n={3} text="Vyber fakturačné obdobie a formát XML" />
              <Step
                n={4}
                text='Zaškrtni možnosť "Export detailov faktúr"'
                highlight
              />
              <Step n={5} text='Klikni "Exportovať" a stiahni XML súbor z menu "Exporty", keď dobehne tvorba exportu.' />
            </div>

            {/* Mockup screenshotu */}
            <div className="rounded-xl border border-gray-200 overflow-hidden text-xs">
              {/* Fake portal header */}
              <div className="bg-gray-900 px-4 py-2 flex items-center gap-2">
                <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">O</span>
                </div>
                <span className="text-gray-300 font-medium text-[11px]">Orange Portál — Hromadný export</span>
              </div>

              {/* Fake form body */}
              <div className="bg-gray-50 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-32 text-[11px]">Fakturačné obdobie:</span>
                  <div className="flex items-center gap-1 border border-gray-300 rounded bg-white px-2 py-1 text-gray-600 text-[11px]">
                    Vyberte <ChevronDown size={10} className="ml-1" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-32 text-[11px]">Formát exportu:</span>
                  <div className="flex items-center gap-1 border border-gray-300 rounded bg-white px-2 py-1 text-gray-600 text-[11px]">
                    xml <ChevronDown size={10} className="ml-1" />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="pt-1 grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {[
                    ["Export celkového výpisu", false],
                    ["Export klasifikácie hovorov", false],
                    ["Export štatistiky hovorov", false],
                    ["Export sumáru klasifikácie", false],
                    ["Export služieb", false],
                    ["Export výdavkov", false],
                    ["Export faktúr", false],
                    ["Export užívateľských skupín", false],
                    ["Export detailov faktúr", true],   // ← toto zaškrtnúť
                    ["Export súhrnnej faktúry", false],
                    ["Export výpisu hovorov", false],
                    ["Export prvofaktúr", false],
                  ].map(([label, checked]) => (
                    <div
                      key={label as string}
                      className={`flex items-center gap-1.5 ${checked ? "font-semibold text-orange-700" : "text-gray-600"}`}
                    >
                      <div className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 ${
                        checked ? "bg-orange-500 border-orange-500" : "bg-white border-gray-400"
                      }`}>
                        {checked && <span className="text-white text-[8px] font-bold">✓</span>}
                      </div>
                      <span className="text-[11px]">{label as string}</span>
                      {checked && (
                        <span className="ml-1 text-[10px] bg-orange-100 text-orange-600 px-1 rounded font-medium">← toto</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-1">
                  <span className="text-orange-600 font-medium text-[11px] cursor-pointer hover:underline">
                    Exportovať
                  </span>
                </div>
              </div>
            </div>

            {/* Link na portal */}
            <a
              href="https://www.orange.sk/business/selfcare/kfs/default.dwp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <ExternalLink size={15} />
              Otvoriť Orange portál
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${warn ? "bg-amber-50" : "bg-white"} border border-gray-100`}>
      <div className={`text-lg font-bold ${warn ? "text-amber-700" : "text-gray-900"}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function Step({ n, text, highlight }: { n: number; text: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${
        highlight ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"
      }`}>
        {n}
      </div>
      <p className={`text-sm ${highlight ? "font-semibold text-orange-700" : "text-gray-700"}`}>
        {text}
      </p>
    </div>
  );
}
