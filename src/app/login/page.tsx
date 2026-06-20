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
    <div
      className="flex items-center gap-2 mb-4 p-3 text-sm"
      style={{
        background: "color-mix(in srgb, var(--danger) 8%, transparent)",
        border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
        color: "var(--danger)",
        borderRadius: "var(--radius)",
      }}
    >
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--paper)" }}>
        <Loader2 className="animate-spin" size={32} style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (!fromEmailSet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--paper)" }}>
        <div
          className="rounded-2xl shadow-sm p-8 w-full max-w-md"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <div className="flex items-center gap-2 mb-6">
            <div
              className="w-9 h-9 flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent)", borderRadius: "var(--radius)" }}
            >
              <Signal size={18} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight" style={{ color: "var(--ink)" }}>Orange Fakturácia</div>
              <div className="text-xs" style={{ color: "var(--faint)" }}>Prehľad fakturácie mobilných služieb</div>
            </div>
          </div>

          <div
            className="flex items-start gap-3 p-4 rounded-xl mb-6"
            style={{ background: "var(--accent-soft)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}
          >
            <Settings size={18} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--ink)" }}>Chýba konfigurácia</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Premenná{" "}
                <code className="px-1 rounded font-mono text-xs" style={{ background: "var(--line)", color: "var(--ink)" }}>
                  FROM_EMAIL
                </code>{" "}
                nie je nastavená. Aplikácia nemôže vytvoriť primárneho správcu ani odosielať emaily.
              </p>
            </div>
          </div>

          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink)" }}>Ako to opraviť</h2>
          <ol className="space-y-3 text-sm" style={{ color: "var(--muted)" }}>
            <li className="flex gap-2">
              <span
                className="w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5 text-white"
                style={{ background: "var(--accent)" }}
              >1</span>
              <span>
                Otvorte súbor{" "}
                <code className="px-1 rounded font-mono text-xs" style={{ background: "var(--line)", color: "var(--ink)" }}>
                  .env.local
                </code>{" "}
                v koreňovom adresári projektu.
              </span>
            </li>
            <li className="flex gap-2">
              <span
                className="w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5 text-white"
                style={{ background: "var(--accent)" }}
              >2</span>
              <span>
                Pridajte riadok:
                <code
                  className="block mt-1 px-2 py-1 rounded font-mono text-xs"
                  style={{ background: "var(--line)", color: "var(--ink)" }}
                >
                  FROM_EMAIL=vas.email@domena.sk
                </code>
              </span>
            </li>
            <li className="flex gap-2">
              <span
                className="w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5 text-white"
                style={{ background: "var(--accent)" }}
              >3</span>
              <span>
                Na Vercel pridajte túto premennú v <strong>Settings → Environment Variables</strong> a znova nasaďte aplikáciu.
              </span>
            </li>
            <li className="flex gap-2">
              <span
                className="w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5 text-white"
                style={{ background: "var(--accent)" }}
              >4</span>
              <span>Po reštarte sa konto primárneho správcu vytvorí automaticky a budete sa môcť prihlásiť.</span>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--paper)" }}>
      <div
        className="rounded-2xl shadow-sm p-8 w-full max-w-sm"
        style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div
            className="w-9 h-9 flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent)", borderRadius: "var(--radius)" }}
          >
            <Signal size={18} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight" style={{ color: "var(--ink)" }}>Orange Fakturácia</div>
            <div className="text-xs" style={{ color: "var(--faint)" }}>Prehľad fakturácie mobilných služieb</div>
          </div>
        </div>

        {/* Chybová správa z URL — v Suspense boundary */}
        <Suspense fallback={null}>
          <UrlErrorBanner />
        </Suspense>

        {sent ? (
          /* Potvrdenie odoslania */
          <div className="text-center py-4">
            <CheckCircle size={44} className="mx-auto mb-4" style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold mb-2" style={{ color: "var(--ink)" }}>
              {mode === "setup" ? "Skontrolujte email" : "Odkaz bol odoslaný"}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              Poslali sme Vám email na <strong style={{ color: "var(--ink)" }}>{email}</strong>.{" "}
              {mode === "setup"
                ? "Kliknite na link pre aktiváciu správcovského konta."
                : "Kliknite na link pre prihlásenie (platný 15 minút)."}
            </p>
          </div>
        ) : mode === "setup" ? (
          /* Registrácia prvého správcu */
          <>
            <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--ink)" }}>
              Nastavenie správcu
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
              Vytvorte prvé správcovské konto pre Orange Fakturácia.
            </p>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Meno</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--faint)" }} />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="Ján"
                      className="w-full pl-8 pr-3 py-2.5 text-sm focus:outline-none"
                      style={{
                        background: "var(--paper)",
                        border: "1px solid var(--line)",
                        color: "var(--ink)",
                        borderRadius: "var(--radius)",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Priezvisko</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Novák"
                    className="w-full px-3 py-2.5 text-sm focus:outline-none"
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--line)",
                      color: "var(--ink)",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--faint)" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="spravca@domena.sk"
                    className="w-full pl-8 pr-3 py-2.5 text-sm focus:outline-none"
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--line)",
                      color: "var(--ink)",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm flex items-center gap-1" style={{ color: "var(--danger)" }}>
                  <AlertCircle size={13} /> {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 text-white text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "var(--accent)", borderRadius: "var(--radius)" }}
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
            <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--ink)" }}>
              Prihlásenie
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
              Zadajte Váš email a pošleme Vám prihlasovací odkaz.
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--faint)" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="vas.email@domena.sk"
                    autoFocus
                    className="w-full pl-8 pr-3 py-2.5 text-sm focus:outline-none"
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--line)",
                      color: "var(--ink)",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm flex items-center gap-1" style={{ color: "var(--danger)" }}>
                  <AlertCircle size={13} /> {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 text-white text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "var(--accent)", borderRadius: "var(--radius)" }}
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
