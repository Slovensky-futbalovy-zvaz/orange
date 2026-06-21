"use client";

import { Menu, Download, Signal } from "lucide-react";
import { SignalBars } from "@/components/SignalBars";
import PeriodPicker from "@/components/PeriodPicker";
import { usePeriod } from "@/contexts/PeriodContext";

interface AppHeaderProps {
  /** Called when the hamburger is pressed (mobile) */
  onMenuOpen: () => void;
}

export default function AppHeader({ onMenuOpen }: AppHeaderProps) {
  const { periodsLoading, periodLabel } = usePeriod();

  return (
    <header
      className="flex items-center justify-between gap-3 px-4 sm:px-6"
      style={{
        height: "52px",
        borderBottom: "1px solid var(--line)",
        background: "var(--surface)",
        flexShrink: 0,
      }}
    >
      {/* Left — hamburger (mobile) + logo (mobile) */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onMenuOpen}
          className="p-1 -ml-1 transition-opacity hover:opacity-60"
          aria-label="Otvoriť menu"
          style={{ color: "var(--ink)" }}
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent)", borderRadius: "var(--radius)" }}
          >
            <Signal size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            Orange Fakturácia
          </span>
        </div>
      </div>

      {/* Center / Right — period picker */}
      <div className="flex items-center gap-2 ml-auto">
        {periodsLoading ? <SignalBars size="sm" /> : <PeriodPicker />}

        {/* Export button */}
        <button
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent-ink)",
            border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
            borderRadius: "var(--radius)",
          }}
          title={`Export — ${periodLabel}`}
        >
          <Download size={14} />
          <span className="hidden md:inline">Export</span>
        </button>
      </div>
    </header>
  );
}
