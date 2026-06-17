import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CopyableInputProps {
  value: string | null | undefined;
  className?: string;
  multiline?: boolean;
  rows?: number;
}

export function CopyableInput({ value, className, multiline = false, rows = 2 }: CopyableInputProps) {
  const handleCopy = async () => {
    if (value) {
      await navigator.clipboard.writeText(value);
      toast.success("Copiado para a área de transferência");
    }
  };

  const handleSelect = (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    target.select();
  };

  const baseClassName = cn(
    "bg-muted cursor-text select-all pr-8",
    className
  );

  if (multiline) {
    return (
      <div className="relative">
        <Textarea
          value={value ?? ""}
          readOnly
          rows={rows}
          className={baseClassName}
          onClick={handleSelect}
        />
        {value && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-2 top-2 p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        value={value ?? ""}
        readOnly
        className={baseClassName}
        onClick={handleSelect}
      />
      {value && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors"
        >
          <Copy className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
