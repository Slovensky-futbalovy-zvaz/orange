"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Signal, Loader2, AlertCircle, LogIn } from "lucide-react";

function VerifyInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const errorMessages: Record<string, string> = {
    invalid: "Neplatný prihlasovací odkaz.",
    expired: "Prihlasovací odkaz vypršal. Požiadajte o nový.",
    server: "Chyba servera. Skúste znova.",
  };

  async function confirm() {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        // Prihlásenie úspešné — prejdi do aplikácie
        window.location.href = "/";
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(errorMessages[data.error as string] || "Prihlásenie zlyhalo.");
    } catch {
      setError("Nepodarilo sa overiť odkaz. Skúste znova.");
    } finally {
      setSubmitting(false);
    }
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

        {!token ? (
          <div
            className="flex items-center gap-2 p-3 text-sm"
            style={{
              background: "color-mix(in srgb, var(--danger) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
              color: "var(--danger)",
              borderRadius: "var(--radius)",
            }}
          >
            <AlertCircle size={15} className="flex-shrink-0" />
            Chýba prihlasovací token. Otvorte odkaz z e-mailu znova.
          </div>
        ) : (
          <>
            <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--ink)" }}>
              Prihlásenie do systému
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
              Kliknutím na tlačidlo dokončíte prihlásenie a aktiváciu konta.
            </p>

            {error && (
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
                {error}
              </div>
            )}

            <button
              onClick={confirm}
              disabled={submitting}
              className="w-full py-2.5 text-white text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "var(--accent)", borderRadius: "var(--radius)" }}
            >
              {submitting ? (
                <><Loader2 size={15} className="animate-spin" /> Prihlasujem...</>
              ) : (
                <><LogIn size={15} /> Prihlásiť sa</>
              )}
            </button>

            {error && (
              <button
                onClick={() => router.push("/login")}
                className="w-full mt-3 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: "var(--muted)" }}
              >
                Požiadať o nový odkaz
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--paper)" }}>
          <Loader2 className="animate-spin" size={32} style={{ color: "var(--accent)" }} />
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
