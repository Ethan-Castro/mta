"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";
import { 
  CopyIcon, 
  DownloadIcon, 
  EditIcon, 
  ShareIcon 
} from "lucide-react";
import Sparkline from "@/components/charts/Sparkline";
import MultiLine from "@/components/charts/MultiLine";
import GroupedBar from "@/components/charts/GroupedBar";
import BarChartBasic from "@/components/charts/BarChartBasic";
import PieChartBasic from "@/components/charts/PieChartBasic";
import MapPanel from "@/components/MapPanel";
import ErrorBoundary from "@/components/ErrorBoundary";
import ChartErrorFallback from "@/components/ChartErrorFallback";
import { CodeBlock, CodeBlockCopyButton } from "@/components/ai-elements/code-block";
import { BRAND_PRIMARY_HEX } from "@/lib/ui/colors";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@/components/ai-elements/task";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
} from "@/components/ai-elements/chain-of-thought";
import {
  Actions,
  Action,
} from "@/components/ai-elements/actions";
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent,
} from "@/components/ai-elements/artifact";
import {
  Branch,
  BranchMessages,
  BranchSelector,
  BranchPrevious,
  BranchNext,
  BranchPage,
} from "@/components/ai-elements/branch";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

type ResponseProps = ComponentProps<typeof Streamdown>;

// Custom component to handle visualization tags
function VisualizationRenderer({ spec, data }: { spec: any; data: any }) {
  return (
    <ErrorBoundary fallback={ChartErrorFallback}>
      {(() => {
        if (spec?.type === "line") {
          const points = Array.isArray(data)
            ? data.map((d: any) => ({ label: String(d.label ?? ""), value: Number(d.value ?? 0) }))
            : [];
          return (
            <div role="img" aria-label={spec?.title || "Line chart"}>
              <Sparkline data={points} height={220} />
            </div>
          );
        }
        if (spec?.type === "multi-line") {
          const rows = Array.isArray(data) ? data : [];
          const series = Array.isArray(spec?.series) ? spec.series : [];
          const marker = spec?.marker ?? null;
          return (
            <div role="img" aria-label={spec?.title || "Multi-line chart"}>
              <MultiLine data={rows} series={series} height={260} yLabel={spec?.yLabel} marker={marker} />
            </div>
          );
        }
        if (spec?.type === "grouped-bar") {
          const rows = Array.isArray(data)
            ? data.map((d: any) => ({
                name: String(d.name ?? d.label ?? ""),
                violations: Number(d.violations ?? d.value ?? 0),
                exempt: Number(d.exempt ?? 0),
              }))
            : [];
          return (
            <div role="img" aria-label={spec?.title || "Grouped bar chart"}>
              <GroupedBar data={rows} height={260} />
            </div>
          );
        }
        if (spec?.type === "bar") {
          const rows = Array.isArray(data)
            ? data.map((d: any) => ({ label: String(d.label ?? d.name ?? ""), value: Number(d.value ?? d.count ?? 0) }))
            : [];
          return (
            <div role="img" aria-label={spec?.title || "Bar chart"}>
              <BarChartBasic data={rows} height={240} yLabel={spec?.yLabel || "Count"} />
            </div>
          );
        }
        if (spec?.type === "pie") {
          const rows = Array.isArray(data)
            ? data.map((d: any) => ({ label: String(d.label ?? d.name ?? ""), value: Number(d.value ?? d.count ?? 0) }))
            : [];
          return (
            <div role="img" aria-label={spec?.title || "Pie chart"}>
              <PieChartBasic data={rows} height={240} />
            </div>
          );
        }
        if (spec?.type === "map") {
          const markers = Array.isArray(data)
            ? data.map((d: any) => ({
                id: String(d.id ?? `${d.longitude},${d.latitude}`),
                longitude: Number(d.longitude ?? d.lng ?? d.lon ?? 0),
                latitude: Number(d.latitude ?? d.lat ?? 0),
                color: d.color || BRAND_PRIMARY_HEX,
                title: d.title,
                description: d.description,
                href: d.href,
              }))
            : [];
          const center: [number, number] | undefined = Array.isArray(spec?.center) && spec.center.length === 2
            ? [Number(spec.center[0]), Number(spec.center[1])] as [number, number]
            : undefined;
          return (
            <div className="space-y-2" role="img" aria-label={spec?.title || "Map visualization"}>
              {spec?.title && <div className="text-sm font-medium text-foreground">{spec.title}</div>}
              <MapPanel
                height={320}
                markers={markers}
                center={center}
                zoom={Number(spec?.zoom ?? 10)}
                cluster={spec?.cluster ?? true}
                hoverPopups
              />
            </div>
          );
        }
        return null;
      })()}
    </ErrorBoundary>
  );
}

