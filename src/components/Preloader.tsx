"use client";

import { useEffect, useState } from "react";
import { SignalBars } from "./SignalBars";

interface PreloaderProps {
  /** ms before fade-out begins */
  duration?: number;
  /** fade-out transition duration in ms */
  fadeDuration?: number;
}

export function Preloader({ duration = 700, fadeDuration = 400 }: PreloaderProps) {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), duration);
    const t2 = setTimeout(() => setHidden(true), duration + fadeDuration);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [duration, fadeDuration]);

  if (hidden) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--paper, #fff)",
        opacity: fading ? 0 : 1,
        transition: `opacity ${fadeDuration}ms ease`,
        pointerEvents: fading ? "none" : "auto",
      }}
      aria-hidden={fading}
    >
      <SignalBars size="lg" />
    </div>
  );
}
