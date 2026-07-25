import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TranslateWidget } from "@/components/TranslateWidget";
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

const themeInitScript = `
  (function () {
    var stored = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (stored === "dark" || (!stored && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col bg-white font-sans text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <Providers>
          <Header />
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
          <TranslateWidget />
        </Providers>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
