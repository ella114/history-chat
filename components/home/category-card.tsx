import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Persona, PersonaRoleCategoryMeta } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: PersonaRoleCategoryMeta;
  personas: Persona[];
}

export function CategoryCard({ category, personas }: CategoryCardProps) {
  const hasPersonas = personas.length > 0;

  return (
    <Card className="paper-panel h-full overflow-hidden border-border/70 transition duration-300 hover:-translate-y-1 hover:shadow-paper">
      <CardHeader className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
              Voice Group
            </p>
            <div className="space-y-2">
              <h3 className="text-3xl text-foreground">{category.label}</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {category.shortDescription}
              </p>
            </div>
          </div>

          <div className="rounded-full border border-border/70 bg-accent/80 px-3 py-1 text-xs text-accent-foreground">
            {hasPersonas ? `${personas.length} 位人物` : "即将补充"}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm leading-7 text-foreground/80">{category.longDescription}</p>

        {hasPersonas ? (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {personas.slice(0, 4).map((persona) => (
                <div
                  key={persona.id}
                  className="relative h-12 w-12 overflow-hidden rounded-2xl border-2 border-[rgba(252,248,240,0.92)] bg-accent/60 shadow-sm"
                >
                  <Image
                    src={persona.avatar}
                    alt={persona.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ))}
            </div>
            <div className="text-sm leading-7 text-muted-foreground">
              {personas
                .slice(0, 3)
                .map((persona) => persona.name)
                .join("、")}
              {personas.length > 3 ? " 等人物" : ""}
            </div>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/60 px-4 py-4 text-sm leading-7 text-muted-foreground">
            这一组人物仍在整理中，暂时还不能进入对话。
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Link
          href={`/categories/${category.slug}`}
          className={cn(buttonVariants({ variant: hasPersonas ? "default" : "secondary" }), "w-full")}
        >
          {hasPersonas ? "进入分类" : "查看分类"}
        </Link>
      </CardFooter>
    </Card>
  );
}
