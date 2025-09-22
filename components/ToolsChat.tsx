"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";

export default function ToolsChat() {
  const [input, setInput] = useState("");
  const [showTools, setShowTools] = useState(true);
  const chat = useMemo(
    () =>
      new Chat({
        transport: new DefaultChatTransport({ api: "/api/chat/ui" }),
      }),
    []
  );
  const { messages, sendMessage, status, error } = useChat({ chat });

  const ChartRenderer = ({ spec, data }: { spec: any; data: any[] }) => {
    try {
      if (spec?.type === "line") {
        const Sparkline = require("@/components/charts/Sparkline").default;
        const points = Array.isArray(data)
          ? data.map((d: any) => ({ label: String(d.label ?? ""), value: Number(d.value ?? 0) }))
          : [];
        return <Sparkline data={points} height={220} />;
      }
    } catch {}
    return (
      <pre className="overflow-x-auto rounded-md bg-muted/30 p-2 text-xs">
        {JSON.stringify({ spec, data }, null, 2)}
      </pre>
    );
  };

  const helpText = useMemo(
    () =>
      showTools
        ? "Watching tool execution. Ask: What's the weather in New York in celsius?"
        : "Focusing on final output. Toggle to watch tools.",
    [showTools]
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">Tool-enabled streaming chat</h3>
          <p className="text-xs text-muted-foreground">{helpText}</p>
        </div>
        <label className="inline-flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            className="accent-primary"
            checked={showTools}
            onChange={(e) => setShowTools(e.target.checked)}
          />
          Show tools
        </label>
      </div>

      <div className="mb-3 max-h-[22rem] space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-background/80 p-4">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Try: "What's the weather in New York?" or "What's the weather in New York in celsius?"
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
                  default: {
                    // Only show tool parts when they are tool-related and showTools is enabled
                    const looksLikeTool = typeof part?.type === "string" && part.type.startsWith("tool-");
                    if (part.type === "tool-chartViolationsTrend") {
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
        className="flex items-center gap-2"
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
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          disabled={status === "streaming"}
        >
          Send
        </button>
      </form>

      {error && (
        <div className="mt-2 text-xs text-destructive">{String(error)}</div>
      )}
    </div>
  );
}

