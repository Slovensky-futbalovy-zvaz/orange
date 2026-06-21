"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useCompany } from "@/contexts/CompanyContext";

export const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "Máj", "06": "Jún", "07": "Júl", "08": "Aug",
  "09": "Sep", "10": "Okt", "11": "Nov", "12": "Dec",
};

interface PeriodsApiResponse {
  years: string[];
  latestYear: string;
  latestMonth: string;
}

interface PeriodContextValue {
  year: string;
  monthFrom: string;
  monthTo: string;
  availableYears: string[];
  /** Najnovší rok/mesiac s dátami (z /api/periods) */
  latestYear: string;
  latestMonth: string;
  periodsLoading: boolean;
  setYear: (y: string) => void;
  setMonthFrom: (m: string) => void;
  setMonthTo: (m: string) => void;
  /** Nastaví celé obdobie naraz (rok + rozsah mesiacov) — bez vedľajších efektov */
  setPeriod: (year: string, monthFrom: string, monthTo: string) => void;
  /** "Jan – Jún 2024" or "2024" if full year */
  periodLabel: string;
}

const PeriodContext = createContext<PeriodContextValue>({
  year: "",
  monthFrom: "01",
  monthTo: "12",
  availableYears: [],
  latestYear: "",
  latestMonth: "12",
  periodsLoading: true,
  setYear: () => {},
  setMonthFrom: () => {},
  setMonthTo: () => {},
  setPeriod: () => {},
  periodLabel: "",
});

export function PeriodProvider({ children }: { children: ReactNode }) {
  const { selectedCn } = useCompany();

  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [year, setYearState] = useState("");
  const [monthFrom, setMonthFromState] = useState("01");
  const [monthTo, setMonthToState] = useState("12");
  const [latestYear, setLatestYear] = useState("");
  const [latestMonth, setLatestMonth] = useState("12");
  const [periodsLoading, setPeriodsLoading] = useState(true);

  // Load available periods whenever company changes
  useEffect(() => {
    setPeriodsLoading(true);
    const qs = selectedCn ? `?cn=${selectedCn}` : "";
    fetch(`/api/periods${qs}`)
      .then((r) => r.json())
      .then((d: PeriodsApiResponse) => {
        setAvailableYears(d.years ?? []);
        setYearState(d.latestYear ?? "");
        setMonthFromState("01");
        setMonthToState(d.latestMonth ?? "12");
        setLatestYear(d.latestYear ?? "");
        setLatestMonth(d.latestMonth ?? "12");
        setPeriodsLoading(false);
      })
      .catch(() => setPeriodsLoading(false));
  }, [selectedCn]);

  const setPeriod = useCallback((y: string, from: string, to: string) => {
    const f = parseInt(from) <= parseInt(to) ? from : to;
    const t = parseInt(from) <= parseInt(to) ? to : from;
    setYearState(y);
    setMonthFromState(f);
    setMonthToState(t);
  }, []);

  const setYear = useCallback((y: string) => {
    setYearState(y);
    // reset range when year changes
    setMonthFromState("01");
    setMonthToState("12");
  }, []);

  const setMonthFrom = useCallback((m: string) => {
    setMonthFromState(m);
    // clamp: monthTo must be >= monthFrom
    setMonthToState((prev) =>
      parseInt(prev) < parseInt(m) ? m : prev
    );
  }, []);

  const setMonthTo = useCallback((m: string) => {
    setMonthToState(m);
    // clamp: monthFrom must be <= monthTo
    setMonthFromState((prev) =>
      parseInt(prev) > parseInt(m) ? m : prev
    );
  }, []);

  const periodLabel = (() => {
    if (!year) return "";
    const fromLabel = MONTH_LABELS[monthFrom] ?? monthFrom;
    const toLabel = MONTH_LABELS[monthTo] ?? monthTo;
    if (monthFrom === "01" && monthTo === "12") return year;
    if (monthFrom === monthTo) return `${fromLabel} ${year}`;
    return `${fromLabel} – ${toLabel} ${year}`;
  })();

  return (
    <PeriodContext.Provider
      value={{
        year,
        monthFrom,
        monthTo,
        availableYears,
        latestYear,
        latestMonth,
        periodsLoading,
        setYear,
        setMonthFrom,
        setMonthTo,
        setPeriod,
        periodLabel,
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  return useContext(PeriodContext);
}
