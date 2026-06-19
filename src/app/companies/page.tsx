"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Landmark } from "lucide-react";

interface Company {
  _id: string;
  cn: string;
  companyName: string;
}

const EMPTY = { cn: "", companyName: "" };

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/companies");
    setCompanies(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditId(null);
    setForm(EMPTY);
    setShowForm(true);
  }

  function openEdit(c: Company) {
    setEditId(c._id);
    setForm({ cn: c.cn, companyName: c.companyName });
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
  }

  async function save() {
    if (!form.cn.trim() || !form.companyName.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await fetch(`/api/companies/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      cancel();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Naozaj vymazať spoločnosť "${name}"?`)) return;
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark size={22} className="text-orange-500" /> Spoločnosti
          </h1>
          <p className="text-gray-500 text-sm mt-1">Číselník spoločností (číslo zákazníka → názov)</p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Plus size={15} /> Pridať spoločnosť
          </button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {editId ? "Upraviť spoločnosť" : "Nová spoločnosť"}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Číslo zákazníka (CN) *
              </label>
              <input
                type="text"
                value={form.cn}
                onChange={(e) => setForm({ ...form, cn: e.target.value })}
                placeholder="napr. 0252219878"
                disabled={!!editId}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Názov spoločnosti *
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="napr. Slovenský futbalový zväz"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={save}
              disabled={!form.cn.trim() || !form.companyName.trim() || saving}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              <Check size={14} /> {saving ? "Ukladám…" : "Uložiť"}
            </button>
            <button
              onClick={cancel}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              <X size={14} /> Zrušiť
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Načítavam...</div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Žiadne spoločnosti. Pridajte prvú spoločnosť pomocou tlačidla vyššie.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Číslo zákazníka (CN)</th>
                <th className="px-4 py-3">Názov spoločnosti</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">{c.cn}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.companyName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Upraviť"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(c._id, c.companyName)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Vymazať"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
