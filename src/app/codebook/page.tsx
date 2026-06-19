"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, BookOpen, Pencil, Check, X } from "lucide-react";
import { useCodebook } from "@/hooks/useCodebook";

type TabType = "profileType" | "department";

const TABS: { id: TabType; label: string; hint: string }[] = [
  { id: "profileType", label: "Typ osobného profilu", hint: "Napr. P, D, V, T, M …" },
  { id: "department",  label: "Stredisko",            hint: "Napr. IT, HR, Marketing …" },
];

export default function CiselnikyPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profileType");

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
          <BookOpen size={18} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Číselníky</h1>
          <p className="text-xs text-gray-400 mt-0.5">Spravuj hodnoty pre Typ osobného profilu a Stredisko</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-6 py-2.5 text-sm font-medium transition-colors ${
              activeTab === t.id
                ? "bg-indigo-500 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {TABS.map((t) =>
        activeTab === t.id ? (
          <CodebookTab key={t.id} type={t.id} hint={t.hint} />
        ) : null
      )}
    </div>
  );
}

function CodebookTab({ type, hint }: { type: TabType; hint: string }) {
  const { items, reload } = useCodebook(type);
  const [newValue, setNewValue] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [editId,   setEditId]   = useState<string | null>(null);
  const [editVal,  setEditVal]  = useState("");
  const [saveMsg,  setSaveMsg]  = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editId) editRef.current?.focus();
  }, [editId]);

  async function add() {
    if (!newValue.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/codebook", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ type, value: newValue.trim() }),
    });
    if (res.ok) {
      setNewValue("");
      reload();
    } else {
      const data = await res.json();
      setError(data.error || "Chyba");
    }
    setSaving(false);
  }

  async function saveEdit(id: string) {
    if (!editVal.trim()) return;
    const res = await fetch(`/api/codebook/${id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ value: editVal.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setEditId(null);
      setSaveMsg(`✓ Uložené — osôb: ${data.personsUpdated ?? "?"}, výpisov: ${data.invoicesUpdated ?? "?"}`);
      setTimeout(() => setSaveMsg(""), 4000);
      reload();
    } else {
      setError(data.error || "Chyba");
    }
  }

  async function remove(id: string) {
    await fetch(`/api/codebook/${id}`, { method: "DELETE" });
    reload();
  }

  function startEdit(id: string, currentValue: string) {
    setEditId(id);
    setEditVal(currentValue);
    setError("");
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Add row */}
      <div className="p-4 border-b border-gray-100 flex gap-2">
        <input
          type="text"
          value={newValue}
          onChange={(e) => { setNewValue(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={hint}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={add}
          disabled={saving || !newValue.trim()}
          className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus size={14} /> Pridať
        </button>
      </div>

      {error && (
        <p className="px-4 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100">{error}</p>
      )}
      {saveMsg && (
        <p className="px-4 py-2 text-xs text-green-700 bg-green-50 border-b border-green-100">{saveMsg}</p>
      )}

      {/* List */}
      {items.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          Číselník je prázdny — pridaj prvú hodnotu vyššie.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item._id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50">
              {editId === item._id ? (
                <>
                  <input
                    ref={editRef}
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(item._id);
                      if (e.key === "Escape") setEditId(null);
                    }}
                    className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <button
                    onClick={() => saveEdit(item._id)}
                    className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
                    title="Uložiť"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Zrušiť"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-800 font-medium">{item.value}</span>
                  <button
                    onClick={() => startEdit(item._id, item.value)}
                    className="p-1.5 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-colors"
                    title="Upraviť"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => remove(item._id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Odstrániť"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
        {items.length} {items.length === 1 ? "hodnota" : items.length < 5 ? "hodnoty" : "hodnôt"}
      </div>
    </div>
  );
}
