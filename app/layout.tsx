import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AuthProvider } from "@/components/providers/auth-provider";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const metadataBase = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL)
  : undefined;

export const metadata: Metadata = {
  metadataBase,
  title: "众声史谈",
  description: "与历史人物展开一场克制、真实感强、保留边界的文字对话。",
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <div className="grain min-h-screen">
            <SiteHeader />
            <main className="mx-auto w-full max-w-7xl px-6 pb-16 pt-6 sm:px-10">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
