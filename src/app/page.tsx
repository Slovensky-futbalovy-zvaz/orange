import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import Link from "next/link";
import {
  Signal,
  BarChart3,
  Building2,
  FileText,
  Users,
  ArrowRight,
  Mail,
  TrendingUp,
  AlertTriangle,
  Layers,
} from "lucide-react";

import { ORG_NAME } from "@/config";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const AUTH_COOKIE = "ov_auth";
const CONTACT_EMAIL = process.env.REPLY_TO_EMAIL ?? "";

export default async function RootPage() {
  // Redirect logged-in users straight to the app
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  let loggedIn = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      loggedIn = true;
    } catch {
      loggedIn = false;
    }
  }
  if (loggedIn) redirect("/overview");

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-40"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent)", borderRadius: "var(--radius)" }}
            >
              <Signal size={16} className="text-white" />
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
              Orange Fakturácia
            </span>
          </div>
          <div className="flex items-center gap-3">
            {CONTACT_EMAIL && (
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm hidden sm:flex items-center gap-1.5 transition-opacity hover:opacity-70"
                style={{ color: "var(--muted)" }}
              >
                <Mail size={14} />
                Kontakt
              </a>
            )}
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85"
              style={{ background: "var(--accent)", borderRadius: "var(--radius)" }}
            >
              Prihlásiť sa <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-7"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent-ink)",
            border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
          }}
        >
          <Signal size={11} />
          {ORG_NAME}
        </div>

        {/* Headline */}
        <h1
          className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight mb-5"
          style={{ color: "var(--ink)" }}
        >
          Výpisy, ktoré konečne
          <br />
          <span style={{ color: "var(--accent)" }}>dávajú zmysel.</span>
        </h1>

        <p className="text-base sm:text-lg max-w-xl mx-auto mb-9 leading-relaxed" style={{ color: "var(--muted)" }}>
          Centralizovaný prehľad mesačných nákladov Orange — podľa spoločností,
          osôb aj služieb, s automatickým výpočtom nadlimitov.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: "var(--accent)", borderRadius: "var(--radius)" }}
        >
          Začať používať <ArrowRight size={16} />
        </Link>
      </section>

      {/* ── Preview card ── */}
      <section className="max-w-5xl mx-auto px-6 pb-14">
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "var(--surface)",
            borderColor: "var(--line)",
            boxShadow: "0 4px 24px color-mix(in srgb, var(--ink) 6%, transparent)",
          }}
        >
          {/* Fake app header */}
          <div
            className="px-5 py-3 flex items-center gap-3"
            style={{ borderBottom: "1px solid var(--line)", background: "var(--paper)" }}
          >
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: "var(--line)" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "var(--line)" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "var(--line)" }} />
            </div>
            <span className="text-xs" style={{ color: "var(--faint)" }}>Orange Fakturácia — Prehľad</span>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: "var(--line)" }}>
            {[
              { label: "Celkové čísla", value: "148", icon: Users },
              { label: "Náklady spolu", value: "4 327,80 €", accent: true, icon: TrendingUp },
              { label: "Nadlimity", value: "12", icon: AlertTriangle },
              { label: "Suma nadlimitov", value: "386,40 €", danger: true, icon: AlertTriangle },
            ].map(({ label, value, accent, danger, icon: Icon }) => (
              <div
                key={label}
                className="px-5 py-4"
                style={{ background: "var(--surface)" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon
                    size={11}
                    style={{ color: danger ? "var(--danger)" : accent ? "var(--accent)" : "var(--faint)" }}
                  />
                  <span className="text-xs" style={{ color: "var(--faint)" }}>{label}</span>
                </div>
                <div
                  className="font-serif text-xl sm:text-2xl tabular-nums"
                  style={{ color: danger ? "var(--danger)" : accent ? "var(--accent)" : "var(--ink)" }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Fake chart area */}
          <div className="px-5 py-6">
            <div className="mb-3 text-xs font-medium" style={{ color: "var(--muted)" }}>Vývoj nákladov — posledných 6 mesiacov</div>
            <div className="flex items-end gap-2 h-20">
              {[58, 72, 65, 80, 69, 100].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end">
                  <div
                    className="rounded-t-sm transition-all"
                    style={{
                      height: `${h}%`,
                      background: i === 5 ? "var(--accent)" : "var(--accent-soft)",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              {["Jan", "Feb", "Mar", "Apr", "Máj", "Jún"].map((m) => (
                <div key={m} className="flex-1 text-center text-xs" style={{ color: "var(--faint)" }}>{m}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-center text-sm font-semibold mb-8" style={{ color: "var(--faint)" }}>
          ČO APLIKÁCIA RIEŠI
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: BarChart3,
              title: "Analýzy a prehľady",
              desc: "Mesačné trendy, náklady na nadlimity a porovnanie období v prehľadných grafoch.",
            },
            {
              icon: Building2,
              title: "Náklady po spoločnostiach",
              desc: "Rozdelenie výdavkov podľa spoločností — rýchly prehľad každej entity.",
            },
            {
              icon: Layers,
              title: "Rozpad podľa služieb",
              desc: "Detailný prehľad nákladov podľa typov služieb s podielovými barmi.",
            },
            {
              icon: FileText,
              title: "Import a export",
              desc: "Nahrávanie mesačných výpisov vo formáte XML, export reportov do Excelu.",
            },
            {
              icon: Users,
              title: "Osobné výpisy",
              desc: "Prehľad výdavkov ku každému zamestnancovi, filtrovanie nadlimitov.",
            },
            {
              icon: AlertTriangle,
              title: "Nadlimity pod kontrolou",
              desc: "Automatický výpočet a zvýraznenie prekročených limitov volaní.",
            },
            {
              icon: Signal,
              title: "Viacero spoločností",
              desc: "Podpora viacerých organizácií / stredísk s granulárnym riadením prístupu.",
            },
            {
              icon: Mail,
              title: "Bezpečné prihlásenie",
              desc: "Prihlásenie bez hesla cez magic link. Role admin a používateľ.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-5 border"
              style={{
                background: "var(--surface)",
                borderColor: "var(--line)",
                borderRadius: "var(--radius)",
              }}
            >
              <div
                className="w-9 h-9 flex items-center justify-center mb-4"
                style={{ background: "var(--accent-soft)", borderRadius: "var(--radius)" }}
              >
                <Icon size={18} style={{ color: "var(--accent)" }} />
              </div>
              <h3 className="font-semibold text-sm mb-1.5" style={{ color: "var(--ink)" }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div
          className="rounded-2xl px-8 py-10 text-center"
          style={{ background: "var(--accent)" }}
        >
          <h2 className="font-serif text-2xl sm:text-3xl text-white mb-3">
            Koniec chaosu vo výpisoch.
          </h2>
          <p className="text-white/80 mb-6 text-sm max-w-md mx-auto">
            Prihláste sa a získajte okamžitý prehľad o nákladoch vašej organizácie.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-opacity hover:opacity-85"
            style={{
              background: "var(--surface)",
              color: "var(--accent)",
              borderRadius: "var(--radius)",
            }}
          >
            Prihlásiť sa cez magic link <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4 text-xs" style={{ color: "var(--faint)" }}>
          <span>© {new Date().getFullYear()} {ORG_NAME}</span>
          <div className="flex items-center gap-4">
            {CONTACT_EMAIL && (
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="hover:opacity-70 flex items-center gap-1 transition-opacity"
              >
                <Mail size={12} />
                Kontakt na správcu
              </a>
            )}
            <span>Orange Fakturácia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
