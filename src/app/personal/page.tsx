"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Download, ChevronDown, ChevronUp, AlertTriangle,
  ChevronsUpDown, Search, X, UserPlus, FileText, Pencil,
} from "lucide-react";
import { SelectField } from "@/components/SelectField";
import { useCompany } from "@/contexts/CompanyContext";
import { useCodebook } from "@/hooks/useCodebook";

// ─── Interfaces ────────────────────────────────────────────────────────────

interface InvoiceDetail {
  entryName: string;
  priceWithoutVat: number;
}

interface Invoice {
  _id: string;
  serviceIdentification: string;
  userName: string;
  personId: string | null;
  personName: string | null;
  profileType: string | null;
  department: string | null;
  monthlyServiceLimit: number | null;
  celkovaCena: number;
  overTheLimit: number;
  details: InvoiceDetail[];
}

interface Summary {
  pocetCisel: number;
  celkovaNaklady: number;
  pocetNadlimitov: number;
  sumaNadlimitov: number;
}

interface PairForm {
  personName: string;
  department: string;
  profileType: string;
  monthlyServiceLimit: string;
}

type SortCol = "personName" | "profileType" | "department" | "monthlyServiceLimit" | "celkovaCena" | "overTheLimit";
type SortDir = "asc" | "desc";

const EMPTY_PAIR: PairForm = { personName: "", department: "", profileType: "", monthlyServiceLimit: "20" };

const MONTH_NAMES = [
  "", "Január", "Február", "Marec", "Apríl", "Máj", "Jún",
  "Júl", "August", "September", "Október", "November", "December",
];

