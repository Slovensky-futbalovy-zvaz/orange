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
  metadataBase: new URL(process.env.APP_URL ?? "https://orange.futbalsfz.sk"),
  title: {
    default: "Orange Fakturácia",
    template: "%s — Orange Fakturácia",
  },
  description: "Centralizovaný prehľad mesačných nákladov Orange — podľa spoločností, osôb aj služieb, s automatickým výpočtom nadlimitov.",
  openGraph: {
    title: "Orange Fakturácia — mobilné služby prehľadne",
    description: "Centralizovaný prehľad mesačných nákladov Orange — podľa spoločností, osôb aj služieb, s automatickým výpočtom nadlimitov.",
    type: "website",
    siteName: "Orange Fakturácia",
    locale: "sk_SK",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orange Fakturácia",
    description: "Centralizovaný prehľad mesačných nákladov Orange — podľa spoločností, osôb aj služieb.",
  },
  robots: {
    index: false,
    follow: false,
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
