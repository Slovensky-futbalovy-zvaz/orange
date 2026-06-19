"use client";
import { useState, useEffect, Suspense } from "react";
import { Signal, Mail, User, Loader2, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { useSearchParams } from "next/navigation";

type Mode = "login" | "setup";

// useSearchParams musí byť v Suspense boundary — extrahujeme do samostatného komponentu
function UrlErrorBanner() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    invalid: "Neplatný prihlasovací odkaz.",
    expired: "Prihlasovací odkaz vypršal. Požiadajte o nový.",
    server: "Chyba servera. Skúste znova.",
  };

  if (!urlError || !errorMessages[urlError]) return null;

  return (
    <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
      <AlertCircle size={15} className="flex-shrink-0" />
      {errorMessages[urlError]}
    </div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fromEmailSet, setFromEmailSet] = useState(true);

  // Setup formulár
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    fetch("/api/auth/setup")
      .then((r) => r.json())
      .then(({ isEmpty, fromEmailSet: fe }) => {
        setMode(isEmpty ? "setup" : "login");
        setFromEmailSet(fe !== false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Chyba servera.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Nepodarilo sa odoslať email.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Chyba servera.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Nepodarilo sa odoslať email.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!fromEmailSet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-200 p-8 w-full max-w-md">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Signal size={18} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm leading-tight">Orange Fakturácia</div>
              <div className="text-xs text-gray-400">Prehľad fakturácie mobilných služieb</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
            <Settings size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800 mb-1">Chýba konfigurácia</p>
              <p className="text-sm text-orange-700">
                Premenná <code className="bg-orange-100 px-1 rounded font-mono text-xs">FROM_EMAIL</code> nie
                je nastavená. Aplikácia nemôže vytvoriť primárneho správcu ani odosielať emaily.
              </p>
            </div>
          </div>

          <h2 className="text-sm font-semibold text-gray-800 mb-3">Ako to opraviť</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>
                Otvorte súbor <code className="bg-gray-100 px-1 rounded font-mono text-xs">.env.local</code> v
                koreňovom adresári projektu.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>
                Pridajte riadok:
                <code className="block mt-1 bg-gray-100 px-2 py-1 rounded font-mono text-xs text-gray-800">
                  FROM_EMAIL=vas.email@domena.sk
                </code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span>
                Na Vercel pridajte túto premennú v <strong>Settings → Environment Variables</strong> a
                znova nasaďte aplikáciu.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <span>
                Po reštarte sa konto primárneho správcu vytvorí automaticky a budete sa môcť prihlásiť.
              </span>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Signal size={18} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm leading-tight">Orange Fakturácia</div>
            <div className="text-xs text-gray-400">Prehľad fakturácie mobilných služieb</div>
          </div>
        </div>

        {/* Chybová správa z URL — v Suspense boundary */}
        <Suspense fallback={null}>
          <UrlErrorBanner />
        </Suspense>

        {sent ? (
          /* Potvrdenie odoslania */
          <div className="text-center py-4">
            <CheckCircle size={44} className="text-green-500 mx-auto mb-4" />
            <h2 className="font-semibold text-gray-900 mb-2">
              {mode === "setup" ? "Skontrolujte email" : "Odkaz bol odoslaný"}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Poslali sme Vám email na <strong>{email}</strong>.{" "}
              {mode === "setup"
                ? "Kliknite na link pre aktiváciu správcovského konta."
                : "Kliknite na link pre prihlásenie (platný 15 minút)."}
            </p>
          </div>
        ) : mode === "setup" ? (
          /* Registrácia prvého správcu */
          <>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">
              Nastavenie správcu
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Vytvorte prvé správcovské konto pre Orange Fakturácia.
            </p>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Meno
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="Ján"
                      className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Priezvisko
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Novák"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="spravca@domena.sk"
                    className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={13} /> {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={15} className="animate-spin" /> Odosielam...</>
                ) : (
                  "Vytvoriť správcovské konto"
                )}
              </button>
            </form>
          </>
        ) : (
          /* Prihlásenie magic linkom */
          <>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">
              Prihlásenie
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Zadajte Váš email a pošleme Vám prihlasovací odkaz.
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="vas.email@domena.sk"
                    autoFocus
                    className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={13} /> {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={15} className="animate-spin" /> Odosielam...</>
                ) : (
                  "Odoslať prihlasovací odkaz"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
