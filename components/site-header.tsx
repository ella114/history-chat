"use client";

import Link from "next/link";

import { AuthStatus } from "@/components/auth/auth-status";

export function SiteHeader() {
  return (
    <header className="border-b border-border/60 bg-[rgba(252,248,240,0.72)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4 sm:px-10 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-lg text-foreground">
            史
          </div>
          <div>
            <p className="hidden text-sm uppercase tracking-[0.28em] text-muted-foreground sm:block">
              Echoes Of History
            </p>
            <p className="text-sm text-foreground/85">众声史谈</p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <Link href="/history" className="transition hover:text-foreground">
            聊天记录
          </Link>
          <AuthStatus />
        </nav>
      </div>
    </header>
  );
}
