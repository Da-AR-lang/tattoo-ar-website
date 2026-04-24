import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";
import { FittingRoomProvider } from "@/context/FittingRoomContext";
import { getSiteUrl } from "@/lib/siteUrl";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "INK AR | 刺青虛擬試穿",
    template: "%s | INK AR",
  },
  description: "探索刺青藝術，透過 AR 虛擬試穿找到屬於你的刺青風格",
  openGraph: {
    title: "INK AR | 刺青虛擬試穿",
    description: "探索刺青藝術，透過 AR 虛擬試穿找到屬於你的刺青風格",
    type: "website",
    locale: "zh_TW",
  },
  twitter: {
    card: "summary_large_image",
    title: "INK AR | 刺青虛擬試穿",
    description: "探索刺青藝術，透過 AR 虛擬試穿找到屬於你的刺青風格",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">
        <FittingRoomProvider>
          <Navbar />
          <ScrollToTop />
          <main className="flex-1 pt-16">{children}</main>
          <footer className="border-t border-[#2a2a2a] py-8 text-center text-gray-500 text-sm">
            <p>© 2025 INK AR. All rights reserved.</p>
          </footer>
        </FittingRoomProvider>
      </body>
    </html>
  );
}
