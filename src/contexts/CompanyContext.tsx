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
    setSelectedCnState(stored);
    fetch("/api/companies")
      .then((r) => r.json())
      .then(setCompanies);
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
