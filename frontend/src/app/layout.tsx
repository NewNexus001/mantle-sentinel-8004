import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mantle Sentinel-8004 | DeFi Guardian Dashboard",
  description:
    "ERC-8004 Compliant Autonomous DeFi Guardian — Turing Test Hackathon 2026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
