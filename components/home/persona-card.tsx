import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Persona } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PersonaCard({ persona }: { persona: Persona }) {
  return (
    <Card className="paper-panel h-full overflow-hidden border-border/70 transition duration-300 hover:-translate-y-1 hover:shadow-paper">
      <CardHeader className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{persona.roleCategory}</Badge>
              <Badge variant="secondary">{persona.category}</Badge>
              <Badge variant="secondary">{persona.era}</Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl text-foreground">{persona.name}</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {persona.shortBio}
              </p>
            </div>
          </div>

          <div className="relative h-20 w-20 overflow-hidden rounded-[1.4rem] border border-border/70 bg-accent/60">
            <Image
              src={persona.avatar}
              alt={persona.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground/80">
        <div className="flex flex-wrap gap-2">
          {persona.styleKeywords.slice(0, 3).map((keyword) => (
            <span
              key={keyword}
              className="rounded-full bg-accent/80 px-3 py-1 text-xs text-accent-foreground"
            >
              {keyword}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex gap-3">
        <Link
          href={`/personas/${persona.slug}`}
          className={cn(buttonVariants({ variant: "secondary" }), "flex-1")}
        >
          查看详情
        </Link>
        <Link href={`/chat/${persona.slug}`} className={cn(buttonVariants(), "flex-1")}>
          开始对话
        </Link>
      </CardFooter>
    </Card>
  );
}
