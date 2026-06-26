import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyCafé — Site Kafe Yönetimi",
  description: "Site kafe yönetim sistemi — menü, sipariş, stok, finans",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
