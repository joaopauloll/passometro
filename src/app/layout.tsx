import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Passômetro — Enfermaria de Ortopedia",
  description: "Sistema de gerenciamento da enfermaria de ortopedia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans bg-slate-50 min-h-screen antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

