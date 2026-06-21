"use client";

import { Menu, Download, Signal } from "lucide-react";
import { SignalBars } from "@/components/SignalBars";
import { usePeriod, MONTH_LABELS } from "@/contexts/PeriodContext";

interface AppHeaderProps {
  /** Called when the hamburger is pressed (mobile) */
  onMenuOpen: () => void;
}

const MONTHS = Object.entries(MONTH_LABELS); // [["01","Jan"], ...]

// Compact inline select — no wrapper div, inherits body font
function PeriodSelect({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  "aria-label": string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm font-medium focus:outline-none cursor-pointer appearance-none pr-5"
      style={{
        background: "transparent",
        color: "var(--ink)",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0px center",
        backgroundSize: "10px",
      }}
    >
      {options.map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
}

export default function AppHeader({ onMenuOpen }: AppHeaderProps) {
  const {
    year,
    monthFrom,
    monthTo,
    availableYears,
    periodsLoading,
    setYear,
    setMonthFrom,
    setMonthTo,
    periodLabel,
  } = usePeriod();

  const yearOptions: [string, string][] = availableYears.map((y) => [y, y]);

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
        {periodsLoading ? (
          <SignalBars size="sm" />
        ) : (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
            }}
          >
            {/* Year */}
            {yearOptions.length > 0 && (
              <PeriodSelect
                aria-label="Rok"
                value={year}
                onChange={setYear}
                options={yearOptions}
              />
            )}

            {/* Separator */}
            <span style={{ color: "var(--line)", userSelect: "none" }}>|</span>

            {/* Month from */}
            <PeriodSelect
              aria-label="Mesiac od"
              value={monthFrom}
              onChange={setMonthFrom}
              options={MONTHS}
            />

            {/* Range dash */}
            <span className="text-xs" style={{ color: "var(--faint)", userSelect: "none" }}>
              –
            </span>

            {/* Month to */}
            <PeriodSelect
              aria-label="Mesiac do"
              value={monthTo}
              onChange={setMonthTo}
              options={MONTHS}
            />
          </div>
        )}

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
