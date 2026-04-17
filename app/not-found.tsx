import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="paper-panel mx-auto mt-16 max-w-2xl rounded-[2rem] border border-border/70 px-8 py-12 text-center shadow-paper">
      <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-4 text-4xl">没有找到这个人物或会话。</h1>
      <p className="mx-auto mt-4 max-w-lg text-base leading-8 text-muted-foreground">
        你可以返回首页重新选择分类与人物，或从历史记录继续之前的对话。
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          返回首页
        </Link>
        <Link
          href="/history"
          className={cn(buttonVariants({ variant: "secondary" }))}
        >
          查看历史
        </Link>
      </div>
    </div>
  );
}
