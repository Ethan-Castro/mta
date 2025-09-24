import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  variant?: "card" | "text" | "chart";
}

export default function LoadingSkeleton({ className, lines = 3, variant = "text" }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={cn("space-y-3 animate-pulse", className)}>
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
        <div className="h-20 bg-muted rounded"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-muted rounded w-16"></div>
          <div className="h-8 bg-muted rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div className={cn("space-y-2 animate-pulse", className)}>
        <div className="h-4 bg-muted rounded w-1/3"></div>
        <div className="h-40 bg-muted rounded"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-muted rounded w-12"></div>
          <div className="h-3 bg-muted rounded w-12"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2 animate-pulse", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-3 bg-muted rounded",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  );
}
