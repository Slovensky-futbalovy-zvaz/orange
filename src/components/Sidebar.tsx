"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Users, Upload, FileText, BarChart2,
  Building2, Landmark, Signal, Layers, BookOpen,
  LogOut, Shield, Github, Palette, LayoutDashboard, Check, ChevronDown,
} from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, THEMES } from "@/contexts/ThemeContext";

const nav = [
  { href: "/overview",          label: "Prehľad",          icon: BarChart2 },
  { href: "/complex-overview",  label: "Komplexný prehľad", icon: LayoutDashboard, complexOnly: true },
  { href: "/personal",          label: "Osobné",           icon: FileText  },
  { href: "/fees",              label: "Poplatky",         icon: Building2 },
  { href: "/services",          label: "Služby",           icon: Layers    },
  { href: "/companies",         label: "Spoločnosti",      icon: Landmark,  adminOnly: true },
  { href: "/people",            label: "Osoby",            icon: Users,     adminOnly: true },
  { href: "/import",            label: "Import",           icon: Upload,    adminOnly: true },
  { href: "/codebook",          label: "Číselníky",        icon: BookOpen,  adminOnly: true },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { selectedCn, setSelectedCn, companies } = useCompany();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const currentTheme = THEMES.find((t) => t.dir === theme) ?? THEMES[0];

  useEffect(() => {
    if (!themeMenuOpen) return;
    function onDown(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [themeMenuOpen]);

  const isAdmin = user?.role === "admin";
  // Voľbu „Všetky spoločnosti" vidí len Správca (admin) — má prístup ku všetkým
  // firmám. Bežný používateľ ju nevidí (mýlila ich); CompanyContext mu vždy
  // vyberie konkrétnu firmu.
  const showAllOption = isAdmin;
  const companyOptions = [
    ...(showAllOption ? [{ value: "", label: "Všetky spoločnosti" }] : []),
    ...companies.map((c) => ({ value: c.cn, label: c.companyName })),
  ];
  // Bežný používateľ bez priradenej firmy nemá čo prepínať — switcher skry.
  const showSwitcher = isAdmin || companies.length > 0;

  return (
    <aside
      className="w-64 h-full flex flex-col"
      style={{ background: "var(--side-bg)", borderRight: "1px solid var(--line)" }}
    >
      {/* App header */}
      <div className="p-4" style={{ borderBottom: "1px solid color-mix(in srgb, var(--side-fg) 20%, transparent)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent)", borderRadius: "var(--radius)" }}
          >
            <Signal size={16} className="text-white" />
          </div>
          <div className="font-semibold text-sm leading-tight" style={{ color: "var(--side-active-fg)" }}>
            Orange Fakturácia
          </div>
        </div>
        {/* Company switcher */}
        {showSwitcher && (
          <CustomSelect
            value={selectedCn}
            onChange={setSelectedCn}
            options={companyOptions}
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col overflow-y-auto">
        <div className="space-y-0.5">
          {nav
            .filter(({ adminOnly, complexOnly }) => {
              if (adminOnly) return user?.role === "admin";
              if (complexOnly) return isAdmin || user?.complexOverview === true;
              return true;
            })
            .map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                pathname.startsWith(href + "/") ||
                (href === "/overview" && pathname === "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className="flex items-center gap-3 px-3 py-2 text-sm transition-colors"
                  style={{
                    borderRadius: "var(--radius)",
                    background: active ? "var(--side-active-bg)" : "transparent",
                    color: active ? "var(--side-active-fg)" : "var(--side-fg)",
                    fontWeight: active ? 600 : 400,
                  }}
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
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 py-2 text-sm transition-colors"
              style={{
                borderRadius: "var(--radius)",
                background: pathname.startsWith("/admin/users") ? "var(--side-active-bg)" : "transparent",
                color: pathname.startsWith("/admin/users") ? "var(--side-active-fg)" : "var(--side-fg)",
                fontWeight: pathname.startsWith("/admin/users") ? 600 : 400,
              }}
            >
              <Shield size={16} />
              Používatelia
            </Link>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme switcher — šablóna */}
        <div
          ref={themeRef}
          className="mt-3 pt-3 relative"
          style={{ borderTop: "1px solid color-mix(in srgb, var(--side-fg) 20%, transparent)" }}
        >
          <button
            onClick={() => setThemeMenuOpen((o) => !o)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors"
            style={{
              borderRadius: "var(--radius)",
              color: "var(--side-fg)",
              background: themeMenuOpen ? "var(--side-active-bg)" : "transparent",
            }}
            aria-haspopup="menu"
            aria-expanded={themeMenuOpen}
          >
            <Palette size={16} />
            <span className="flex-1 text-left">Šablóna · {currentTheme.name}</span>
            <span
              className="w-4 h-4 flex-shrink-0"
              style={{ background: currentTheme.accent, borderRadius: "calc(var(--radius) * 0.6)" }}
            />
            <ChevronDown
              size={14}
              className={`transition-transform ${themeMenuOpen ? "rotate-180" : ""}`}
              style={{ opacity: 0.6 }}
            />
          </button>

          {themeMenuOpen && (
            <div
              role="menu"
              className="absolute left-3 right-3 bottom-full mb-1 py-1 z-20 overflow-hidden"
              style={{
                background: "var(--side-bg)",
                border: "1px solid color-mix(in srgb, var(--side-fg) 25%, transparent)",
                borderRadius: "var(--radius)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              }}
            >
              {THEMES.map((t) => {
                const active = t.dir === theme;
                return (
                  <button
                    key={t.dir}
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      setTheme(t.dir);
                      setThemeMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                    style={{
                      color: active ? "var(--side-active-fg)" : "var(--side-fg)",
                      background: active ? "var(--side-active-bg)" : "transparent",
                    }}
                  >
                    <span
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ background: t.accent, borderRadius: "calc(var(--radius) * 0.5)" }}
                    />
                    <span className="flex-1 text-left">{t.name}</span>
                    {active && <Check size={14} style={{ color: "var(--side-active-fg)" }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Info o používateľovi + odhlásenie */}
        {user && (
          <div
            className="mt-3 pt-3 space-y-0.5"
            style={{ borderTop: "1px solid color-mix(in srgb, var(--side-fg) 20%, transparent)" }}
          >
            <div className="px-3 py-1.5">
              <div className="text-xs font-medium truncate" style={{ color: "var(--side-active-fg)" }}>
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs truncate" style={{ color: "var(--side-fg)" }}>{user.email}</div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:opacity-80"
              style={{ color: "var(--side-fg)", borderRadius: "var(--radius)" }}
            >
              <LogOut size={13} />
              Odhlásiť sa
            </button>
          </div>
        )}

        {/* GitHub odkaz */}
        <div
          className="mt-2 pt-2"
          style={{ borderTop: "1px solid color-mix(in srgb, var(--side-fg) 15%, transparent)" }}
        >
          <a
            href="https://github.com/Slovensky-futbalovy-zvaz/orange"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:opacity-80"
            style={{ color: "var(--side-fg)", borderRadius: "var(--radius)" }}
          >
            <Github size={13} />
            Zdrojový kód na GitHub
          </a>
        </div>
      </nav>
    </aside>
  );
}
