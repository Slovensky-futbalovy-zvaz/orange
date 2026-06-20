"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Download, ChevronDown, ChevronUp, AlertTriangle,
  ChevronsUpDown, Search, X, UserPlus, FileText, Pencil,
} from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { SelectField } from "@/components/SelectField";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
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

// ─── Component ─────────────────────────────────────────────────────────────

export default function OverTheLimitPage() {
  const { selectedCn, companies } = useCompany();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
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
      return <ChevronsUpDown size={11} className="ml-1 inline-block" style={{ color: "var(--line)" }} />;
    return sortDir === "asc"
      ? <ChevronUp size={11} className="ml-1 inline-block" style={{ color: "var(--accent)" }} />
      : <ChevronDown size={11} className="ml-1 inline-block" style={{ color: "var(--accent)" }} />;
  }

  const companyName = companies.find((c) => c.cn === localCn)?.companyName;
  const monthLabel  = month ? MONTH_NAMES[parseInt(month)] : "";

  const modalStyle: React.CSSProperties = {
    background: "var(--surface)",
    borderRadius: "1rem",
    boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
    width: "100%",
    maxWidth: 448,
    margin: "0 1rem",
    padding: "1.5rem",
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Pairing modal ── */}
      {pairingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div style={modalStyle}>
            <div className="flex items-center gap-2 mb-4">
              <UserPlus size={18} style={{ color: "var(--accent)" }} />
              <h2 className="font-semibold text-lg" style={{ color: "var(--ink)" }}>
                Spárovať číslo
              </h2>
            </div>
            <div
              className="text-sm font-mono mb-4 px-3 py-2 rounded-lg"
              style={{ background: "var(--paper)", color: "var(--muted)" }}
            >
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
            <p className="text-xs mt-3" style={{ color: "var(--faint)" }}>
              Ak osoba ešte neexistuje, vytvorí sa automaticky. Zmena sa prejaví vo všetkých mesiacoch.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={savePair}
                disabled={!pairForm.personName.trim() || pairSaving}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-lg disabled:opacity-50 transition-opacity"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {pairSaving ? "Ukladám…" : "Uložiť"}
              </button>
              <button
                onClick={() => setPairingInvoice(null)}
                className="px-4 py-2.5 text-sm rounded-lg transition-colors"
                style={{ border: "1px solid var(--line)", color: "var(--muted)", background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Zrušiť
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal (admin only) ── */}
      {isAdmin && editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div style={modalStyle}>
            <div className="flex items-center gap-2 mb-4">
              <Pencil size={18} style={{ color: "var(--muted)" }} />
              <h2 className="font-semibold text-lg" style={{ color: "var(--ink)" }}>
                Upraviť osobu
              </h2>
            </div>
            <div
              className="text-sm font-mono mb-4 px-3 py-2 rounded-lg"
              style={{ background: "var(--paper)", color: "var(--muted)" }}
            >
              {editingInvoice.serviceIdentification} · {editingInvoice.userName}
            </div>
            <div className="space-y-3">
              <PairField label="Meno osoby *" value={editForm.personName} onChange={(v) => setEditForm({ ...editForm, personName: v })} autoFocus />
              <PairSelect label="Stredisko" value={editForm.department} onChange={(v) => setEditForm({ ...editForm, department: v })} options={cbDepartments} placeholder="— vyber stredisko —" />
              <PairSelect label="Typ profilu" value={editForm.profileType} onChange={(v) => setEditForm({ ...editForm, profileType: v })} options={cbProfileTypes} placeholder="— vyber typ —" />
              <PairField label="Mesačný limit (€)" value={editForm.monthlyServiceLimit} onChange={(v) => setEditForm({ ...editForm, monthlyServiceLimit: v })} type="number" />
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--faint)" }}>
              Zmena sa prejaví vo všetkých mesiacoch a v databáze osôb.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={saveEdit}
                disabled={!editForm.personName.trim() || editSaving}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-lg disabled:opacity-50 transition-opacity"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {editSaving ? "Ukladám…" : "Uložiť"}
              </button>
              <button
                onClick={() => setEditingInvoice(null)}
                className="px-4 py-2.5 text-sm rounded-lg transition-colors"
                style={{ border: "1px solid var(--line)", color: "var(--muted)", background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Zrušiť
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 flex items-center justify-center flex-shrink-0"
          style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)", borderRadius: "calc(var(--radius) * 0.75)" }}
        >
          <FileText size={18} style={{ color: "var(--danger)" }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--ink)" }}>
            Prehľad osobných profilov
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>
            Prehľad mesačných výpisov služieb
          </p>
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

        {/* Summary + badges */}
        <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-2">
          {summary && !loading && (
            <span className="text-xs" style={{ color: "var(--faint)" }}>
              {summary.pocetCisel} čísel · {summary.celkovaNaklady?.toFixed(2)} €
              {summary.pocetNadlimitov > 0 && (
                <span className="font-medium ml-1" style={{ color: "var(--danger)" }}>
                  · {summary.pocetNadlimitov} nadlimitov ({summary.sumaNadlimitov?.toFixed(2)} €)
                </span>
              )}
            </span>
          )}
          {monthLabel && year && (
            <span className="text-xs" style={{ color: "var(--faint)" }}>{monthLabel} {year}</span>
          )}
          {localCn && companyName && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}
            >
              {companyName}
            </span>
          )}
        </div>
      </div>

      {/* ── Table filters (row 2) ── */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        {/* nadlimit / all toggle */}
        <div
          className="flex rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
        >
          {(["nadlimit", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={
                filter === f
                  ? { background: "var(--accent)", color: "#fff" }
                  : { color: "var(--muted)", background: "transparent" }
              }
              onMouseEnter={(e) => { if (filter !== f) e.currentTarget.style.background = "var(--paper)"; }}
              onMouseLeave={(e) => { if (filter !== f) e.currentTarget.style.background = "transparent"; }}
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
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--faint)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hľadať meno, číslo, stredisko…"
            className="w-full pl-8 pr-8 py-2 text-sm rounded-lg focus:outline-none"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--faint)" }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {search.trim() && (
          <span className="text-xs" style={{ color: "var(--faint)" }}>{filtered.length} výsledkov</span>
        )}

        {/* Export */}
        <button
          onClick={exportExcel}
          disabled={!year || !month}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-40 transition-opacity sm:ml-auto"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Download size={15} /> Export Excel
        </button>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl animate-pulse"
              style={{ background: "var(--paper)" }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--faint)" }}>
          {search.trim()
            ? "Žiadne výsledky pre hľadaný výraz"
            : filter === "nadlimit"
            ? "Žiadne nadlimity v tomto mesiaci"
            : "Žiadne záznamy"}
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden overflow-x-auto"
          style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
        >
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wide"
                style={{
                  background: "var(--paper)",
                  borderBottom: "1px solid var(--line)",
                  color: "var(--muted)",
                }}
              >
                <th
                  className="px-4 py-3 cursor-pointer select-none"
                  style={{ transition: "color 0.15s" }}
                  onClick={() => handleSort("personName")}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                >
                  Meno / Číslo <SortIcon col="personName" />
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none"
                  style={{ transition: "color 0.15s" }}
                  onClick={() => handleSort("profileType")}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                >
                  Typ <SortIcon col="profileType" />
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none"
                  style={{ transition: "color 0.15s" }}
                  onClick={() => handleSort("department")}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                >
                  Stredisko <SortIcon col="department" />
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer select-none"
                  style={{ transition: "color 0.15s" }}
                  onClick={() => handleSort("monthlyServiceLimit")}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                >
                  Limit <SortIcon col="monthlyServiceLimit" />
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer select-none"
                  style={{ transition: "color 0.15s" }}
                  onClick={() => handleSort("celkovaCena")}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                >
                  Skutočná cena <SortIcon col="celkovaCena" />
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer select-none"
                  style={{ transition: "color 0.15s" }}
                  onClick={() => handleSort("overTheLimit")}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                >
                  Nadlimit <SortIcon col="overTheLimit" />
                </th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, rowIdx) => (
                <>
                  <tr
                    key={inv._id}
                    className="cursor-pointer transition-colors"
                    style={{
                      background: inv.overTheLimit > 0
                        ? "color-mix(in srgb, var(--danger) 6%, transparent)"
                        : rowIdx % 2 === 0 ? "transparent" : "var(--paper)",
                      borderBottom: "1px solid var(--line)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper)")}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = inv.overTheLimit > 0
                        ? "color-mix(in srgb, var(--danger) 6%, transparent)"
                        : rowIdx % 2 === 0 ? "transparent" : "var(--paper)";
                    }}
                    onClick={() => toggleExpand(inv._id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium flex items-center gap-2" style={{ color: "var(--ink)" }}>
                        {inv.personName || (
                          <span className="italic" style={{ color: "var(--faint)" }}>Nespárované</span>
                        )}
                        {isAdmin && (!inv.personName ? (
                          <button
                            onClick={(e) => openPair(inv, e)}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors"
                            style={{
                              color: "var(--accent-ink)",
                              background: "var(--accent-soft)",
                              border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                            }}
                          >
                            <UserPlus size={11} /> Spárovať
                          </button>
                        ) : (
                          <button
                            onClick={(e) => openEdit(inv, e)}
                            className="inline-flex items-center p-1 rounded transition-colors"
                            title="Upraviť osobu"
                            style={{ color: "var(--faint)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--accent)";
                              e.currentTarget.style.background = "var(--accent-soft)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--faint)";
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                        ))}
                      </div>
                      <div className="text-xs" style={{ color: "var(--faint)" }}>
                        {inv.serviceIdentification} · {inv.userName}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{inv.profileType || "—"}</td>
                    <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{inv.department || "—"}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--muted)" }}>
                      {inv.monthlyServiceLimit != null ? `${inv.monthlyServiceLimit} €` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium" style={{ color: "var(--ink)" }}>
                      {inv.celkovaCena.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.overTheLimit > 0 ? (
                        <span
                          className="inline-flex items-center gap-1 font-semibold"
                          style={{ color: "var(--danger)" }}
                        >
                          <AlertTriangle size={12} />
                          {inv.overTheLimit.toFixed(2)} €
                        </span>
                      ) : (
                        <span style={{ color: "var(--line)" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--faint)" }}>
                      {expanded.has(inv._id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </td>
                  </tr>
                  {expanded.has(inv._id) && (
                    <tr key={`${inv._id}-detail`}>
                      <td
                        colSpan={7}
                        className="px-6 py-3"
                        style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)" }}
                      >
                        <div className="text-xs space-y-1" style={{ color: "var(--muted)" }}>
                          {inv.details.map((d, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{d.entryName}</span>
                              <span
                                className="font-mono"
                                style={{ color: d.priceWithoutVat < 0 ? "#16a34a" : "var(--muted)" }}
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
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
        style={{
          border: "1px solid var(--line)",
          background: "var(--surface)",
          color: "var(--ink)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
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
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>{label}</label>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={[
          { value: "", label: placeholder || "— vyber —" },
          ...allOptions.map((o) => ({ value: o, label: o })),
        ]}
      />
    </div>
  );
}
