import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AmplifyProvider } from "@/components/AmplifyProvider";
import { HeaderNav } from "@/components/HeaderNav";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SB Squares – Super Bowl Squares Pools",
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
              <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                <Link href="/" className="text-xl font-bold text-amber-400">
                  SB Squares
                </Link>
                <HeaderNav />
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
              SB Squares – Play responsibly.
            </footer>
          </div>
        </AmplifyProvider>
      </body>
    </html>
  );
}
