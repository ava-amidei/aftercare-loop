import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
// [dashboard-and-switcher] header slot controls
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { PatientSwitcher } from "@/components/layout/PatientSwitcher";
import { ResetDemoButton } from "@/components/layout/ResetDemoButton";
// [personalization-and-pwa] per-patient accent + font scale on <html>
import { ThemeApplier } from "@/components/theme/ThemeApplier";
import "./globals.css";

// [design-restyle] Montserrat (docs/DESIGN.md): body 400–500, headings 600–700.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aftercare Loop",
  description:
    "Understand, verify and follow through on documented care instructions. Demonstration using fictional patient data.",
  // [personalization-and-pwa] PWA
  applicationName: "Aftercare Loop",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Aftercare", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FBA17E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ThemeApplier />
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
