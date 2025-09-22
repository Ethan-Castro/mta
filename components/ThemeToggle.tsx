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
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeSelector();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show fallback until client-side hydration is complete
  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-foreground/10 bg-background/80 px-2.5 py-1.5 text-xs shadow-sm sm:gap-2 sm:px-3">
        <PaletteIcon className="size-3.5 text-foreground/60 sm:size-4" aria-hidden="true" />
        <div className="text-xs font-medium text-foreground">Theme</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-foreground/10 bg-background/80 px-2.5 py-1.5 text-xs shadow-sm sm:gap-2 sm:px-3">
      <PaletteIcon className="size-3.5 text-foreground/60 sm:size-4" aria-hidden="true" />
      <Select value={theme} onValueChange={(value) => setTheme(value as typeof theme)}>
        <SelectTrigger size="sm" className="border-none bg-transparent px-0 py-0 text-xs font-medium text-foreground">
          <SelectValue aria-label={`Switch theme (currently ${theme})`}>
            {themeOptions.find((option) => option.value === theme)?.label ?? "Theme"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[12rem] sm:min-w-[14rem]">
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
