import Link from "next/link";
import { notFound } from "next/navigation";

import { PersonaCard } from "@/components/home/persona-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { personaRoleCategoryMap, personasByRoleCategory } from "@/lib/data/personas";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return personasByRoleCategory.map((category) => ({
    slug: category.slug
  }));
}

export default function CategoryDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const category = personaRoleCategoryMap.get(params.slug);

  if (!category) {
    notFound();
  }

  const entry = personasByRoleCategory.find((item) => item.slug === params.slug);
  const personas = entry?.personas ?? [];

  return (
    <div className="space-y-8">
      <section className="paper-panel rounded-[2rem] border border-border/70 px-8 py-10 shadow-paper sm:px-10 sm:py-12">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
          Voice Group
        </p>
        <h1 className="mt-3 text-4xl text-foreground">{category.label}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
          {category.longDescription}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-foreground/85">
            当前收录 {personas.length} 位人物
          </span>
          <Link href="/" className={cn(buttonVariants({ variant: "secondary" }))}>
            返回分类首页
          </Link>
        </div>
      </section>

      {personas.length > 0 ? (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
                Personas
              </p>
              <h2 className="mt-2 text-3xl text-foreground">这一组正在等待你的提问</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">
              先看人物气质，再决定你想从谁的眼睛里重新理解问题。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {personas.map((persona) => (
              <PersonaCard key={persona.id} persona={persona} />
            ))}
          </div>
        </section>
      ) : (
        <Card className="paper-panel border-border/70">
          <CardContent className="space-y-4 px-6 py-12 text-center">
            <h2 className="text-2xl text-foreground">这一组人物仍在整理中</h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground">
              你可以先回到首页，从已经开放的群像中进入一场完整对话。
            </p>
            <div>
              <Link href="/" className={cn(buttonVariants())}>
                去看已有分类
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
