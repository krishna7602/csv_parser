import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GrowEasy CSV Importer | AI-Powered CRM Lead Import",
  description:
    "Upload any CRM CSV export — Facebook Ads, Google Ads, custom spreadsheets — and our AI intelligently maps your columns to the GrowEasy CRM schema.",
  keywords: ["CRM", "CSV import", "lead import", "GrowEasy", "AI mapping"],
  openGraph: {
    title: "GrowEasy CSV Importer",
    description: "AI-powered CRM lead import — works with any CSV format",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
