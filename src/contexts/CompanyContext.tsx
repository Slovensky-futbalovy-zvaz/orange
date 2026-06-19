"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Company {
  _id: string;
  cn: string;
  companyName: string;
}

interface CompanyContextType {
  selectedCn: string;
  setSelectedCn: (cn: string) => void;
  companies: Company[];
}

const CompanyContext = createContext<CompanyContextType>({
  selectedCn: "",
  setSelectedCn: () => {},
  companies: [],
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCn, setSelectedCnState] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("selectedCn") ?? "";
    fetch("/api/companies")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Company[]) => {
        setCompanies(list);
        if (list.length === 1) {
          // Jediná spoločnosť — automaticky ju vyber
          setSelectedCnState(list[0].cn);
          localStorage.setItem("selectedCn", list[0].cn);
        } else {
          // Ak uložená spoločnosť nie je v povolenom zozname, resetuj výber
          const valid = stored === "" || list.some((c) => c.cn === stored);
          setSelectedCnState(valid ? stored : "");
          if (!valid) localStorage.removeItem("selectedCn");
        }
      });
  }, []);

  function setSelectedCn(cn: string) {
    localStorage.setItem("selectedCn", cn);
    setSelectedCnState(cn);
  }

  return (
    <CompanyContext.Provider value={{ selectedCn, setSelectedCn, companies }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
