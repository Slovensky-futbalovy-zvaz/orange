"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  UserPlus, Trash2, Mail, Shield, User as UserIcon,
  Loader2, CheckCircle, AlertCircle, Building2, X, RefreshCw,
  ChevronDown, Check,
} from "lucide-react";

interface UserRow {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
  status: "pending" | "active";
  companies: string[];
  complexOverview: boolean;
  createdAt: string;
}

interface Company {
  _id: string;
  cn: string;
  companyName: string;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Aktívny",
  pending: "Čaká na aktiváciu",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Invite formulár
  const [showInvite, setShowInvite] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invFirstName, setInvFirstName] = useState("");
  const [invLastName, setInvLastName] = useState("");
  const [invRole, setInvRole] = useState<"admin" | "user">("user");
  const [invCompanies, setInvCompanies] = useState<string[]>([]);
  const [invComplexOverview, setInvComplexOverview] = useState(false);
  const [invSubmitting, setInvSubmitting] = useState(false);
  const [invError, setInvError] = useState("");
  const [invSuccess, setInvSuccess] = useState("");

  // Edit modal
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editCompanies, setEditCompanies] = useState<string[]>([]);
  const [editRole, setEditRole] = useState<"admin" | "user">("user");
  const [editComplexOverview, setEditComplexOverview] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editCompanyDropdownOpen, setEditCompanyDropdownOpen] = useState(false);
  const [editRoleDropdownOpen, setEditRoleDropdownOpen] = useState(false);
  const editDropdownRef = useRef<HTMLDivElement>(null);
  const editRoleRef = useRef<HTMLDivElement>(null);
  const [invDropdownOpen, setInvDropdownOpen] = useState(false);
  const [invRoleDropdownOpen, setInvRoleDropdownOpen] = useState(false);
  const invDropdownRef = useRef<HTMLDivElement>(null);
  const invRoleRef = useRef<HTMLDivElement>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, cRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/companies"),
      ]);
      setUsers(await uRes.json());
      setCompanies(await cRes.json());
    } catch {
      setError("Nepodarilo sa načítať dáta.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function toggleCompany(cn: string, list: string[], setter: (v: string[]) => void) {
    setter(list.includes(cn) ? list.filter((c) => c !== cn) : [...list, cn]);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInvError("");
    setInvSuccess("");
    setInvSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: invEmail,
          firstName: invFirstName,
          lastName: invLastName,
          role: invRole,
          companies: invRole === "admin" ? [] : invCompanies,
          complexOverview: invRole === "admin" ? true : invComplexOverview,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInvError(data.error || "Chyba servera.");
      } else {
        setInvSuccess(`Pozvánka odoslaná na ${invEmail}.`);
        setInvEmail("");
        setInvFirstName("");
        setInvLastName("");
        setInvRole("user");
        setInvCompanies([]);
        setInvComplexOverview(false);
        loadUsers();
      }
    } catch {
      setInvError("Nepodarilo sa odoslať pozvánku.");
    } finally {
      setInvSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Naozaj chcete zmazať používateľa ${name}?`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((u) => u.filter((x) => x._id !== id));
    } else {
      const data = await res.json();
      alert(data.error || "Chyba pri mazaní.");
    }
  }

  // Zatvoriť dropdown po kliku mimo neho
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (editDropdownRef.current && !editDropdownRef.current.contains(e.target as Node)) {
        setEditCompanyDropdownOpen(false);
      }
      if (editRoleRef.current && !editRoleRef.current.contains(e.target as Node)) {
        setEditRoleDropdownOpen(false);
      }
      if (invDropdownRef.current && !invDropdownRef.current.contains(e.target as Node)) {
        setInvDropdownOpen(false);
      }
      if (invRoleRef.current && !invRoleRef.current.contains(e.target as Node)) {
        setInvRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openEdit(u: UserRow) {
    setEditUser(u);
    setEditFirstName(u.firstName);
    setEditLastName(u.lastName);
    setEditCompanies(u.companies);
    setEditRole(u.role);
    setEditComplexOverview(u.complexOverview ?? false);
    setEditCompanyDropdownOpen(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setEditSubmitting(true);
    const res = await fetch(`/api/admin/users/${editUser._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        role: editRole,
        companies: editRole === "admin" ? [] : editCompanies,
        complexOverview: editRole === "admin" ? true : editComplexOverview,
      }),
    });
    if (res.ok) {
      await loadUsers();
      setEditUser(null);
    }
    setEditSubmitting(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Správa používateľov</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pozývanie, role a prístupy</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={loadUsers}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Obnoviť"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <UserPlus size={15} />
            Pozvať používateľa
          </button>
        </div>
      </div>

      {/* Invite formulár */}
      {showInvite && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <UserPlus size={15} className="text-orange-500" />
            Nová pozvánka
          </h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Meno</label>
                <input
                  type="text"
                  value={invFirstName}
                  onChange={(e) => setInvFirstName(e.target.value)}
                  required
                  placeholder="Ján"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priezvisko</label>
                <input
                  type="text"
                  value={invLastName}
                  onChange={(e) => setInvLastName(e.target.value)}
                  required
                  placeholder="Novák"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={invEmail}
                    onChange={(e) => setInvEmail(e.target.value)}
                    required
                    placeholder="email@sfz.sk"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rola</label>
                <div ref={invRoleRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setInvRoleDropdownOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors"
                  >
                    <span className="text-gray-700">
                      {invRole === "admin" ? "Správca" : "Používateľ (read-only)"}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${invRoleDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {invRoleDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      {(["user", "admin"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => { setInvRole(r); setInvRoleDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                            invRole === r ? "bg-orange-500 border-orange-500" : "border-gray-300"
                          }`}>
                            {invRole === r && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="text-gray-700">{r === "admin" ? "Správca" : "Používateľ (read-only)"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {invRole === "user" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Spoločnosti
                </label>
                <div ref={invDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setInvDropdownOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors"
                  >
                    <span className="text-gray-600 truncate">
                      {invCompanies.length === 0
                        ? "Vybrať spoločnosti…"
                        : companies.filter((c) => invCompanies.includes(c.cn)).map((c) => c.companyName).join(", ")}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${invDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {invDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      {companies.map((c) => (
                        <button
                          key={c.cn}
                          type="button"
                          onClick={() => toggleCompany(c.cn, invCompanies, setInvCompanies)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            invCompanies.includes(c.cn)
                              ? "bg-orange-500 border-orange-500"
                              : "border-gray-300"
                          }`}>
                            {invCompanies.includes(c.cn) && <Check size={10} className="text-white" />}
                          </div>
                          <span className="text-gray-700">{c.companyName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {invRole === "user" && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={invComplexOverview}
                  onChange={(e) => setInvComplexOverview(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-700">Komplexný prehľad</span>
                  <span className="block text-xs text-gray-500">
                    Sprístupní analytický prehľad za všetky spoločnosti.
                  </span>
                </span>
              </label>
            )}
            {invError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={13} /> {invError}
              </p>
            )}
            {invSuccess && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle size={13} /> {invSuccess}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Zrušiť
              </button>
              <button
                type="submit"
                disabled={invSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {invSubmitting ? (
                  <><Loader2 size={13} className="animate-spin" /> Odosielam...</>
                ) : (
                  <><Mail size={13} /> Odoslať pozvánku</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Zoznam používateľov */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-orange-500" size={24} />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-sm">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Žiadni používatelia</div>
        ) : (
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Meno</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Rola</th>
                <th className="text-left px-4 py-3">Stav</th>
                <th className="text-left px-4 py-3">Spoločnosti</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {u.role === "admin" ? (
                        <><Shield size={10} /> Správca</>
                      ) : (
                        <><UserIcon size={10} /> Používateľ</>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {STATUS_LABEL[u.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.role === "admin" ? (
                      <span className="text-gray-400">Všetky</span>
                    ) : u.companies.length > 0 ? (
                      companies
                        .filter((c) => u.companies.includes(c.cn))
                        .map((c) => c.companyName)
                        .join(", ") || u.companies.join(", ")
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Upraviť"
                      >
                        <Building2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(u._id, `${u.firstName} ${u.lastName}`)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Zmazať"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                Upraviť používateľa
              </h2>
              <button
                onClick={() => setEditUser(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meno</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Priezvisko</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rola</label>
                <div ref={editRoleRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setEditRoleDropdownOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors"
                  >
                    <span className="text-gray-700">
                      {editRole === "admin" ? "Správca" : "Používateľ (read-only)"}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${editRoleDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {editRoleDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      {(["user", "admin"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => { setEditRole(r); setEditRoleDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                            editRole === r ? "bg-orange-500 border-orange-500" : "border-gray-300"
                          }`}>
                            {editRole === r && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="text-gray-700">{r === "admin" ? "Správca" : "Používateľ (read-only)"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {editRole === "user" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Spoločnosti
                  </label>
                  <div ref={editDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setEditCompanyDropdownOpen((o) => !o)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors"
                    >
                      <span className="text-gray-600 truncate">
                        {editCompanies.length === 0
                          ? "Vybrať spoločnosti…"
                          : companies.filter((c) => editCompanies.includes(c.cn)).map((c) => c.companyName).join(", ")}
                      </span>
                      <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${editCompanyDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {editCompanyDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        {companies.map((c) => (
                          <button
                            key={c.cn}
                            type="button"
                            onClick={() => toggleCompany(c.cn, editCompanies, setEditCompanies)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                              editCompanies.includes(c.cn)
                                ? "bg-orange-500 border-orange-500"
                                : "border-gray-300"
                            }`}>
                              {editCompanies.includes(c.cn) && <Check size={10} className="text-white" />}
                            </div>
                            <span className="text-gray-700">{c.companyName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {editRole === "user" && (
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editComplexOverview}
                    onChange={(e) => setEditComplexOverview(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-700">Komplexný prehľad</span>
                    <span className="block text-xs text-gray-500">
                      Sprístupní analytický prehľad za všetky spoločnosti.
                    </span>
                  </span>
                </label>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-60 flex items-center gap-2"
                >
                  {editSubmitting ? (
                    <><Loader2 size={13} className="animate-spin" /> Ukladám...</>
                  ) : (
                    "Uložiť"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
