import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "ELEMENTA — Research-Grade Interactive Periodic Table",
  description:
    "Interactive periodic table of all 118 elements with animated 2D and 3D Bohr models, orbital block visualization, periodic trend charts, and reference-grade atomic, physical and discovery data.",
  keywords: [
    "periodic table",
    "Bohr model",
    "3D atom",
    "electron shells",
    "chemistry",
    "elements",
    "ionization energy",
    "electronegativity",
    "periodic trends",
  ],
};

export const viewport: Viewport = {
  themeColor: "#070a10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#070a10] text-zinc-200 overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
