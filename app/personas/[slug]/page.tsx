import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  personaMap,
  personas,
  personaRoleCategoryLabelMap
} from "@/lib/data/personas";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return personas.map((persona) => ({
    slug: persona.slug
  }));
}

export default function PersonaDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const persona = personaMap.get(params.slug);

  if (!persona) {
    notFound();
  }

  const roleCategory = personaRoleCategoryLabelMap.get(persona.roleCategory);
  const framingNotes = [
    `如果把同一个问题交给 ${persona.name}，这位人物更可能先从 ${persona.styleKeywords.slice(0, 2).join(" 与 ")} 进入。`,
    `${persona.name} 的回答不会追求面面俱到，而会把你带向其最在意的判断尺度。`
  ];
  const firstQuestion = persona.suggestedQuestions[0];
  const secondQuestion = persona.suggestedQuestions[1];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="paper-panel relative overflow-hidden rounded-[2rem] border border-border/70 p-8 shadow-paper sm:p-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(196,169,118,0.22),transparent_58%)]" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative h-24 w-24 overflow-hidden rounded-[1.5rem] border border-border/70 bg-accent/50">
            <Image
              src={persona.avatar}
              alt={persona.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
                Character Sheet
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge>{persona.roleCategory}</Badge>
                <Badge variant="secondary">{persona.category}</Badge>
                <Badge variant="secondary">{persona.era}</Badge>
              </div>
              <h1 className="text-4xl text-foreground">{persona.name}</h1>
              <p className="max-w-2xl text-lg leading-8 text-foreground/88">
                {persona.shortBio}
              </p>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                {persona.longBio}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {roleCategory ? (
                <Link
                  href={`/categories/${roleCategory.slug}`}
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                >
                  返回{roleCategory.label}
                </Link>
              ) : null}
              <Link
                href={`/chat/${persona.slug}`}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                开始聊天
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.7rem] border border-border/70 bg-[rgba(255,250,242,0.8)] p-6">
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
              Curatorial Reading
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-foreground/85">
              {framingNotes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
            <div className="mt-5 rounded-[1.4rem] border border-border/60 bg-background/75 px-4 py-4 text-sm leading-7 text-muted-foreground">
              适合从一个足够具体的处境开始提问，例如一段关系、一次失败、一次犹疑，或者一个无法回避的选择。
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl">这场对话的气质</h2>
              <div className="flex flex-wrap gap-3">
                {persona.styleKeywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="px-3 py-1.5 text-sm">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl">可以从这里切入</h2>
              <ul className="space-y-3 text-sm leading-7 text-foreground/85">
                {persona.suggestedQuestions.slice(0, 4).map((question) => (
                  <li
                    key={question}
                    className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3"
                  >
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl">如果你把问题交给这个人</h2>
            <div className="rounded-[1.5rem] border border-border/60 bg-background/70 px-5 py-4 text-sm leading-7 text-muted-foreground">
              {firstQuestion}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl">另一条入口</h2>
            <div className="rounded-[1.5rem] border border-border/60 bg-background/70 px-5 py-4 text-sm leading-7 text-muted-foreground">
              {secondQuestion}
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <Card className="paper-panel border-border/70">
          <CardHeader>
            <CardTitle>人物边界</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            {persona.safetyBoundary.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </CardContent>
        </Card>

        <Card className="paper-panel border-border/70">
          <CardHeader>
            <CardTitle>免责声明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">
            {persona.disclaimer}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
