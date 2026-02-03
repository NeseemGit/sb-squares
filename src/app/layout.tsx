import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/amplify-config";
import "./globals.css";
import { AmplifyProvider } from "@/components/AmplifyProvider";
import { HeaderNav } from "@/components/HeaderNav";
import Link from "next/link";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DB Squares – Super Bowl Squares Pools",
  description: "Create and join squares pools for the big game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen font-sans">
        <AmplifyProvider>
          <div className="flex min-h-screen flex-col">
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
              <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
                <Link href="/" className="text-xl font-bold text-amber-400">
                  DB Squares
                </Link>
                <HeaderNav />
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
              Site was developed by{" "}
              <a
                href="https://neseem.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition hover:text-amber-400"
              >
                Neseem.com
              </a>{" "}
              © 2026
            </footer>
          </div>
        </AmplifyProvider>
      </body>
    </html>
  );
}