const COMPANY_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function OverTheLimitPage() {
  const { selectedCn, companies } = useCompany();
  const { values: cbDepartments } = useCodebook("department");
  const { values: cbProfileTypes } = useCodebook("profileType");

  // Period filters
  const [localCn, setLocalCn]     = useState(selectedCn);
  const [years, setYears]         = useState<string[]>([]);
  const [year, setYear]           = useState("");
  const [month, setMonth]         = useState("");   // "01".."12"

  // Table filters
  const [filter, setFilter]               = useState<"nadlimit" | "all">("nadlimit");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [search, setSearch]               = useState("");
  const [sortCol, setSortCol]             = useState<SortCol | null>(null);
  const [sortDir, setSortDir]             = useState<SortDir>("asc");

  // Data
  const [invoices, setInvoices]     = useState<Invoice[]>([]);
  const [summary, setSummary]       = useState<Summary | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());

  // Pairing modal
  const [pairingInvoice, setPairingInvoice] = useState<Invoice | null>(null);
  const [pairForm, setPairForm]             = useState<PairForm>(EMPTY_PAIR);
  const [pairSaving, setPairSaving]         = useState(false);

  // Edit modal
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editForm, setEditForm]             = useState<PairForm>(EMPTY_PAIR);
  const [editSaving, setEditSaving]         = useState(false);

  // Sync company when sidebar changes
  useEffect(() => { setLocalCn(selectedCn); }, [selectedCn]);

  // Fetch available years when company changes
  useEffect(() => {
    const qs = localCn ? `?cn=${encodeURIComponent(localCn)}` : "";
    fetch(`/api/periods${qs}`)
      .then((r) => r.json())
      .then((d: { years: string[]; latestYear: string; latestMonth: string }) => {
        setYears(d.years);
        setYear(d.latestYear);
        setMonth(d.latestMonth);
      });
  }, [localCn]);

  // Fetch invoice data
  const loadData = useCallback(() => {
    if (!year || !month) return;
    setLoading(true);
    setSearch("");
    setSortCol(null);
    const monthKey = `${year}-${month}`;
    const qs = new URLSearchParams({ filter });
    if (departmentFilter) qs.set("department", departmentFilter);
    if (localCn) qs.set("cn", localCn);
    fetch(`/api/reports/${monthKey}?${qs}`)
      .then((r) => r.json())
      .then((data) => {
        setInvoices(data.invoices || []);
        setSummary(data.summary || null);
        setDepartments(data.departments || []);
        setLoading(false);
      });
  }, [year, month, filter, departmentFilter, localCn]);

  useEffect(() => { loadData(); }, [loadData]);

  function exportExcel() {
    const monthKey = `${year}-${month}`;
    const qs = new URLSearchParams({ filter });
    if (localCn)          qs.set("cn",         localCn);
    if (departmentFilter) qs.set("department",  departmentFilter);
    if (search.trim())    qs.set("search",      search.trim());
    window.location.href = `/api/reports/${monthKey}/export?${qs}`;
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function openPair(inv: Invoice, e: React.MouseEvent) {
    e.stopPropagation();
    setPairingInvoice(inv);
    setPairForm({
      personName: inv.personName || "",
      department: inv.department || "",
      profileType: inv.profileType || "",
      monthlyServiceLimit: String(inv.monthlyServiceLimit ?? 20),
    });
  }

  function openEdit(inv: Invoice, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingInvoice(inv);
    setEditForm({
      personName: inv.personName || "",
      department: inv.department || "",
      profileType: inv.profileType || "",
      monthlyServiceLimit: String(inv.monthlyServiceLimit ?? 20),
    });
  }

  async function saveEdit() {
    if (!editingInvoice) return;
    setEditSaving(true);
    try {
      if (editingInvoice.personId) {
        await fetch(`/api/persons/${editingInvoice.personId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personName: editForm.personName,
            department: editForm.department,
            profileType: editForm.profileType,
            monthlyServiceLimit: Number(editForm.monthlyServiceLimit),
          }),
        });
      } else {
        await fetch(`/api/invoices/${editingInvoice._id}/pair`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personName: editForm.personName,
            department: editForm.department,
            profileType: editForm.profileType,
            monthlyServiceLimit: Number(editForm.monthlyServiceLimit),
          }),
        });
      }
      setEditingInvoice(null);
      loadData();
    } finally {
      setEditSaving(false);
    }
  }

  async function savePair() {
    if (!pairingInvoice) return;
    setPairSaving(true);
    try {
      await fetch(`/api/invoices/${pairingInvoice._id}/pair`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName: pairForm.personName,
          department: pairForm.department,
          profileType: pairForm.profileType,
          monthlyServiceLimit: Number(pairForm.monthlyServiceLimit),
        }),
      });
      setPairingInvoice(null);
      loadData();
    } finally {
      setPairSaving(false);
    }
  }

  const filtered = useMemo(() => {
    let list = invoices;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (inv) =>
          (inv.personName || "").toLowerCase().includes(q) ||
          inv.serviceIdentification.toLowerCase().includes(q) ||
          (inv.userName || "").toLowerCase().includes(q) ||
          (inv.department || "").toLowerCase().includes(q) ||
          (inv.profileType || "").toLowerCase().includes(q)
      );
    }
    if (sortCol) {
      list = [...list].sort((a, b) => {
        const av = a[sortCol] ?? (typeof a[sortCol] === "number" ? -Infinity : "");
        const bv = b[sortCol] ?? (typeof b[sortCol] === "number" ? -Infinity : "");
        const aStr = typeof av === "string" ? av.toLowerCase() : av;
        const bStr = typeof bv === "string" ? bv.toLowerCase() : bv;
        if (aStr < bStr) return sortDir === "asc" ? -1 : 1;
        if (aStr > bStr) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [invoices, search, sortCol, sortDir]);

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col)
      return <ChevronsUpDown size={11} className="ml-1 text-gray-300 inline-block" />;
    return sortDir === "asc"
      ? <ChevronUp size={11} className="ml-1 text-orange-500 inline-block" />
      : <ChevronDown size={11} className="ml-1 text-orange-500 inline-block" />;
  }

  const cnColorMap = new Map(
    companies.map((c, i) => [c.cn, COMPANY_COLORS[i % COMPANY_COLORS.length]])
  );
  const badgeColor = cnColorMap.get(localCn) ?? COMPANY_COLORS[0];
  const companyName = companies.find((c) => c.cn === localCn)?.companyName;
  const monthLabel = month ? MONTH_NAMES[parseInt(month)] : "";

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto">

      {/* Pairing modal */}
      {pairingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus size={18} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900 text-lg">Spárovať číslo</h2>
            </div>
            <div className="text-sm text-gray-500 mb-4 font-mono bg-gray-50 rounded-lg px-3 py-2">
              {pairingInvoice.serviceIdentification} · {pairingInvoice.userName}
            </div>
            <div className="space-y-3">
              <PairField label="Meno osoby *" value={pairForm.personName} onChange={(v) => setPairForm({ ...pairForm, personName: v })} autoFocus />
              <PairSelect
                label="Stredisko"
                value={pairForm.department}
                onChange={(v) => setPairForm({ ...pairForm, department: v })}
                options={cbDepartments}
                placeholder="— vyber stredisko —"
              />
              <PairSelect
                label="Typ profilu"
                value={pairForm.profileType}
                onChange={(v) => setPairForm({ ...pairForm, profileType: v })}
                options={cbProfileTypes}
                placeholder="— vyber typ —"
              />
              <PairField label="Mesačný limit (€)" value={pairForm.monthlyServiceLimit} onChange={(v) => setPairForm({ ...pairForm, monthlyServiceLimit: v })} type="number" />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Ak osoba ešte neexistuje, vytvorí sa automaticky. Zmena sa prejaví vo všetkých mesiacoch.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={savePair}
                disabled={!pairForm.personName.trim() || pairSaving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
              >
                {pairSaving ? "Ukladám…" : "Uložiť"}
              </button>
              <button
                onClick={() => setPairingInvoice(null)}
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                Zrušiť
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Pencil size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-900 text-lg">Upraviť osobu</h2>
            </div>
            <div className="text-sm text-gray-500 mb-4 font-mono bg-gray-50 rounded-lg px-3 py-2">
              {editingInvoice.serviceIdentification} · {editingInvoice.userName}
            </div>
            <div className="space-y-3">
              <PairField label="Meno osoby *" value={editForm.personName} onChange={(v) => setEditForm({ ...editForm, personName: v })} autoFocus />
              <PairSelect label="Stredisko" value={editForm.department} onChange={(v) => setEditForm({ ...editForm, department: v })} options={cbDepartments} placeholder="— vyber stredisko —" />
              <PairSelect label="Typ profilu" value={editForm.profileType} onChange={(v) => setEditForm({ ...editForm, profileType: v })} options={cbProfileTypes} placeholder="— vyber typ —" />
              <PairField label="Mesačný limit (€)" value={editForm.monthlyServiceLimit} onChange={(v) => setEditForm({ ...editForm, monthlyServiceLimit: v })} type="number" />
            </div>
            <p className="text-xs text-gray-400 mt-3">Zmena sa prejaví vo všetkých mesiacoch a v databáze osôb.</p>
            <div className="flex gap-2 mt-5">
              <button onClick={saveEdit} disabled={!editForm.personName.trim() || editSaving} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg">
                {editSaving ? "Ukladám…" : "Uložiť"}
              </button>
              <button onClick={() => setEditingInvoice(null)} className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                Zrušiť
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
          <FileText size={18} className="text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prehľad osobných profilov</h1>
          <p className="text-xs text-gray-400 mt-0.5">Prehľad mesačných výpisov služieb</p>
        </div>
      </div>

      {/* ── Period + company filters (row 1) ── */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {/* Company */}
        <SelectField value={localCn} onChange={(e) => setLocalCn(e.target.value)}>
          <option value="">Všetky spoločnosti</option>
          {companies.map((c) => (
            <option key={c.cn} value={c.cn}>{c.companyName}</option>
          ))}
        </SelectField>

        {/* Year */}
        {years.length > 0 && (
          <SelectField value={year} onChange={(e) => setYear(e.target.value)}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </SelectField>
        )}

        {/* Month */}
        {year && (
          <SelectField value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTH_NAMES.slice(1).map((name, i) => {
              const val = (i + 1).toString().padStart(2, "0");
              return <option key={val} value={val}>{name}</option>;
            })}
          </SelectField>
        )}

        {/* Summary badge + company badge */}
        <div className="ml-auto flex items-center gap-2">
          {summary && !loading && (
            <span className="text-xs text-gray-400">
              {summary.pocetCisel} čísel · {summary.celkovaNaklady?.toFixed(2)} €
              {summary.pocetNadlimitov > 0 && (
                <span className="text-red-600 font-medium ml-1">
                  · {summary.pocetNadlimitov} nadlimitov ({summary.sumaNadlimitov?.toFixed(2)} €)
                </span>
              )}
            </span>
          )}
          {monthLabel && year && (
            <span className="text-xs text-gray-400">{monthLabel} {year}</span>
          )}
          {localCn && companyName && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
              {companyName}
            </span>
          )}
        </div>
      </div>

      {/* ── Table filters (row 2) ── */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        {/* nadlimit / all toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
          {(["nadlimit", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === f ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "nadlimit" ? "Len nadlimity" : "Všetky čísla"}
            </button>
          ))}
        </div>

        {/* Department filter */}
        {departments.length > 0 && (
          <SelectField value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="">Všetky strediská</option>
            {departments.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectField>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hľadať meno, číslo, stredisko…"
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        {search.trim() && (
          <span className="text-xs text-gray-400">{filtered.length} výsledkov</span>
        )}

        {/* Export */}
        <button
          onClick={exportExcel}
          disabled={!year || !month}
          className="ml-auto flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Download size={15} /> Export Excel
        </button>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {search.trim()
            ? "Žiadne výsledky pre hľadaný výraz"
            : filter === "nadlimit"
            ? "Žiadne nadlimity v tomto mesiaci"
            : "Žiadne záznamy"}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("personName")}>
                  Meno / Číslo <SortIcon col="personName" />
                </th>
                <th className="px-4 py-3 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("profileType")}>
                  Typ <SortIcon col="profileType" />
                </th>
                <th className="px-4 py-3 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("department")}>
                  Stredisko <SortIcon col="department" />
                </th>
                <th className="px-4 py-3 text-right cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("monthlyServiceLimit")}>
                  Limit <SortIcon col="monthlyServiceLimit" />
                </th>
                <th className="px-4 py-3 text-right cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("celkovaCena")}>
                  Skutočná cena <SortIcon col="celkovaCena" />
                </th>
                <th className="px-4 py-3 text-right cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("overTheLimit")}>
                  Nadlimit <SortIcon col="overTheLimit" />
                </th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => (
                <>
                  <tr
                    key={inv._id}
                    className={`hover:bg-gray-50 cursor-pointer ${inv.overTheLimit > 0 ? "bg-red-50/30" : ""}`}
                    onClick={() => toggleExpand(inv._id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {inv.personName || (
                          <span className="text-gray-400 italic">Nespárované</span>
                        )}
                        {!inv.personName ? (
                          <button
                            onClick={(e) => openPair(inv, e)}
                            className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200 transition-colors"
                          >
                            <UserPlus size={11} /> Spárovať
                          </button>
                        ) : (
                          <button
                            onClick={(e) => openEdit(inv, e)}
                            className="inline-flex items-center p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                            title="Upraviť osobu"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {inv.serviceIdentification} · {inv.userName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{inv.profileType || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.department || "—"}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {inv.monthlyServiceLimit != null ? `${inv.monthlyServiceLimit} €` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {inv.celkovaCena.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.overTheLimit > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                          <AlertTriangle size={12} />
                          {inv.overTheLimit.toFixed(2)} €
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {expanded.has(inv._id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </td>
                  </tr>
                  {expanded.has(inv._id) && (
                    <tr key={`${inv._id}-detail`} className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-3">
                        <div className="text-xs text-gray-500 space-y-1">
                          {inv.details.map((d, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{d.entryName}</span>
                              <span className={`font-mono ${d.priceWithoutVat < 0 ? "text-green-600" : "text-gray-700"}`}>
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
      )}
    </div>
  );
}

// ─── Helper components ──────────────────────────────────────────────────────

function PairField({ label, value, onChange, type = "text", autoFocus }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
      />
    </div>
  );
}

function PairSelect({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string;
}) {
  const allOptions = options.includes(value) || !value ? options : [value, ...options];
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none"
      >
        <option value="">{placeholder || "— vyber —"}</option>
        {allOptions.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
