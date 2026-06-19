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
} from "lucide-react";

import { ORG_NAME } from "@/config";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const AUTH_COOKIE = "ov_auth";

const CONTACT_EMAIL = process.env.REPLY_TO_EMAIL ?? "";

export default async function RootPage() {
  // Ak je používateľ prihlásený, presmeruj na prehľad
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  let loggedIn = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      loggedIn = true;
    } catch {
      // neplatný token — zobraz landing
      loggedIn = false;
    }
  }
  // redirect() musí byť MIMO try/catch — interne hádže NEXT_REDIRECT,
  // ktorý by catch zhltol a landing by sa zobrazil aj prihlásenému.
  if (loggedIn) redirect("/overview");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Signal size={16} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900">Orange Fakturácia</span>
          </div>
          <div className="flex items-center gap-3">
            {CONTACT_EMAIL && (
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
              >
                <Mail size={14} />
                Kontakt na správcu
              </a>
            )}
            <Link
              href="/login"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              Prihlásiť sa <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-xs font-medium text-orange-700 mb-6">
          <Signal size={12} />
          {ORG_NAME}
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Prehľad fakturácie<br />
          <span className="text-orange-500">mobilných služieb Orange</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
          Centralizovaný nástroj pre správu a analýzu mesačných výpisov Orange.
          Prehľad nákladov podľa spoločností, osôb a služieb na jednom mieste.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors shadow-sm"
        >
          Prihlásiť sa <ArrowRight size={16} />
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 size={18} className="text-orange-500" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Analýzy a prehľady</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Mesačné trendy, náklady na nadlimity a porovnanie období v prehľadných grafoch.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center mb-4">
              <Building2 size={18} className="text-orange-500" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Správa spoločností</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Náklady rozdelené podľa spoločností — rýchly prehľad výdavkov každej entity.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center mb-4">
              <FileText size={18} className="text-orange-500" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Importy a reporty</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Nahrávanie mesačných výpisov vo formáte XML a export reportov do Excelu.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center mb-4">
              <Users size={18} className="text-orange-500" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Správa prístupu</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Prihlásenie bez hesla cez magic link. Roly admin a používateľ s rozdielnymi oprávneniami.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-gray-400">
          <span>© {new Date().getFullYear()} {ORG_NAME}</span>
          <div className="flex items-center gap-4">
            {CONTACT_EMAIL && (
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="hover:text-gray-600 flex items-center gap-1 transition-colors"
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
