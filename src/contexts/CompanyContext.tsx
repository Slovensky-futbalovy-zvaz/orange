"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user, loading: authLoading } = useAuth();
  const [selectedCn, setSelectedCnState] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    // Počkáme, kým sa dotiahne prihlásený používateľ — výber firmy závisí od roly
    if (authLoading) return;

    const stored = localStorage.getItem("selectedCn") ?? "";
    fetch("/api/companies")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Company[]) => {
        setCompanies(list);

        const isAdmin = user?.role === "admin";

        if (list.length === 1) {
          // Jediná spoločnosť — automaticky ju vyber
          setSelectedCnState(list[0].cn);
          localStorage.setItem("selectedCn", list[0].cn);
          return;
        }

        const storedValid = stored !== "" && list.some((c) => c.cn === stored);

        if (isAdmin) {
          // Admin smie zostať na „Všetky spoločnosti" (prázdny výber)
          const valid = stored === "" || storedValid;
          setSelectedCnState(valid ? stored : "");
          if (!valid) localStorage.removeItem("selectedCn");
        } else {
          // Bežný používateľ nikdy nesmie zostať na prázdnom (= všetky).
          // Ak uložený výber nesedí, vyber prvú dostupnú firmu.
          if (storedValid) {
            setSelectedCnState(stored);
          } else if (list.length > 0) {
            setSelectedCnState(list[0].cn);
            localStorage.setItem("selectedCn", list[0].cn);
          } else {
            setSelectedCnState("");
            localStorage.removeItem("selectedCn");
          }
        }
      });
  }, [user, authLoading]);

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
