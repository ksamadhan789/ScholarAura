import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TranslateWidget } from "@/components/TranslateWidget";
import { AuraWidget } from "@/components/aura/AuraWidget";
import { SITE_URL } from "@/lib/siteUrl";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const description = "Courses, international & national conferences, faculty development programs, and hands-on trainings for professionals and academics.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ScholarAura",
    template: "%s | ScholarAura",
  },
  description,
  openGraph: {
    title: "ScholarAura",
    description,
    url: SITE_URL,
    siteName: "ScholarAura",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ScholarAura",
    description,
  },
};

// Dark is the default theme — a first-time visitor (no stored preference)
// gets dark regardless of OS preference. Someone who explicitly picked
// light via the toggle keeps seeing light on their next visit.
const themeInitScript = `
  (function () {
    var stored = localStorage.getItem("theme");
    if (stored !== "light") {
      document.documentElement.classList.add("dark");
    }
  })();
`;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "ScholarAura",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description,
  email: "scholaraura@gmail.com",
  contactPoint: {
    "@type": "ContactPoint",
    email: "scholaraura@gmail.com",
    contactType: "customer support",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-white font-sans text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <Providers>
          <Header />
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
          <TranslateWidget />
          <AuraWidget />
        </Providers>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
