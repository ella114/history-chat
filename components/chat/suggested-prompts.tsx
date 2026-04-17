import { Button } from "@/components/ui/button";

export function SuggestedPrompts({
  prompts,
  onSelect
}: {
  prompts: string[];
  onSelect: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {prompts.map((prompt) => (
        <Button
          key={prompt}
          variant="secondary"
          className="h-auto whitespace-normal px-4 py-3 text-left leading-6"
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
}
