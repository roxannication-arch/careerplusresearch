import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AppFrame } from "@/components/AppFrame";
import { BudgetProvider } from "@/components/BudgetProvider";
import { PwaRegister } from "@/components/PwaRegister";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Семейный бюджет",
  description: "Планирование доходов, трат и покетов",
  applicationName: "Семейный бюджет",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Семейный бюджет",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full">
        <BudgetProvider>
          <PwaRegister />
          <AppFrame>{children}</AppFrame>
        </BudgetProvider>
      </body>
    </html>
  );
}
