"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { findTerm, getPlainLanguage, type GlossaryTerm } from "@/lib/glossary";
import { HelpCircleIcon, InfoIcon } from "lucide-react";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

interface SmartTooltipProps {
  termId?: string;
  technicalTerm?: string;
  plainText?: string;
  explanation?: string;
  example?: string;
  children: React.ReactNode;
  showIcon?: boolean;
  iconType?: 'help' | 'info';
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function SmartTooltip({
  termId,
  technicalTerm,
  plainText,
  explanation,
  example,
  children,
  showIcon = false,
  iconType = 'help',
  className,
  side = 'top',
  ...props
}: SmartTooltipProps) {
  let term: GlossaryTerm | undefined;
  let displayPlainText = plainText;
  let displayExplanation = explanation;
  let displayExample = example;

  // Look up term in glossary if termId provided
  if (termId) {
    term = findTerm(termId);
    if (term) {
      displayPlainText = displayPlainText || term.plain;
      displayExplanation = displayExplanation || term.explanation;
      displayExample = displayExample || term.example;
    }
  }

  // Fallback to plain language lookup if technicalTerm provided
  if (!displayPlainText && technicalTerm) {
    displayPlainText = getPlainLanguage(technicalTerm);
  }

  const Icon = iconType === 'info' ? InfoIcon : HelpCircleIcon;

  if (!displayExplanation && !displayPlainText) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 cursor-help underline decoration-dotted decoration-foreground/40 hover:decoration-foreground/70 transition-colors",
              className
            )}
          >
            {children}
            {showIcon && (
              <Icon className="inline size-3.5 text-foreground/60 hover:text-foreground/80" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-sm p-3 bg-card border border-border/60 text-foreground shadow-lg"
        >
          <div className="space-y-2">
            {displayPlainText && (
              <div className="font-semibold text-sm text-primary">
                {displayPlainText}
              </div>
            )}
            {displayExplanation && (
              <div className="text-sm leading-relaxed">
                {displayExplanation}
              </div>
            )}
            {displayExample && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 border-l-2 border-primary/30">
                <span className="font-medium">Example:</span> {displayExample}
              </div>
            )}
            {term?.category && (
              <div className="text-xs text-muted-foreground border-t border-border/40 pt-1 capitalize">
                {term.category}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Convenience component for quick jargon replacement
interface JargonTermProps {
  termId: string;
  showTechnical?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function JargonTerm({
  termId,
  showTechnical = false,
  showIcon = true,
  className
}: JargonTermProps) {
  const term = findTerm(termId);

  if (!term) {
    return <span className="text-destructive">Unknown term: {termId}</span>;
  }

  return (
    <SmartTooltip
      termId={termId}
      showIcon={showIcon}
      className={className}
    >
      {showTechnical ? term.technical : term.plain}
    </SmartTooltip>
  );
}

// Helper component for inline explanations without tooltips
interface PlainLanguageProps {
  termId: string;
  showBoth?: boolean;
  separator?: string;
  className?: string;
}

export function PlainLanguage({
  termId,
  showBoth = false,
  separator = " - ",
  className
}: PlainLanguageProps) {
  const term = findTerm(termId);

  if (!term) {
    return <span className="text-destructive">Unknown term: {termId}</span>;
  }

  return (
    <span className={className}>
      {showBoth ? (
        <>
          <span className="font-medium">{term.plain}</span>
          <span className="text-muted-foreground text-sm">
            {separator}{term.technical}
          </span>
        </>
      ) : (
        term.plain
      )}
    </span>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };