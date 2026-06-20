import type { Metadata } from "next";
import { Manrope, Instrument_Serif } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { Providers } from "@/components/Providers";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Orange Fakturácia",
  description: "Centralizovaný prehľad mesačných nákladov Orange — podľa spoločností, osôb aj služieb, s automatickým výpočtom nadlimitov.",
  openGraph: {
    title: "Orange Fakturácia — fakturácia mobilných služieb prehľadne",
    description: "Centralizovaný prehľad mesačných nákladov Orange — podľa spoločností, osôb aj služieb, s automatickým výpočtom nadlimitov.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" data-dir="d">
      <body className={`${manrope.variable} ${instrumentSerif.variable}`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
