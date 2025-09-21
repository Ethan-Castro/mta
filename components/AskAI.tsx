"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import type { ChatStatus, FileUIPart } from "ai";
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
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
} from "@/components/ai-elements/chain-of-thought";
import {
  CodeBlock,
  CodeBlockCopyButton,
} from "@/components/ai-elements/code-block";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "@/components/ai-elements/message";
import {
  OpenIn,
  OpenInTrigger,
  OpenInContent,
  OpenInChatGPT,
  OpenInClaude,
  OpenInT3,
  OpenInScira,
  OpenInv0,
  OpenInLabel,
  OpenInSeparator,
} from "@/components/ai-elements/open-in-chat";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectValue,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";
import {
  Suggestions,
  Suggestion,
} from "@/components/ai-elements/suggestion";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  InlineCitation,
  InlineCitationText,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselPrev,
  InlineCitationCarouselNext,
  InlineCitationSource,
  InlineCitationQuote,
} from "@/components/ai-elements/inline-citation";
import {
  CopyIcon,
  MessageCircleIcon,
  RefreshCcwIcon,
  SquarePenIcon,
  BarChart3Icon,
} from "lucide-react";

const DATASET_URL =
  "https://data.ny.gov/Transportation/Automated-Bus-Lane-Enforcement-Violations/kh8p-hcbm";
const ASSISTANT_AVATAR = "https://avatar.vercel.sh/assistant?text=AI";
const USER_AVATAR = "https://avatar.vercel.sh/user?text=ME";
const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

