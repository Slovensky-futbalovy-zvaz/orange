"use client";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PeriodProvider } from "@/contexts/PeriodContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CompanyProvider>
          <PeriodProvider>{children}</PeriodProvider>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