// Custom component to handle artifact tool output
function ArtifactRenderer({ artifact }: { artifact: any }) {
  const getIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'copy':
        return CopyIcon;
      case 'download':
        return DownloadIcon;
      case 'edit':
        return EditIcon;
      case 'share':
        return ShareIcon;
      default:
        return CopyIcon;
    }
  };

  const handleActionClick = (action: any) => {
    if (action.label?.toLowerCase().includes('copy')) {
      navigator.clipboard?.writeText(artifact.content);
    }
    // Add more action handlers as needed
  };

  return (
    <Artifact>
      <ArtifactHeader>
        <div>
          <ArtifactTitle>{artifact.title}</ArtifactTitle>
          {artifact.description && (
            <ArtifactDescription>{artifact.description}</ArtifactDescription>
          )}
        </div>
        {artifact.actions && artifact.actions.length > 0 && (
          <ArtifactActions>
            {artifact.actions.map((action: any, index: number) => {
              const IconComponent = getIcon(action.icon);
              return (
                <ArtifactAction
                  key={index}
                  icon={IconComponent}
                  label={action.label}
                  tooltip={action.tooltip}
                  onClick={() => handleActionClick(action)}
                />
              );
            })}
          </ArtifactActions>
        )}
      </ArtifactHeader>
      <ArtifactContent>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {artifact.content}
        </div>
      </ArtifactContent>
    </Artifact>
  );
}

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      components={{
        visualization: VisualizationRenderer,
        results: VisualizationRenderer,
        artifact: ArtifactRenderer,
        
        // Task components - handle both lowercase HTML tags and PascalCase components
        task: Task,
        tasks: ({ children, ...props }: any) => <Task {...props}>{children}</Task>, // Handle plural form with proper wrapper
        tasktrigger: TaskTrigger,
        taskcontent: TaskContent,
        taskitem: TaskItem,
        taskitemfile: TaskItemFile,
        Task: Task,
        Tasks: ({ children, ...props }: any) => <Task {...props}>{children}</Task>, // Handle plural form with proper wrapper
        TaskTrigger: TaskTrigger,
        TaskContent: TaskContent,
        TaskItem: TaskItem,
        TaskItemFile: TaskItemFile,

        // Chain of Thought components - handle both lowercase HTML tags and PascalCase components
        chainofthought: ChainOfThought,
        chainofthoughtheader: ChainOfThoughtHeader,
        chainofthoughtcontent: ChainOfThoughtContent,
        chainofthoughtstep: ChainOfThoughtStep,
        chainofthoughtsearchresults: ChainOfThoughtSearchResults,
        chainofthoughtsearchresult: ChainOfThoughtSearchResult,
        ChainOfThought: ChainOfThought,
        ChainOfThoughtHeader: ChainOfThoughtHeader,
        ChainOfThoughtContent: ChainOfThoughtContent,
        ChainOfThoughtStep: ChainOfThoughtStep,
        ChainOfThoughtSearchResults: ChainOfThoughtSearchResults,
        ChainOfThoughtSearchResult: ChainOfThoughtSearchResult,

        // Actions components - handle both lowercase HTML tags and PascalCase components
        actions: Actions,
        action: Action,
        Actions: Actions,
        Action: Action,

        // Artifact components
        artifact: Artifact,
        artifactheader: ArtifactHeader,
        artifacttitle: ArtifactTitle,
        artifactdescription: ArtifactDescription,
        artifactactions: ArtifactActions,
        artifactaction: ArtifactAction,
        artifactcontent: ArtifactContent,
        Artifact: Artifact,
        ArtifactHeader: ArtifactHeader,
        ArtifactTitle: ArtifactTitle,
        ArtifactDescription: ArtifactDescription,
        ArtifactActions: ArtifactActions,
        ArtifactAction: ArtifactAction,
        ArtifactContent: ArtifactContent,

        // Branch components
        branch: Branch,
        branchmessages: BranchMessages,
        branchselector: BranchSelector,
        branchprevious: BranchPrevious,
        branchnext: BranchNext,
        branchpage: BranchPage,
        Branch: Branch,
        BranchMessages: BranchMessages,
        BranchSelector: BranchSelector,
        BranchPrevious: BranchPrevious,
        BranchNext: BranchNext,
        BranchPage: BranchPage,

        // Sources components
        sources: Sources,
        sourcestrigger: SourcesTrigger,
        sourcescontent: SourcesContent,
        source: Source,
        Sources: Sources,
        SourcesTrigger: SourcesTrigger,
        SourcesContent: SourcesContent,
        Source: Source,

        // Tool components
        tool: Tool,
        toolheader: ToolHeader,
        toolcontent: ToolContent,
        toolinput: ToolInput,
        tooloutput: ToolOutput,
        Tool: Tool,
        ToolHeader: ToolHeader,
        ToolContent: ToolContent,
        ToolInput: ToolInput,
        ToolOutput: ToolOutput,

        // Headings
        h1: (p: any) => (
          <h1
            {...p}
            className={cn(
              "mt-6 scroll-m-20 text-2xl font-bold tracking-tight first:mt-0",
              p.className
            )}
          />
        ),
        h2: (p: any) => (
          <h2
            {...p}
            className={cn(
              "mt-6 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0",
              p.className
            )}
          />
        ),
        h3: (p: any) => (
          <h3
            {...p}
            className={cn(
              "mt-5 scroll-m-20 text-lg font-semibold",
              p.className
            )}
          />
        ),
        h4: (p: any) => (
          <h4
            {...p}
            className={cn("mt-4 text-base font-semibold", p.className)}
          />
        ),

        // Paragraphs
        p: (p: any) => (
          <p
            {...p}
            className={cn("leading-7 [&:not(:first-child)]:mt-4", p.className)}
          />
        ),

        // Lists
        ul: (p: any) => (
          <ul
            {...p}
            className={cn(
              "my-4 ml-6 list-disc space-y-2 marker:text-muted-foreground",
              p.className
            )}
          />
        ),
        ol: (p: any) => (
          <ol
            {...p}
            className={cn(
              "my-4 ml-6 list-decimal space-y-2 marker:text-muted-foreground",
              p.className
            )}
          />
        ),
        li: (p: any) => <li {...p} className={cn("leading-7", p.className)} />,

        // Blockquotes / callouts
        blockquote: (p: any) => (
          <blockquote
            {...p}
            className={cn(
              "mt-4 border-l-2 border-border pl-3 text-muted-foreground",
              p.className
            )}
          />
        ),

        // Horizontal rule
        hr: (p: any) => (
          <hr
            {...p}
            className={cn("my-6 border-border/70", p.className)}
          />
        ),

        // Links
        a: (p: any) => (
          <a
            {...p}
            rel={p.rel ?? "noreferrer noopener"}
            target={p.target ?? "_blank"}
            className={cn(
              "font-medium text-primary underline underline-offset-4",
              p.className
            )}
          />
        ),

        // Tables
        table: (p: any) => (
          <div className="my-4 overflow-x-auto">
            <table
              {...p}
              className={cn(
                "w-full border-collapse text-sm",
                p.className
              )}
            />
          </div>
        ),
        thead: (p: any) => (
          <thead {...p} className={cn("bg-muted/50", p.className)} />
        ),
        tbody: (p: any) => <tbody {...p} className={cn(p.className)} />,
        tr: (p: any) => (
          <tr
            {...p}
            className={cn("border-b border-border/60 last:border-0", p.className)}
          />
        ),
        th: (p: any) => (
          <th
            {...p}
            className={cn(
              "px-3 py-2 text-left font-semibold text-foreground",
              p.className
            )}
          />
        ),
        td: (p: any) => (
          <td {...p} className={cn("px-3 py-2 align-top", p.className)} />
        ),

        // Inline and fenced code
        code: (p: any) => {
          const className: string = p.className || "";
          const children = p.children ?? "";
          const match = /language-([\w-]+)/.exec(className);
          const content = typeof children === "string" ? children : String(children);

          if (match) {
            const lang = match[1];
            return (
              <CodeBlock code={content} language={lang} showLineNumbers>
                <CodeBlockCopyButton aria-label="Copy code" />
              </CodeBlock>
            );
          }

          return (
            <code
              {...p}
              className={cn(
                "rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[0.85em]",
                className
              )}
            />
          );
        },

        // Custom callout component used in docs: <Note>...</Note>
        Note: ({ type, className, children, ...rest }: any) => {
          const warning = type === "warning";
          return (
            <div
              {...rest}
              className={cn(
                "my-4 flex gap-3 rounded-md border p-3 text-sm",
                warning ? "status-warning border-[color:var(--warning)]" : "border-primary/30 bg-primary/5 text-foreground",
                className
              )}
              style={warning ? { backgroundColor: "color-mix(in srgb, var(--warning) 18%, transparent)" } : undefined}
            >
              <div className="mt-0.5 font-medium">
                {warning ? "Warning" : "Note"}
              </div>
              <div className="min-w-0 flex-1">{children}</div>
            </div>
          );
        },
        note: ({ type, className, children, ...rest }: any) => {
          const warning = type === "warning";
          return (
            <div
              {...rest}
              className={cn(
                "my-4 flex gap-3 rounded-md border p-3 text-sm",
                warning ? "status-warning border-[color:var(--warning)]" : "border-primary/30 bg-primary/5 text-foreground",
                className
              )}
              style={warning ? { backgroundColor: "color-mix(in srgb, var(--warning) 18%, transparent)" } : undefined}
            >
              <div className="mt-0.5 font-medium">
                {warning ? "Warning" : "Note"}
              </div>
              <div className="min-w-0 flex-1">{children}</div>
            </div>
          );
        },

        // Custom docs helper: <ExampleLinks examples={[{title, link}]} />
        ExampleLinks: ({ examples }: any) => {
          const items = Array.isArray(examples) ? examples : [];
          return (
            <div className="my-4 grid gap-2">
              {items.map((ex: any, idx: number) => (
                <a
                  key={`${ex?.title ?? idx}-${ex?.link ?? idx}`}
                  href={typeof ex?.link === "string" ? ex.link : "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm hover:border-primary/50 hover:bg-background"
                >
                  <span className="font-medium">{ex?.title ?? "Example"}</span>
                </a>
              ))}
            </div>
          );
        },
      } as any}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