const promptSuggestions = [
  "Summarize ACE violations for the last six months",
  "Which bus routes have the highest exempt share this quarter?",
  "Compare violations before and after congestion pricing",
  "Suggest enforcement actions for chronic offenders",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type SummaryStats = {
  rows: Array<Record<string, unknown>>;
  totalViolations: number;
  totalExempt: number;
  routeCount: number;
  months: string[];
  exemptShare: number;
  topRoutes: Array<{ route: string; violations: number; exempt: number }>;
};

type ToolState = {
  input: Record<string, unknown>;
  output?: unknown;
  errorText?: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
};

type ChainStep = {
  label: string;
  description?: string;
  status: "complete" | "active" | "pending";
  detail?: string;
};

function formatNumber(value: number) {
  return NUMBER_FORMAT.format(value);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  return `${(value * 100).toFixed(1)}%`;
}

function computeSummary(rows: Array<Record<string, unknown>>): SummaryStats {
  type RouteBucket = { route: string; violations: number; exempt: number };
  type Totals = {
    totalViolations: number;
    totalExempt: number;
    routeMap: Map<string, RouteBucket>;
    months: Set<string>;
  };

  const totals = rows.reduce<Totals>(
    (acc, row) => {
      const violations = Number(row?.violations ?? row?.count ?? 0);
      const exempt = Number(row?.exempt_count ?? 0);
      const route = String(row?.bus_route_id ?? "unknown");
      const month = String(row?.date_trunc_ym ?? "");

      acc.totalViolations += Number.isFinite(violations) ? violations : 0;
      acc.totalExempt += Number.isFinite(exempt) ? exempt : 0;

      const routeBucket = acc.routeMap.get(route) ?? {
        route,
        violations: 0,
        exempt: 0,
      };
      routeBucket.violations += Number.isFinite(violations) ? violations : 0;
      routeBucket.exempt += Number.isFinite(exempt) ? exempt : 0;
      acc.routeMap.set(route, routeBucket);

      if (month) {
        acc.months.add(month);
      }

      return acc;
    },
    {
      totalViolations: 0,
      totalExempt: 0,
      routeMap: new Map<string, RouteBucket>(),
      months: new Set<string>(),
    }
  );

  const topRoutes = Array.from(totals.routeMap.values())
    .sort((a, b) => b.violations - a.violations)
    .slice(0, 3);

  const months = Array.from(totals.months).sort();

  return {
    rows,
    totalViolations: totals.totalViolations,
    totalExempt: totals.totalExempt,
    routeCount: totals.routeMap.size,
    months,
    exemptShare:
      totals.totalViolations > 0
        ? totals.totalExempt / totals.totalViolations
        : 0,
    topRoutes,
  };
}

function buildSummaryChain(
  summary: SummaryStats | null,
  question: string,
  streaming: boolean
): ChainStep[] {
  if (!summary) {
    return [
      {
        label: "Attempt dataset lookup",
        description: "Fetch ACE violations grouped by route and month",
        status: "pending",
      },
      {
        label: "Fallback to cached context",
        description: "Use heuristics when live data is unavailable",
        status: "active",
      },
      {
        label: "Compose response",
        description: `Answer “${question}” with best-effort context`,
        status: streaming ? "active" : "complete",
      },
    ];
  }

  const monthRange =
    summary.months.length > 1
      ? `${summary.months[0]} → ${summary.months[summary.months.length - 1]}`
      : summary.months[0] ?? "n/a";

  return [
    {
      label: "Gather violations dataset",
      description: `${formatNumber(
        summary.rows.length
      )} monthly route records across ${summary.routeCount} routes (${monthRange})`,
      status: "complete",
    },
    {
      label: "Aggregate KPIs",
      description: `${formatNumber(summary.totalViolations)} violations • ${formatPercent(
        summary.exemptShare
      )} exempt share`,
      status: "complete",
    },
    {
      label: "Compose response",
      description: `Draft tailored answer for “${question}”`,
      status: streaming ? "active" : "complete",
    },
  ];
}

export default function AskAI() {
  const [inputValue, setInputValue] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [toolState, setToolState] = useState<ToolState | null>(null);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [chainSteps, setChainSteps] = useState<ChainStep[]>([]);
  const [reasoningText, setReasoningText] = useState<string>("");
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null);

  const submitQuestion = useCallback(
    async (text: string, files: FileUIPart[] = []) => {
      const question = text.trim();
      if (!question) {
        return;
      }

      setInputValue("");
      setError(null);
      setActiveQuestion(question);
      setStatus("submitted");
      setIsStreaming(true);
      setSummary(null);
      setReasoningText("");
      setChainSteps(buildSummaryChain(null, question, true));
      setToolState({
        input: { model, question, attachments: files.length },
        state: "input-streaming",
      });

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: "user",
        content: question,
      };
      const assistantId = nanoid();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setActiveAssistantId(assistantId);

      const summaryPromise = fetch("/api/violations/summary", {
        cache: "no-store",
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error("Failed to load violation summary");
          }
          const data = await res.json();
          const rows = Array.isArray(data?.rows) ? data.rows : [];
          const stats = computeSummary(rows);
          setSummary(stats);
          setToolState({
            input: { model, question, attachments: files.length },
            output: stats.rows.slice(0, 8),
            state: "output-available",
          });
          setChainSteps(buildSummaryChain(stats, question, true));
          setReasoningText(
            [
              `Fetched ${formatNumber(
                stats.rows.length
              )} grouped records from the ACE violations dataset.`,
              `Calculated ${formatNumber(
                stats.totalViolations
              )} total violations with ${formatPercent(
                stats.exemptShare
              )} of them marked exempt.`,
              `Synthesising an answer for “${question}”.`,
            ].join("\n\n")
          );
          return stats;
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          setToolState({
            input: { model, question, attachments: files.length },
            state: "output-error",
            errorText: message,
          });
          setSummary(null);
          setChainSteps(buildSummaryChain(null, question, true));
          setReasoningText(`Unable to fetch dataset context: ${message}`);
          return null;
        });

      try {
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question }),
        });

        if (!response.ok || !response.body) {
          throw new Error("AI response failed");
        }

        setStatus("streaming");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (value) {
            buffer += decoder.decode(value, { stream: !done });
            const content = buffer;
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, content }
                  : message
              )
            );
          }
          if (done) {
            break;
          }
        }

        if (!buffer.trim()) {
          buffer = "I wasn't able to generate an answer this time.";
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: buffer }
                : message
            )
          );
        }

        await summaryPromise;
        setStatus(undefined);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("error");
        setToolState((state) =>
          state
            ? {
                ...state,
                state: "output-error",
                errorText: message,
              }
            : {
                input: { model, question, attachments: files.length },
                state: "output-error",
                errorText: message,
              }
        );
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId && !msg.content
              ? {
                  ...msg,
                  content: "AI is temporarily unavailable. Please try again.",
                }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
        setActiveAssistantId(null);
      }
    },
    [model]
  );

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      await submitQuestion(message.text ?? "", message.files ?? []);
    },
    [submitQuestion]
  );

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      setInputValue(suggestion);
    },
    []
  );

  const copyToClipboard = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error("Clipboard unavailable", err);
    }
  }, []);

  useEffect(() => {
    setChainSteps((steps) =>
      steps.map((step, index) => {
        if (index !== steps.length - 1) {
          return step;
        }
        if (step.status === "pending") {
          return step;
        }
        return {
          ...step,
          status: isStreaming ? "active" : "complete",
        };
      })
    );
  }, [isStreaming]);

  const assistantSummary = useMemo(() => {
    if (!summary) {
      return null;
    }

    const topRoutes = summary.topRoutes.map((route) => (
      <div key={route.route} className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs uppercase tracking-wide">
          {route.route || "(unassigned)"}
        </span>
        <span className="font-medium text-sm">
          {formatNumber(route.violations)}
        </span>
      </div>
    ));

    return (
      <Artifact className="bg-background/80">
        <ArtifactHeader>
          <ArtifactTitle>ACE enforcement snapshot</ArtifactTitle>
          <ArtifactActions>
            <ArtifactAction
              tooltip="Copy metrics"
              icon={CopyIcon}
              onClick={() =>
                void copyToClipboard(
                  JSON.stringify(
                    {
                      totalViolations: summary.totalViolations,
                      totalExempt: summary.totalExempt,
                      exemptShare: summary.exemptShare,
                    },
                    null,
                    2
                  )
                )
              }
            />
          </ArtifactActions>
        </ArtifactHeader>
        <ArtifactContent className="grid gap-3">
          <div className="grid gap-1">
            <ArtifactDescription>Total violations</ArtifactDescription>
            <p className="font-semibold text-lg">
              {formatNumber(summary.totalViolations)}
            </p>
          </div>
          <div className="grid gap-1">
            <ArtifactDescription>Exempt share</ArtifactDescription>
            <p className="font-semibold text-lg">
              {formatPercent(summary.exemptShare)}
              <span className="text-muted-foreground text-xs">
                {" "}({formatNumber(summary.totalExempt)} exempt)
              </span>
            </p>
          </div>
          <div className="grid gap-1">
            <ArtifactDescription>Top routes</ArtifactDescription>
            <div className="grid gap-1.5">{topRoutes}</div>
          </div>
        </ArtifactContent>
      </Artifact>
    );
  }, [summary, copyToClipboard]);

  return (
    <div className="space-y-6 rounded-2xl border border-border/60 bg-card/70 p-6 shadow-xl backdrop-blur">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Ask the ACE assistant
          </h2>
          <p className="text-muted-foreground text-sm">
            Explore automated bus lane enforcement data with AI-native UI
            elements powered by Vercel AI Elements.
          </p>
        </div>
        {error && (
          <span className="text-destructive text-sm">{error}</span>
        )}
      </div>

      <Conversation className="h-[28rem] rounded-xl border border-border/50 bg-background/80">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Start a conversation"
              description="Ask about violations, exemptions, or bus routes to see AI Elements in action."
              icon={<MessageCircleIcon className="size-6" />}
            />
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageAvatar
                  src={message.role === "assistant" ? ASSISTANT_AVATAR : USER_AVATAR}
                  name={message.role === "assistant" ? "AI" : "You"}
                />
                <MessageContent
                  variant={message.role === "assistant" ? "contained" : "flat"}
                  className="w-full"
                >
                  {message.role === "assistant" ? (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Actions>
                          <Action
                            tooltip="Copy response"
                            onClick={() => void copyToClipboard(message.content)}
                          >
                            <CopyIcon className="size-4" />
                          </Action>
                          <Action
                            tooltip="Reuse answer as prompt"
                            onClick={() => setInputValue(message.content)}
                          >
                            <SquarePenIcon className="size-4" />
                          </Action>
                          <Action
                            tooltip="Regenerate"
                            onClick={() => void submitQuestion(message.content)}
                          >
                            <RefreshCcwIcon className="size-4" />
                          </Action>
                        </Actions>
                      </div>

                      {activeAssistantId === message.id && isStreaming && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Loader />
                          <span>Streaming live response…</span>
                        </div>
                      )}

                      {message.content && (
                        <Branch defaultBranch={0}>
                          <BranchMessages>
                            <div className="grid gap-4">
                              <Response>{message.content}</Response>
                              {summary && (
                                <InlineCitation className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <InlineCitationText>
                                    Source: NYC Open Data
                                  </InlineCitationText>
                                  <InlineCitationCard>
                                    <InlineCitationCardTrigger
                                      sources={[DATASET_URL]}
                                    />
                                    <InlineCitationCardBody>
                                      <InlineCitationCarousel>
                                        <InlineCitationCarouselContent>
                                          <InlineCitationCarouselItem>
                                            <InlineCitationCarouselHeader>
                                              <InlineCitationCarouselPrev />
                                              <InlineCitationCarouselIndex />
                                              <InlineCitationCarouselNext />
                                            </InlineCitationCarouselHeader>
                                            <InlineCitationSource
                                              title="Automated Bus Lane Enforcement Violations"
                                              url={DATASET_URL}
                                            >
                                              <InlineCitationQuote>
                                                Monthly ACE violations and exemption counts grouped by bus route.
                                              </InlineCitationQuote>
                                            </InlineCitationSource>
                                          </InlineCitationCarouselItem>
                                        </InlineCitationCarouselContent>
                                      </InlineCitationCarousel>
                                    </InlineCitationCardBody>
                                  </InlineCitationCard>
                                </InlineCitation>
                              )}
                            </div>
                            <div className="grid gap-4">
                              {assistantSummary}
                              {summary && (
                                <CodeBlock
                                  code={JSON.stringify(summary.rows.slice(0, 5), null, 2)}
                                  language="json"
                                  showLineNumbers
                                >
                                  <CodeBlockCopyButton aria-label="Copy JSON" />
                                </CodeBlock>
                              )}
                            </div>
                          </BranchMessages>
                          <BranchSelector from="assistant">
                            <BranchPrevious />
                            <BranchPage />
                            <BranchNext />
                          </BranchSelector>
                        </Branch>
                      )}

                      <ChainOfThought defaultOpen={false}>
                        <ChainOfThoughtHeader />
                        <ChainOfThoughtContent>
                          <ChainOfThoughtSearchResults>
                            <ChainOfThoughtSearchResult>
                              {summary
                                ? `${summary.routeCount} routes analysed`
                                : "Offline reasoning"}
                            </ChainOfThoughtSearchResult>
                          </ChainOfThoughtSearchResults>
                          {chainSteps.map((step) => (
                            <ChainOfThoughtStep
                              key={step.label}
                              label={step.label}
                              description={step.description}
                              status={step.status}
                            />
                          ))}
                        </ChainOfThoughtContent>
                      </ChainOfThought>

                      <Reasoning
                        isStreaming={isStreaming && activeAssistantId === message.id}
                        defaultOpen
                        duration={summary ? Math.max(1, Math.round(summary.rows.length / 40)) : undefined}
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>
                          {reasoningText ||
                            "Reasoning unavailable for this turn."}
                        </ReasoningContent>
                      </Reasoning>

                      {toolState && (
                        <Tool defaultOpen className="bg-background/70">
                          <ToolHeader
                            type="tool-getViolationsSummary"
                            state={toolState.state}
                          />
                          <ToolContent>
                            <ToolInput input={toolState.input} />
                            <ToolOutput
                              output={toolState.output}
                              errorText={toolState.errorText}
                            />
                          </ToolContent>
                        </Tool>
                      )}

                      <Sources>
                        <SourcesTrigger count={1} />
                        <SourcesContent>
                          <Source href={DATASET_URL} title="Automated Bus Lane Enforcement Violations">
                            ACE violations dataset on data.ny.gov
                          </Source>
                        </SourcesContent>
                      </Sources>

                      <OpenIn query={message.content || activeQuestion || ""}>
                        <OpenInTrigger />
                        <OpenInContent>
                          <OpenInLabel>Continue in another chat</OpenInLabel>
                          <OpenInChatGPT />
                          <OpenInClaude />
                          <OpenInT3 />
                          <OpenInSeparator />
                          <OpenInScira />
                          <OpenInv0 />
                        </OpenInContent>
                      </OpenIn>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <div className="inline-flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                        <BarChart3Icon className="size-3" />
                        Prompt
                      </div>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  )}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="space-y-3">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          Quick suggestions
        </p>
        <Suggestions>
          {promptSuggestions.map((suggestion) => (
            <Suggestion
              key={suggestion}
              suggestion={suggestion}
              onClick={handleSuggestion}
            />
          ))}
        </Suggestions>
      </div>

      <PromptInput
        onSubmit={handleSubmit}
        className="rounded-xl border border-border/60 bg-background/90"
        globalDrop
      >
        <PromptInputBody>
          <PromptInputTextarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Ask about ACE violations, exemptions, trends, or tooling…"
          />
        </PromptInputBody>
        <PromptInputAttachments>
          {(file) => <PromptInputAttachment data={file} />}
        </PromptInputAttachments>
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <PromptInputModelSelect value={model} onValueChange={setModel}>
              <PromptInputModelSelectTrigger>
                <PromptInputModelSelectValue placeholder="Model" />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                <PromptInputModelSelectItem value="gpt-4o-mini">
                  GPT-4o mini
                </PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="offline">
                  Offline fallback
                </PromptInputModelSelectItem>
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>
          </PromptInputTools>
          <PromptInputSubmit status={status} />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
