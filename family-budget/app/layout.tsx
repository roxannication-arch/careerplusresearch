import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppFrame } from "@/components/AppFrame";
import { BudgetProvider } from "@/components/BudgetProvider";
import { PwaRegister } from "@/components/PwaRegister";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Budget",
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
    <html lang="ru" className="h-full antialiased">
      <body className={`${inter.className} min-h-full`}>
        <BudgetProvider>
          <PwaRegister />
          <AppFrame>{children}</AppFrame>
        </BudgetProvider>
      </body>
    </html>
  );
}
