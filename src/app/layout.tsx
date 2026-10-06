import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Syne } from "next/font/google";
import "./globals.css";

const display = Syne({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--font-syne", display: "swap" });
const sans = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-manrope", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "ATLAS Rezidans — Etkileşimli 3D Proje",
  description: "Katı seçin, daireyi 2D ve 3D planda inceleyin, size özel ödeme planını hesaplayın.",
};

export const viewport: Viewport = { themeColor: "#070c16" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr" className={`${display.variable} ${sans.variable} ${mono.variable}`}><body>{children}</body></html>;
}
