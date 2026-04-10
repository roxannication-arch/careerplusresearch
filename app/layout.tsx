import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerPlus Research Generator",
  description: "Generate structured US market research reports for clients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
