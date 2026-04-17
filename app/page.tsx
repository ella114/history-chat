import Image from "next/image";
import Link from "next/link";

import { CategoryCard } from "@/components/home/category-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { personas, personasByRoleCategory } from "@/lib/data/personas";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const availableCategories = personasByRoleCategory.filter(
    (category) => category.personas.length > 0
  );
  const curatorNotes = [
    "同一个问题交给不同人物，重要的不是答案是否一致，而是他们如何理解问题本身。",
    "政治人物更看局势与责任，思想家更先审问观念，文学家会让情感与时代气氛一起浮现。",
    "这不是“假装复活历史”，而是借人物气质、边界和语言方式，重新组织一次提问。"
  ];

  return (
    <div className="space-y-12">
      <section className="paper-panel rounded-[2rem] border border-border/70 px-6 py-8 shadow-paper sm:px-10 sm:py-12">
        <div className="space-y-6">
          <Badge className="bg-accent text-accent-foreground">众声史谈</Badge>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl leading-tight text-foreground sm:text-5xl">
              穿过时代与立场，去听不同历史人物如何回应今天的问题。
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              这里不是知识卡片的陈列，而是一种进入人物心智的方式。你可以先决定自己想听
              治理者的判断、思想者的辨析、文学家的洞察，还是科学家的方法，再进入相应群像。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex -space-x-3">
              {personas.slice(0, 4).map((persona) => (
                <div
                  key={persona.id}
                  className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-[rgba(252,248,240,0.92)] bg-accent/60 shadow-sm"
                >
                  <Image
                    src={persona.avatar}
                    alt={persona.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              先定视角，再选人物，对话会更快进入状态。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/categories/thinkers" className={cn(buttonVariants({ size: "lg" }))}>
              从思想家开始
            </Link>
            <Link
              href="/categories/writers"
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
            >
              看文学家群像
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-border/60 bg-background/70 p-4 text-sm leading-7 text-foreground/80">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Curatorial Note</p>
              <p className="mt-2">
                同一个问题交给不同人物，重要的不是答案是否一致，而是他们如何理解问题本身。
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-border/60 bg-background/70 p-4 text-sm leading-7 text-foreground/80">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Collection</p>
              <p className="mt-2">
                当前开放 {availableCategories.length} 个分类，收录 {personas.length} 位可进入对话的历史人物。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="paper-panel rounded-[2rem] border border-border/70 px-6 py-6 shadow-paper sm:px-8">
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
            Exhibition Logic
          </p>
          <h2 className="mt-2 text-3xl text-foreground">这不是人物百科，而是一组可比较的“回应方式”</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {curatorNotes.map((note) => (
              <div
                key={note}
                className="rounded-[1.4rem] border border-border/60 bg-background/70 px-4 py-4 text-sm leading-7 text-muted-foreground"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
              Categories
            </p>
            <h2 className="mt-2 text-3xl text-foreground">从一种视角进入历史</h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            有的分类更擅长回答秩序与权力，有的更贴近心性、创造、苦难与意义。
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {personasByRoleCategory.map((category) => (
            <CategoryCard
              key={category.slug}
              category={category}
              personas={category.personas}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
