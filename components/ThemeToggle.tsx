"use client";

import { PaletteIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useThemeSelector, themeOptions } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeSelector();

  return (
    <div className="flex items-center gap-2 rounded-full border border-foreground/10 bg-background/80 px-3 py-1.5 text-xs shadow-sm">
      <PaletteIcon className="size-4 text-foreground/60" aria-hidden="true" />
      <Select value={theme} onValueChange={(value) => setTheme(value as typeof theme)}>
        <SelectTrigger size="sm" className="border-none bg-transparent px-0 py-0 text-xs font-medium text-foreground">
          <SelectValue aria-label={`Switch theme (currently ${theme})`}>
            {themeOptions.find((option) => option.value === theme)?.label ?? "Theme"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[14rem]">
          {themeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
