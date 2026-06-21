"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { usePeriod, MONTH_LABELS } from "@/contexts/PeriodContext";

const MONTHS = Object.keys(MONTH_LABELS); // ["01" ... "12"]

/**
 * Globálny vyberač obdobia v hlavičke aplikácie (AppHeader). Popover:
 * navigácia rokov (len roky s dátami) + výber rozsahu mesiacov
 * (1. klik = začiatok, 2. klik = koniec). Zmena sa aplikuje až cez „Hotovo".
 */
export default function PeriodPicker() {
  const {
    year, monthFrom, monthTo,
    availableYears, latestYear, latestMonth,
    periodsLoading, setPeriod, periodLabel,
  } = usePeriod();

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Draft selection (applies only on "Hotovo")
  const [draftYear, setDraftYear] = useState(year);
  const [draftFrom, setDraftFrom] = useState(monthFrom);
  const [draftTo, setDraftTo] = useState(monthTo);
  const [pendingEnd, setPendingEnd] = useState(false);

  const years = [...availableYears].sort((a, b) => parseInt(a) - parseInt(b));
  const yearIdx = years.indexOf(draftYear);
  const hasPrev = yearIdx > 0;
  const hasNext = yearIdx >= 0 && yearIdx < years.length - 1;

  function openPicker() {
    setDraftYear(year || latestYear);
    setDraftFrom(monthFrom);
    setDraftTo(monthTo);
    setPendingEnd(false);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function clickMonth(m: string) {
    if (!pendingEnd) {
      setDraftFrom(m);
      setDraftTo(m);
      setPendingEnd(true);
    } else {
      const a = parseInt(draftFrom);
      const b = parseInt(m);
      setDraftFrom(Math.min(a, b).toString().padStart(2, "0"));
      setDraftTo(Math.max(a, b).toString().padStart(2, "0"));
      setPendingEnd(false);
    }
  }

  function selectCurrentMonth() {
    setDraftYear(latestYear);
    setDraftFrom(latestMonth);
    setDraftTo(latestMonth);
    setPendingEnd(false);
  }

  function apply() {
    setPeriod(draftYear, draftFrom, draftTo);
    setOpen(false);
  }

  const inRange = (m: string) =>
    parseInt(m) >= parseInt(draftFrom) && parseInt(m) <= parseInt(draftTo);
  const isStart = (m: string) => m === draftFrom;

  if (periodsLoading) return null;

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          color: "var(--ink)",
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Calendar size={15} style={{ color: "var(--muted)" }} />
        <span>{periodLabel || "Vybrať obdobie"}</span>
        <ChevronDown
          size={14}
          style={{ color: "var(--muted)" }}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Popover */}
      {open && (
        <div
          role="dialog"
          className="absolute right-0 mt-2 z-50 p-4"
          style={{
            width: 320,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "calc(var(--radius) * 1.25)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
          }}
        >
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => hasPrev && setDraftYear(years[yearIdx - 1])}
              disabled={!hasPrev}
              className="w-9 h-9 flex items-center justify-center transition-opacity disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-70"
              style={{ border: "1px solid var(--line)", borderRadius: "var(--radius)", color: "var(--ink)" }}
              aria-label="Predchádzajúci rok"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-serif text-xl" style={{ color: "var(--ink)" }}>
              {draftYear}
            </span>
            <button
              type="button"
              onClick={() => hasNext && setDraftYear(years[yearIdx + 1])}
              disabled={!hasNext}
              className="w-9 h-9 flex items-center justify-center transition-opacity disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-70"
              style={{ border: "1px solid var(--line)", borderRadius: "var(--radius)", color: "var(--ink)" }}
              aria-label="Nasledujúci rok"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((m) => {
              const active = inRange(m);
              const start = isStart(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => clickMonth(m)}
                  className="py-2.5 text-sm font-medium transition-colors"
                  style={{
                    borderRadius: "var(--radius)",
                    background: active ? "var(--accent)" : "var(--surface)",
                    color: active ? "#fff" : "var(--ink)",
                    border: active ? "1px solid var(--accent)" : "1px solid var(--line)",
                    outline: start ? "2px solid var(--accent)" : "none",
                    outlineOffset: start ? "1px" : undefined,
                  }}
                >
                  {MONTH_LABELS[m]}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4" style={{ borderTop: "1px solid var(--line)" }} />

          {/* Footer */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={selectCurrentMonth}
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--muted)" }}
            >
              Aktuálny mesiac
            </button>
            <button
              type="button"
              onClick={apply}
              className="px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)", color: "#fff", borderRadius: "var(--radius)" }}
            >
              Hotovo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
