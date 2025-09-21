"use client";

import { useMemo, useState } from "react";
import ExecutiveSummary from "@/components/ExecutiveSummary";
import ExecutiveKpis from "@/components/ExecutiveKpis";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { MessageSquare } from "lucide-react";
import InsightCard from "@/components/InsightCard";
import {
  AI_STARTER_PROMPTS,
  CBD_ROUTE_TRENDS,
  EXEMPT_REPEATERS,
  ROUTE_COMPARISONS,
} from "@/lib/data/insights";

const percent = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("en-US");

function formatPercent(value: number) {
  return `${percent.format(value)}%`;
}
export default function ExecutivePage() {
  const [showExplain, setShowExplain] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat/ui" }),
  });

  const { aceSpeedGain, cbdViolationDrop, studentExposure, topRoutes } = useMemo(() => {
    const aceRoutes = ROUTE_COMPARISONS.filter((route) => route.aceEnforced);
    const aceSpeedGain = aceRoutes.length
      ? aceRoutes.reduce((acc, route) => acc + route.speedChangePct, 0) / aceRoutes.length
      : 0;
    const cbdRoutes = CBD_ROUTE_TRENDS.filter((route) => route.crossesCbd);
    const cbdViolationDrop = cbdRoutes.length
      ? cbdRoutes.reduce((acc, route) => acc + route.violationChangePct, 0) / cbdRoutes.length
      : 0;
    const studentExposure = ROUTE_COMPARISONS.reduce((acc, route) => acc + route.averageWeekdayStudents, 0);
    const topRoutes = [...ROUTE_COMPARISONS]
      .sort((a, b) => b.speedChangePct - a.speedChangePct)
      .slice(0, 3);
    return { aceSpeedGain, cbdViolationDrop, studentExposure, topRoutes };
  }, []);

  const prompts = useMemo(() => AI_STARTER_PROMPTS.slice(0, 4), []);

  const handleSubmit = (
    message: { text?: string },
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const text = message.text ?? input;
    if (!text.trim()) return;
    sendMessage({ text });
    setInput("");
  };
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Executive</h1>
        <p className="text-sm text-foreground/70">KPIs, trends, and AI summaries.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard
          title="ACE speed uplift"
          value={formatPercent(aceSpeedGain)}
          subline="Average change on ACE-enabled campus routes"
          trendLabel="Routes tracked"
          trendDelta={`${ROUTE_COMPARISONS.filter((route) => route.aceEnforced).length}`}
          trendPositive
        />
        <InsightCard
          title="CBD violation delta"
          value={formatPercent(Math.abs(cbdViolationDrop))}
          subline={cbdViolationDrop < 0 ? "Drop after congestion pricing" : "Increase after congestion pricing"}
          trendLabel="Routes crossing CBD"
          trendDelta={`${CBD_ROUTE_TRENDS.filter((route) => route.crossesCbd).length}`}
          trendPositive={cbdViolationDrop < 0}
        />
        <InsightCard
          title="Daily student exposure"
          value={integer.format(studentExposure)}
          subline="Students riding monitored corridors each weekday"
          trendLabel="Repeat exempt fleets"
          trendDelta={`${EXEMPT_REPEATERS.length}`}
          trendPositive={false}
        />
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium">Narratives to brief</h2>
          <span className="text-xs text-foreground/60">Anchor updates to the three core business questions.</span>
        </div>
        <ul className="space-y-2 text-sm text-foreground/80">
          {topRoutes.map((route) => (
            <li key={route.routeId} className="rounded-lg border border-foreground/10 px-3 py-2">
              <div className="font-medium text-foreground/90">
                {route.routeId} - {route.routeName}
              </div>
              <div className="text-xs text-foreground/60">{route.campus} | {route.aceEnforced ? "ACE enforced" : "No ACE coverage"} | {formatPercent(route.speedChangePct)} speed change</div>
              <p className="mt-2 leading-relaxed text-foreground/80 text-sm">{route.narrative}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="text-xs">
        <button onClick={() => setShowExplain((s) => !s)} className="rounded-md border border-foreground/10 hover:border-foreground/20 px-2 py-1 transition-colors">
          {showExplain ? "Hide explanation" : "Explain this view"}
        </button>
        {showExplain && (
          <div className="mt-2 rounded-md border border-foreground/10 p-3 text-foreground/80">
            High-level KPIs summarize recent ACE violations and exempt shares. Generate an AI summary for context over a selected time window.
          </div>
        )}
      </div>
      <ExecutiveKpis />
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium">Pre-drafted AI prompts</h2>
          <span className="text-xs text-foreground/60">Paste into the assistant or API to generate ready-to-send briefings.</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="rounded-lg border border-foreground/10 px-3 py-2 text-left hover:border-foreground/30 transition-colors"
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <ExecutiveSummary />
      </div>
      <div className="rounded-xl border border-foreground/10 p-4">
        <h2 className="text-sm font-medium mb-3">Ask the ACE assistant</h2>
        <div className="flex flex-col">
          <Conversation className="relative w-full" style={{ height: 320 }}>
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-6" />}
                  title="Ask for executive insights"
                  description="Summaries, key risks, and highlights"
                />
              ) : (
                messages.map((message) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <Response key={`${message.id}-${i}`}>
                                {part.text}
                              </Response>
                            );
                          default:
                            return null;
                        }
                      })}
                    </MessageContent>
                  </Message>
                ))
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <PromptInput onSubmit={handleSubmit} className="mt-3 relative">
            <PromptInputTextarea
              value={input}
              placeholder="Ask for an executive summary..."
              onChange={(e) => setInput(e.currentTarget.value)}
              className="pr-10"
            />
            <PromptInputSubmit
              status={status === "streaming" ? "streaming" : "ready"}
              disabled={!input.trim()}
              className="absolute bottom-1 right-1"
            />
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
