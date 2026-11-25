import { useState } from "react";
import { Leaf, Monitor, Moon, Sun, Waves, Palette, Snowflake, Flower2 } from "lucide-react";
import { AppearanceDialog } from "@/components/AppearanceDialog";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const { setTheme, theme, resolvedTheme } = useTheme();
  const ThemeIcon = theme === "lavanda" ? Flower2 : theme === "artico" ? Snowflake : theme === "oceano" ? Waves : theme === "holst" ? Leaf : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Alternar tema">
          <ThemeIcon className="h-5 w-5" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light" className="gap-2">
            <Sun className="h-4 w-4" /> Claro
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="gap-2">
            <Moon className="h-4 w-4" /> Escuro
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="holst" className="gap-2">
            <Leaf className="h-4 w-4" /> Holst
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oceano" className="gap-2">
            <Waves className="h-4 w-4" /> Oceano
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="artico" className="gap-2">
            <Snowflake className="h-4 w-4" /> Ártico
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="lavanda" className="gap-2">
            <Flower2 className="h-4 w-4" /> Lavanda
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="gap-2">
            <Monitor className="h-4 w-4" /> Sistema
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" onSelect={() => setAppearanceOpen(true)}>
          <Palette className="h-4 w-4" /> Personalizar cores
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} />
    </>
  );
}
