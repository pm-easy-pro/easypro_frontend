import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { AntdProvider } from "@/providers/AntdProvider";
import { AuthProvider } from "@/providers/AuthProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "EasyPro — Үл хөдлөх хөрөнгийн платформ",
  description: "Монголын премиум үл хөдлөх хөрөнгийн зар, хайлт, шүүлтүүр",
  icons: {
    icon: [{ url: "/logo-mark.png", type: "image/png" }],
    apple: [{ url: "/logo-mark.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" className="h-full">
      <body className="min-h-full antialiased">
        <AntdProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </AntdProvider>
      </body>
    </html>
  );
}
