"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import {
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectValue,
} from "@/components/ai-elements/prompt-input";
import Sparkline from "@/components/charts/Sparkline";
import MultiLine from "@/components/charts/MultiLine";
import GroupedBar from "@/components/charts/GroupedBar";
import BarChartBasic from "@/components/charts/BarChartBasic";
import PieChartBasic from "@/components/charts/PieChartBasic";
import MapPanel from "@/components/MapPanel";
import ErrorBoundary from "@/components/ErrorBoundary";
import ChartErrorFallback from "@/components/ChartErrorFallback";
import { BRAND_PRIMARY_HEX } from "@/lib/ui/colors";

export default function ToolsChat() {
  const [input, setInput] = useState("");
  const [showTools, setShowTools] = useState(true);
  const [model, setModel] = useState<string>("openai/gpt-5-mini");
  const chat = useMemo(
    () =>
      new Chat({
        transport: new DefaultChatTransport({ api: "/api/chat/ui", headers: { "x-model": model } as any }),
      }),
    [model]
  );
  const { messages, sendMessage, status, error } = useChat({ chat });

  const ChartRenderer = ({ spec, data }: { spec: any; data: any }) => {
    const extractRows = (input: unknown) => {
      if (Array.isArray(input)) return input;
      if (input && typeof input === "object") {
        const candidate = input as Record<string, unknown>;
        if (Array.isArray(candidate.rows)) return candidate.rows;
        if (Array.isArray(candidate.data)) return candidate.data;
        if (Array.isArray(candidate.points)) return candidate.points;
      }
      return [] as any[];
    };

    return (
      <ErrorBoundary fallback={ChartErrorFallback}>
        {(() => {
          if (spec?.type === "line") {
            const points = extractRows(data).map((d: any) => ({ label: String(d.label ?? ""), value: Number(d.value ?? 0) }));
            return <Sparkline data={points} height={220} />;
          }
          if (spec?.type === "multi-line") {
            const rows = extractRows(data);
            const series = Array.isArray(spec?.series) ? spec.series : [];
            const marker = spec?.marker ?? null;
            return <MultiLine data={rows} series={series} height={260} yLabel={spec?.yLabel} marker={marker} />;
          }
          if (spec?.type === "grouped-bar") {
            const rows = extractRows(data).map((d: any) => ({
              name: String(d.name ?? d.label ?? ""),
              violations: Number(d.violations ?? d.value ?? 0),
              exempt: Number(d.exempt ?? d.exempt_count ?? 0),
            }));
            return <GroupedBar data={rows} height={260} />;
          }
          if (spec?.type === "bar") {
            const rows = extractRows(data).map((d: any) => ({ label: String(d.label ?? d.name ?? ""), value: Number(d.value ?? d.count ?? 0) }));
            return <BarChartBasic data={rows} height={240} yLabel={spec?.yLabel || "Count"} />;
          }
          if (spec?.type === "pie") {
            const rows = extractRows(data).map((d: any) => ({ label: String(d.label ?? d.name ?? ""), value: Number(d.value ?? d.count ?? 0) }));
            return <PieChartBasic data={rows} height={240} />;
          }
          if (spec?.type === "map") {
            const markers = extractRows(data).map((d: any) => ({
              id: String(d.id ?? `${d.longitude},${d.latitude}`),
              longitude: Number(d.longitude ?? d.lng ?? d.lon ?? 0),
              latitude: Number(d.latitude ?? d.lat ?? 0),
              color: d.color || BRAND_PRIMARY_HEX,
              title: d.title,
              description: d.description,
              href: d.href,
            }));
            const center: [number, number] | undefined = Array.isArray(spec?.center) && spec.center.length === 2
              ? [Number(spec.center[0]), Number(spec.center[1])] as [number, number]
              : undefined;
            return (
              <div className="space-y-2">
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
          return (
            <pre className="overflow-x-auto rounded-md bg-muted/30 p-2 text-xs">
              {JSON.stringify({ spec, data }, null, 2)}
            </pre>
          );
        })()}
      </ErrorBoundary>
    );
  };

  const helpText = useMemo(
    () =>
      showTools
        ? "Watching tool execution. Try: 'How many violations rows in 2024?' or 'List allowed tables'."
        : "Focusing on final output. Toggle to watch tool data.",
    [showTools]
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-3 sm:p-4" role="region" aria-label="Tool-enabled chat">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold sm:text-base">Tool-enabled streaming chat</h3>
          <p className="text-xs text-muted-foreground" id="toolschat-helptext">{helpText}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <PromptInputModelSelect value={model} onValueChange={setModel}>
              <PromptInputModelSelectTrigger>
                <PromptInputModelSelectValue placeholder="Model" />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                <PromptInputModelSelectItem value="openai/gpt-5-mini">GPT-5 Mini (via Gateway)</PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="xai/grok-4-fast-reasoning">Grok-4 Fast Reasoning (xAI)</PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="anthropic/claude-sonnet-4">Claude Sonnet 4 (Anthropic)</PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (Google)</PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (Google)</PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="openai/gpt-oss-120b">GPT-OSS 120B (OpenAI)</PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="moonshotai/kimi-k2-0905">Kimi K2 0905 (Moonshot)</PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="offline">Offline fallback</PromptInputModelSelectItem>
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>
          </div>
          <label className="inline-flex items-center gap-2 text-xs" htmlFor="toggle-show-tools">
            <input
              id="toggle-show-tools"
              type="checkbox"
              className="accent-primary"
              checked={showTools}
              onChange={(e) => setShowTools(e.target.checked)}
              aria-describedby="toolschat-helptext"
            />
            Show tools
          </label>
        </div>
      </div>

      <div className="mb-3 max-h-[18rem] space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-background/80 p-3 sm:max-h-[22rem] sm:p-4" role="log" aria-label="Messages">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Sample prompts: "How many violations rows in 2024?", "Show row count for bus_segment_speeds_2025", or "Plot violations trend for M15-SBS".
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="whitespace-pre-wrap">
            <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
              {message.role === "user" ? "User" : "AI"}
            </div>
            <div className="space-y-2 text-sm">
              {message.parts?.map((part: any, i: number) => {
                switch (part.type) {
                  case "text": {
                    return (
                      <div key={`${message.id}-text-${i}`}>{part.text}</div>
                    );
                  }
                  case "tool-weather":
                  case "tool-convertFahrenheitToCelsius": {
                    if (!showTools) return null;
                    return (
                      <pre
                        key={`${message.id}-tool-${i}`}
                        className="overflow-x-auto rounded-md bg-muted/50 p-2 text-xs"
                      >
                        {JSON.stringify(part, null, 2)}
                      </pre>
                    );
                  }
                  case "tool-webSearch": {
                    if (!showTools) return null;
                    const output = (part as any).output ?? part;
                    const results: any[] = Array.isArray(output) ? output : Array.isArray(output?.results) ? output.results : [];
                    return (
                      <div key={`${message.id}-tool-web-${i}`} className="space-y-2 rounded-md border border-border/60 bg-background/70 p-2">
                        <div className="text-xs font-medium">Web search results</div>
                        {results.length === 0 ? (
                          <div className="text-xs text-muted-foreground">No results</div>
                        ) : (
                          <ul className="space-y-2">
                            {results.slice(0, 5).map((r: any, idx: number) => (
                              <li key={idx} className="text-xs">
                                <a href={r.url} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
                                  {r.title || r.url}
                                </a>
                                {r.publishedDate && (
                                  <span className="ml-2 text-[10px] text-muted-foreground">{String(r.publishedDate).slice(0, 10)}</span>
                                )}
                                {r.content && (
                                  <div className="mt-1 line-clamp-3 text-muted-foreground">{String(r.content)}</div>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  }
                  case "tool-listAllowedTables":
                  case "tool-runSqlSelect":
                  case "tool-countTableRows":
                  case "tool-violationTotals":
                  case "tool-getViolationsSummary": {
                    if (!showTools) return null;
                    return (
                      <pre
                        key={`${message.id}-tool-${i}`}
                        className="overflow-x-auto rounded-md bg-muted/40 p-2 text-xs"
                      >
                        {JSON.stringify(part.output ?? part, null, 2)}
                      </pre>
                    );
                  }
                  default: {
                    // Only show tool parts when they are tool-related and showTools is enabled
                    const looksLikeTool = typeof part?.type === "string" && part.type.startsWith("tool-");
                  if (part.type === "tool-chartViolationsTrend" || part.type === "tool-chartViolationsGrouped" || part.type === "tool-visualize") {
                      if (!showTools) return null;
                      const payload: any = (part as any).output ?? part;
                      return (
                        <div
                          key={`${message.id}-chart-${i}`}
                          className="rounded-md border border-border/60 bg-background/70 p-2"
                        >
                          <ChartRenderer spec={payload.chart} data={payload.data} />
                        </div>
                      );
                    }
                    if (!looksLikeTool || !showTools) return null;
                    return (
                      <pre
                        key={`${message.id}-part-${i}`}
                        className="overflow-x-auto rounded-md bg-muted/30 p-2 text-xs"
                      >
                        {JSON.stringify(part, null, 2)}
                      </pre>
                    );
                  }
                }
              })}
            </div>
          </div>
        ))}
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          const text = input.trim();
          if (!text) return;
          sendMessage({ text });
          setInput("");
        }}
      >
        <input
          className="flex-1 rounded-lg border border-border/60 bg-background/90 p-2 text-sm"
          value={input}
          placeholder={
            status === "streaming"
              ? "Streaming…"
              : "Ask about the weather, e.g., New York in celsius"
          }
          onChange={(e) => setInput(e.currentTarget.value)}
          aria-label="Message"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 sm:flex-shrink-0"
          disabled={status === "streaming"}
          aria-label="Send"
        >
          Send
        </button>
      </form>

      {error && (
        <div className="mt-2 text-xs text-destructive" role="alert" aria-live="polite">{String(error)}</div>
      )}
    </div>
  );
}
