"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

export function AuthStatus() {
  const router = useRouter();
  const { enabled, loading, user, signOut } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const username =
    typeof user?.user_metadata?.username === "string"
      ? user.user_metadata.username
      : null;
  const email = user?.email;

  if (!enabled) {
    return <div className="text-xs text-muted-foreground">访客模式</div>;
  }

  if (loading) {
    return <div className="text-xs text-muted-foreground">检查登录状态中...</div>;
  }

  if (!user) {
    return (
      <Link
        href="/auth"
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
      >
        登录
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="max-w-[220px] truncate text-sm text-foreground/85">
          {username ?? email}
        </p>
        {username && email ? (
          <p className="max-w-[220px] truncate text-xs text-muted-foreground">{email}</p>
        ) : null}
      </div>
      <button
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        disabled={isSubmitting}
        onClick={async () => {
          setIsSubmitting(true);

          try {
            await signOut();
            router.refresh();
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        退出
      </button>
    </div>
  );
}
