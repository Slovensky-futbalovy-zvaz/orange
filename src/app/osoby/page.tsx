"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Upload, Search, X, Check } from "lucide-react";
import { SelectField } from "@/components/SelectField";
import { useCompany } from "@/contexts/CompanyContext";
import * as XLSX from "xlsx";

interface Person {
  _id: string;
  cn: string;
  personName: string;
  serviceIdentification: string;
  department: string;
  profileType: string;
  monthlyServiceLimit: number;
  personActive: boolean;
}

const EMPTY_FORM = {
  personName: "",
  serviceIdentification: "",
  department: "",
  profileType: "P",
  monthlyServiceLimit: 20,
};

export default function OsobyPage() {
  const { selectedCn, companies } = useCompany();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cnFilter, setCnFilter] = useState(selectedCn);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  async function load() {
    const qs = cnFilter ? `?cn=${encodeURIComponent(cnFilter)}` : "";
    const res = await fetch(`/api/persons${qs}`);
    setPersons(await res.json());
    setLoading(false);
  }

  // Sync filter when global context changes (sidebar switcher)
  useEffect(() => { setCnFilter(selectedCn); }, [selectedCn]);

  useEffect(() => { load(); }, [cnFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (editId) {
      await fetch(`/api/persons/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    load();
  }

  async function deletePerson(id: string) {
    if (!confirm("Naozaj odstrániť túto osobu?")) return;
    await fetch(`/api/persons/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(p: Person) {
    setForm({
      personName: p.personName,
      serviceIdentification: p.serviceIdentification,
      department: p.department,
      profileType: p.profileType,
      monthlyServiceLimit: p.monthlyServiceLimit,
    });
    setEditId(p._id);
    setShowForm(true);
  }

  async function importExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws) as Array<Record<string, unknown>>;

    const imported = rows.map((r) => {
      let serviceIdentification = String(
        r["Číslo"] || r["serviceIdentification"] || r["cislo"] || r["Cislo"] || ""
      ).trim();
      if (serviceIdentification.startsWith("+421")) serviceIdentification = "0" + serviceIdentification.slice(4);
      else if (serviceIdentification.startsWith("421") && serviceIdentification.length === 12) serviceIdentification = "0" + serviceIdentification.slice(3);
      if (/^\d{9}$/.test(serviceIdentification)) serviceIdentification = "0" + serviceIdentification;
      return {
        department: String(r["Stredisko"] || r["department"] || r["stredisko"] || ""),
        serviceIdentification,
        profileType: String(r["Typ profilu"] || r["profileType"] || r["typProfilu"] || "P"),
        personName: String(r["Osoba"] || r["personName"] || r["meno"] || r["Meno"] || "").trim(),
        monthlyServiceLimit: Number(r["Limit na volania"] || r["monthlyServiceLimit"] || r["limitNaVolania"] || 20),
      };
    }).filter((p) => p.serviceIdentification && p.personName);

    const res = await fetch("/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(imported),
    });
    const result = await res.json();
    setImportMsg(`Importovaných ${result.count} osôb`);
    load();
    setTimeout(() => setImportMsg(""), 4000);
    e.target.value = "";
  }

  const filtered = persons.filter((p) =>
    !search ||
    p.personName.toLowerCase().includes(search.toLowerCase()) ||
    p.serviceIdentification.includes(search) ||
    p.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Databáza osôb</h1>
          <p className="text-gray-500 text-sm mt-1">{persons.length} osôb</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 bg-white border border-gray-200 hover:border-orange-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
            <Upload size={15} /> Import Excel
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={importExcel} />
          </label>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Plus size={15} /> Pridať osobu
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <Check size={15} /> {importMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        {companies.length > 0 && (
          <SelectField value={cnFilter} onChange={(e) => setCnFilter(e.target.value)}>
            <option value="">Všetky spoločnosti</option>
            {companies.map((c) => (
              <option key={c.cn} value={c.cn}>{c.companyName}</option>
            ))}
          </SelectField>
        )}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hľadaj podľa mena, čísla alebo strediska…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-4 p-5 bg-white rounded-xl border border-orange-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">{editId ? "Upraviť osobu" : "Nová osoba"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Meno" value={form.personName} onChange={(v) => setForm({ ...form, personName: v })} />
            <Field label="Číslo (serviceIdentification)" value={form.serviceIdentification} onChange={(v) => setForm({ ...form, serviceIdentification: v })} placeholder="0902198279" />
            <Field label="Stredisko" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
            <Field label="Typ profilu" value={form.profileType} onChange={(v) => setForm({ ...form, profileType: v })} />
            <Field label="Mesačný limit (€)" value={String(form.monthlyServiceLimit)} onChange={(v) => setForm({ ...form, monthlyServiceLimit: Number(v) })} type="number" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
              {editId ? "Uložiť" : "Pridať"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="bg-white border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">
              Zrušiť
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Načítavam…</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Meno</th>
                <th className="px-4 py-3">Číslo</th>
                <th className="px-4 py-3">Stredisko</th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3 text-right">Limit (€)</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.personName}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.serviceIdentification}</td>
                  <td className="px-4 py-3 text-gray-600">{p.department}</td>
                  <td className="px-4 py-3 text-gray-400">{p.profileType}</td>
                  <td className="px-4 py-3 text-right font-medium">{p.monthlyServiceLimit} €</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => startEdit(p)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deletePerson(p._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">Žiadne výsledky</div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
      />
    </div>
  );
}
