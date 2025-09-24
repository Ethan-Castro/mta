"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  AlertCircleIcon,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { createContext, memo, useContext } from "react";

type TaskContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const TaskContext = createContext<TaskContextValue | null>(null);

const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("Task components must be used within Task");
  }
  return context;
};

export type TaskProps = ComponentProps<typeof Collapsible> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const Task = memo(
  ({
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    children,
    ...props
  }: TaskProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });

    return (
      <TaskContext.Provider value={{ isOpen, setIsOpen }}>
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className={cn("not-prose max-w-prose", className)}
          {...props}
        >
          {children}
        </Collapsible>
      </TaskContext.Provider>
    );
  }
);

export type TaskTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  title: string;
  status?: "pending" | "in_progress" | "completed" | "error";
};

export const TaskTrigger = memo(
  ({ className, title, status = "pending", ...props }: TaskTriggerProps) => {
    const { isOpen } = useTask();

    const statusIcon: LucideIcon = (() => {
      switch (status) {
        case "completed":
          return CheckCircleIcon;
        case "in_progress":
          return ClockIcon;
        case "error":
          return AlertCircleIcon;
        default:
          return CircleIcon;
      }
    })();

    const statusStyles = {
      pending: "text-muted-foreground",
      in_progress: "status-info",
      completed: "status-positive",
      error: "status-negative",
    } as const;

    const Icon = statusIcon;

    return (
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-3 rounded-md border border-border/60 bg-background/80 p-3 text-left transition-colors hover:bg-background/90",
          className
        )}
        {...props}
      >
        <Icon className={cn("size-4 flex-shrink-0", statusStyles[status])} />
        <span className="flex-1 font-medium text-sm">{title}</span>
        <ChevronDownIcon
          className={cn(
            "size-4 transition-transform text-muted-foreground",
            isOpen ? "rotate-180" : "rotate-0"
          )}
        />
      </CollapsibleTrigger>
    );
  }
);

export type TaskContentProps = ComponentProps<typeof CollapsibleContent>;

export const TaskContent = memo(
  ({ className, children, ...props }: TaskContentProps) => (
    <CollapsibleContent
      className={cn(
        "mt-2 space-y-2 rounded-md border border-border/40 bg-muted/20 p-3",
        "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
        className
      )}
      {...props}
    >
      {children}
    </CollapsibleContent>
  )
);

export type TaskItemProps = ComponentProps<"div">;

export const TaskItem = memo(
  ({ className, children, ...props }: TaskItemProps) => (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      <div className="size-1.5 rounded-full bg-muted-foreground/40" />
      <span>{children}</span>
    </div>
  )
);

export type TaskItemFileProps = ComponentProps<"div">;

export const TaskItemFile = memo(
  ({ className, children, ...props }: TaskItemFileProps) => (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-2 py-1 text-xs font-mono",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
