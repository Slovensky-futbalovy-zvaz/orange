"use client";

const BARS = [
  { heightPct: "30%", delay: "0s" },
  { heightPct: "50%", delay: "0.15s" },
  { heightPct: "70%", delay: "0.30s" },
  { heightPct: "85%", delay: "0.45s" },
  { heightPct: "100%", delay: "0.60s" },
];

const SIZES = {
  sm: { barW: 3, gap: 2, containerH: 18 },
  md: { barW: 4, gap: 3, containerH: 26 },
  lg: { barW: 7, gap: 5, containerH: 52 },
};

interface SignalBarsProps {
  size?: "sm" | "md" | "lg";
}

export function SignalBars({ size = "md" }: SignalBarsProps) {
  const { barW, gap, containerH } = SIZES[size];

  return (
    <>
      <style>{`
        @keyframes signalBar {
          0%   { opacity: 0.15; transform: scaleY(0.6); }
          22%  { opacity: 1;    transform: scaleY(1);   }
          55%  { opacity: 1;    transform: scaleY(1);   }
          65%  { opacity: 0.55; transform: scaleY(0.87); }
          75%  { opacity: 1;    transform: scaleY(1);   }
          88%  { opacity: 0.55; transform: scaleY(0.87); }
          100% { opacity: 0.15; transform: scaleY(0.6); }
        }
      `}</style>
      <div
        role="status"
        aria-label="Načítavam"
        style={{
          display: "inline-flex",
          alignItems: "flex-end",
          gap: `${gap}px`,
          height: `${containerH}px`,
        }}
      >
        {BARS.map((bar, i) => (
          <div
            key={i}
            style={{
              width: `${barW}px`,
              height: bar.heightPct,
              background: "var(--accent)",
              borderRadius: "2px",
              transformOrigin: "bottom center",
              animation: `signalBar 2.2s ease-in-out ${bar.delay} infinite`,
              opacity: 0.15,
            }}
          />
        ))}
      </div>
    </>
  );
}
