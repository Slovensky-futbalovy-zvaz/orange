"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users, Upload, FileText, BarChart2,
  Building2, Landmark, Signal, Layers, BookOpen,
  LogOut, Shield, Github,
} from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";

const nav = [
  { href: "/overview",  label: "Prehľad",    icon: BarChart2 },
  { href: "/personal",  label: "Osobné",     icon: FileText  },
  { href: "/fees",      label: "Poplatky",   icon: Building2 },
  { href: "/services",  label: "Služby",     icon: Layers    },
  { href: "/firmy",     label: "Firmy",      icon: Landmark,  adminOnly: true },
  { href: "/people",    label: "Osoby",      icon: Users,     adminOnly: true },
  { href: "/import",    label: "Import",     icon: Upload,    adminOnly: true },
  { href: "/codebook",  label: "Číselníky",  icon: BookOpen,  adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { selectedCn, setSelectedCn, companies } = useCompany();
  const { user, logout } = useAuth();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      {/* App header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Signal size={16} className="text-white" />
          </div>
          <div className="font-semibold text-sm text-gray-900 leading-tight">Orange Fakturácia</div>
        </div>
        {/* Company switcher — pri 1 spoločnosti len statický label */}
        {companies.length === 1 ? (
          <div className="px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg truncate">
            {companies[0].companyName}
          </div>
        ) : (
          <CustomSelect
            value={selectedCn}
            onChange={setSelectedCn}
            options={[
              { value: "", label: "Všetky spoločnosti" },
              ...companies.map((c) => ({ value: c.cn, label: c.companyName })),
            ]}
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col">
        <div className="space-y-1">
          {nav
            .filter(({ adminOnly }) => !adminOnly || user?.role === "admin")
            .map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                pathname.startsWith(href + "/") ||
                (href === "/overview" && pathname === "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-orange-50 text-orange-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}

          {/* Správa používateľov — len admin */}
          {user?.role === "admin" && (
            <Link
              href="/admin/users"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname.startsWith("/admin/users")
                  ? "bg-orange-50 text-orange-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Shield size={16} />
              Používatelia
            </Link>
          )}
        </div>

        {/* Info o používateľovi + odhlásenie — priamo pod menu */}
        {user && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
            <div className="px-3 py-1.5">
              <div className="text-xs font-medium text-gray-700 truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={13} />
              Odhlásiť sa
            </button>
          </div>
        )}

        {/* GitHub odkaz */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <a
            href="https://github.com/Slovensky-futbalovy-zvaz/orange"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Github size={13} />
            Zdrojový kód na GitHub
          </a>
        </div>
      </nav>
    </aside>
  );
}
