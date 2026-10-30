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
  title: "PROJECT DAEDALUS — Hypersonic Reentry & GNC Flight Supervisor",
  description:
    "Real-time hypersonic reentry aerothermodynamics simulation: 3-DOF entry flight dynamics, Sutton-Graves stagnation heating, plasma blackout, GNC autopilot with bank-angle modulation, LEO deorbit / Apollo lunar return / Mars aerocapture / Mach 16 waverider missions.",
  keywords: [
    "hypersonic",
    "reentry",
    "aerothermodynamics",
    "GNC",
    "trajectory simulation",
    "aerocapture",
    "waverider",
    "plasma blackout",
  ],
};

export const viewport: Viewport = {
  themeColor: "#04070d",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#04070d] text-zinc-200 overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
