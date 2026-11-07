import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
// [dashboard-and-switcher] header slot controls
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { PatientSwitcher } from "@/components/layout/PatientSwitcher";
import { ResetDemoButton } from "@/components/layout/ResetDemoButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aftercare Loop",
  description:
    "Understand, verify and follow through on documented care instructions. Demonstration using fictional patient data.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        {/*
          Header slots: pass real controls here when they exist, e.g.
          patientSwitcher={<PatientSwitcher />} languageToggle={<LanguageToggle />} resetDemo={<ResetDemoButton />}
        */}
        <AppShell
          patientSwitcher={<PatientSwitcher />}
          languageToggle={<LanguageToggle />}
          resetDemo={<ResetDemoButton />}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
