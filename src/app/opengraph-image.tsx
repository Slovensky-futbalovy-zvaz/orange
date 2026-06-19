import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Orange Fakturácia – Prehľad fakturácie mobilných služieb";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f9fafb",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Navbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "28px 60px",
            backgroundColor: "white",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#f97316",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Signal icon SVG */}
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <circle cx="4" cy="26" r="1.5" fill="white" />
                <line x1="10" y1="26" x2="10" y2="21" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="16" y1="26" x2="16" y2="16" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="22" y1="26" x2="22" y2="11" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="28" y1="26" x2="28" y2="6" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontSize: "22px", fontWeight: "600", color: "#111827" }}>
              Orange Fakturácia
            </span>
          </div>
        </div>

        {/* Hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "40px 80px",
            gap: "0px",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              backgroundColor: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: "999px",
              marginBottom: "32px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
              <circle cx="4" cy="26" r="1.5" fill="#f97316" />
              <line x1="10" y1="26" x2="10" y2="21" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
              <line x1="16" y1="26" x2="16" y2="16" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
              <line x1="22" y1="26" x2="22" y2="11" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
              <line x1="28" y1="26" x2="28" y2="6" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: "14px", fontWeight: "500", color: "#c2410c" }}>
              Nástroj pre správu Orange výpisov
            </span>
          </div>

          {/* Heading */}
          <div
            style={{
              fontSize: "58px",
              fontWeight: "700",
              color: "#111827",
              textAlign: "center",
              lineHeight: "1.15",
              marginBottom: "24px",
            }}
          >
            Prehľad fakturácie
            <br />
            <span style={{ color: "#f97316" }}>mobilných služieb Orange</span>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "22px",
              color: "#6b7280",
              textAlign: "center",
              maxWidth: "700px",
              lineHeight: "1.5",
              marginBottom: "48px",
            }}
          >
            Centralizovaný nástroj pre správu a analýzu mesačných výpisov.
            Prehľad nákladov podľa spoločností a služieb na jednom mieste.
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: "16px" }}>
            {["Analýzy a prehľady", "Správa spoločností", "Importy XML", "Magic link login"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "15px",
                    color: "#374151",
                    fontWeight: "500",
                  }}
                >
                  {label}
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom accent bar */}
        <div style={{ height: "6px", backgroundColor: "#f97316" }} />
      </div>
    ),
    { ...size }
  );
}
