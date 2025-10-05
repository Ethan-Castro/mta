"use client";

import { useState, createContext, useContext, ReactNode } from 'react';
import { cn } from "@/lib/utils";
import { EyeIcon, EyeOffIcon, SettingsIcon, GraduationCapIcon, UserIcon, BrainIcon } from "lucide-react";

export type ViewMode = 'simple' | 'detailed' | 'expert';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}

interface ViewModeProviderProps {
  children: ReactNode;
  defaultMode?: ViewMode;
}

export function ViewModeProvider({ children, defaultMode = 'simple' }: ViewModeProviderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

interface ViewModeToggleProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'pills' | 'tabs' | 'dropdown';
}

export function ViewModeToggle({
  className,
  size = 'default',
  variant = 'pills'
}: ViewModeToggleProps) {
  const { viewMode, setViewMode } = useViewMode();

  const modes = [
    {
      key: 'simple' as const,
      label: 'Simple View',
      description: 'Easy to understand for everyone',
      icon: UserIcon
    },
    {
      key: 'detailed' as const,
      label: 'Detailed View',
      description: 'More information and context',
      icon: GraduationCapIcon
    },
    {
      key: 'expert' as const,
      label: 'Expert Mode',
      description: 'All technical details',
      icon: BrainIcon
    }
  ];

  if (variant === 'pills') {
    return (
      <div className={cn("flex items-center gap-1 rounded-lg bg-muted/50 p-1", className)}>
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = viewMode === mode.key;

          return (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                size === 'sm' && "px-2 py-1 text-xs",
                size === 'lg' && "px-4 py-2 text-base",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              )}
              title={mode.description}
            >
              <Icon className={cn(
                "size-4",
                size === 'sm' && "size-3",
                size === 'lg' && "size-5"
              )} />
              <span className="hidden sm:inline">{mode.label.split(' ')[0]}</span>
              <span className="sm:hidden">{mode.key}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'tabs') {
    return (
      <div className={cn("border-b border-border", className)}>
        <nav className="flex space-x-8">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.key;

            return (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {mode.label}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return null;
}

// Content components that respond to view mode
interface ProgressiveContentProps {
  children: ReactNode;
  mode: ViewMode | ViewMode[];
  className?: string;
}

export function ProgressiveContent({ children, mode, className }: ProgressiveContentProps) {
  const { viewMode } = useViewMode();

  const shouldShow = Array.isArray(mode)
    ? mode.includes(viewMode)
    : viewMode === mode;

  if (!shouldShow) return null;

  return <div className={className}>{children}</div>;
}

// Specific content wrappers
export function SimpleContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ProgressiveContent mode="simple" className={className}>
      {children}
    </ProgressiveContent>
  );
}

export function DetailedContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ProgressiveContent mode={['detailed', 'expert']} className={className}>
      {children}
    </ProgressiveContent>
  );
}

export function ExpertContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ProgressiveContent mode="expert" className={className}>
      {children}
    </ProgressiveContent>
  );
}

// Enhanced metric display that adapts to view mode
interface AdaptiveMetricProps {
  title: string;
  simpleValue: string;
  simpleDescription: string;
  detailedValue?: string;
  detailedDescription?: string;
  expertValue?: string;
  expertDescription?: string;
  technicalDetails?: ReactNode;
  className?: string;
}

export function AdaptiveMetric({
  title,
  simpleValue,
  simpleDescription,
  detailedValue,
  detailedDescription,
  expertValue,
  expertDescription,
  technicalDetails,
  className
}: AdaptiveMetricProps) {
  const { viewMode } = useViewMode();

  const getValue = () => {
    switch (viewMode) {
      case 'expert':
        return expertValue || detailedValue || simpleValue;
      case 'detailed':
        return detailedValue || simpleValue;
      default:
        return simpleValue;
    }
  };

  const getDescription = () => {
    switch (viewMode) {
      case 'expert':
        return expertDescription || detailedDescription || simpleDescription;
      case 'detailed':
        return detailedDescription || simpleDescription;
      default:
        return simpleDescription;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
        <div className="text-2xl font-bold">{getValue()}</div>
        <p className="text-sm text-muted-foreground">{getDescription()}</p>
      </div>

      <ExpertContent>
        {technicalDetails && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border/40">
            {technicalDetails}
          </div>
        )}
      </ExpertContent>
    </div>
  );
}

// View mode indicator for user awareness
export function ViewModeIndicator({ className }: { className?: string }) {
  const { viewMode } = useViewMode();

  const modeConfig = {
    simple: { label: 'Simple View', color: 'bg-green-500', description: 'Showing simplified explanations' },
    detailed: { label: 'Detailed View', color: 'bg-blue-500', description: 'Showing additional context' },
    expert: { label: 'Expert Mode', color: 'bg-purple-500', description: 'Showing all technical details' }
  };

  const config = modeConfig[viewMode];

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <div className={cn("size-2 rounded-full", config.color)} />
      <span>{config.label}</span>
      <span className="hidden sm:inline">- {config.description}</span>
    </div>
  );
}