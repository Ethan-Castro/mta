"use client";

import { useCallback, useMemo, useState, memo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { nanoid } from "nanoid";
import type { ChatStatus } from "ai";
import { useUser } from "@stackframe/stack";
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
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@/components/ai-elements/task";
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
  PromptInputToolbar,
  PromptInputTools,
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
import MapPanel from "@/components/MapPanel";
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
  DownloadIcon,
  ShareIcon,
  EditIcon,
  MicIcon,
  MicOffIcon,
  UploadIcon,
  MailIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildAssistantFallback,
  computeSummary,
  extractSummaryRows,
  formatNumber,
  formatPercent,
  type SummaryStats,
  type ToolLogEntry,
} from "@/lib/ai/assistant-utils";
import Sparkline from "@/components/charts/Sparkline";
import MultiLine from "@/components/charts/MultiLine";
import GroupedBar from "@/components/charts/GroupedBar";
import BarChartBasic from "@/components/charts/BarChartBasic";
import PieChartBasic from "@/components/charts/PieChartBasic";
import ErrorBoundary from "@/components/ErrorBoundary";
import ChartErrorFallback from "@/components/ChartErrorFallback";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { BRAND_PRIMARY_HEX } from "@/lib/ui/colors";

const DATASET_URL =
  "https://data.ny.gov/Transportation/Automated-Bus-Lane-Enforcement-Violations/kh8p-hcbm";
const ASSISTANT_AVATAR = "https://avatar.vercel.sh/assistant?text=AI";
const USER_AVATAR = "https://avatar.vercel.sh/user?text=ME";
const TOOL_META_SENTINEL = "[[AI_TOOL_META]]";

const personaPromptMap = {
  executive: [
    "Generate a board-ready ACE summary for M15-SBS vs Q46 over the last 6 months",
    "Highlight the three biggest risks for ACE performance this quarter",
    "Draft talking points comparing ACE and non-ACE reliability for campus riders",
  ],
  operations: [
    "Provide an action plan for reducing exempt repeaters on B44-SBS",
    "List the top 5 hotspots for Queens College routes with coordinates",
    "Suggest curb coordination tactics for routes with rising violations",
  ],
  policy: [
    "Compare CBD ACE routes pre vs post congestion pricing with key metrics",
    "Identify which routes should be next for ACE expansion based on exempt share",
    "Summarize evidence for keeping congestion pricing aligned with ACE goals",
  ],
  dataScience: [
    "Produce SQL to calculate monthly violations and exempt share for top student routes",
    "Forecast M15-SBS violations for the next 3 months using recent data",
    "Outline a Monte Carlo simulation approach for next month's ticket volume",
  ],
  student: [
    "Explain how ACE has improved commute times for Brooklyn College riders",
    "Map hotspots impacting Queens College students after 6pm",
    "Draft a student bulletin celebrating ACE gains and asking for curb compliance",
  ],
} as const;

const personaOptions = [
  { value: "executive", label: "Executive" },
  { value: "operations", label: "Operations" },
  { value: "policy", label: "Policy" },
  { value: "dataScience", label: "Data Science" },
  { value: "student", label: "CUNY" },
] as const;

const ChartRenderer = memo(({ spec, data, isLoading = false }: { spec: any; data: any; isLoading?: boolean }) => {
  if (isLoading) {
    return <LoadingSkeleton variant="chart" className="h-[220px]" />;
  }

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
          return (
            <div role="img" aria-label={spec?.title || "Line chart"}>
              <Sparkline data={points} height={220} />
            </div>
          );
        }
        if (spec?.type === "multi-line") {
          const rows = extractRows(data);
          const series = Array.isArray(spec?.series) ? spec.series : [];
          const marker = spec?.marker ?? null;
          return (
            <div role="img" aria-label={spec?.title || "Multi-line chart"}>
              <MultiLine data={rows} series={series} height={260} yLabel={spec?.yLabel} marker={marker} />
            </div>
          );
        }
        if (spec?.type === "grouped-bar") {
          const rows = extractRows(data).map((d: any) => ({
            name: String(d.name ?? d.label ?? ""),
            violations: Number(d.violations ?? d.value ?? 0),
            exempt: Number(d.exempt ?? d.exempt_count ?? 0),
          }));
          return (
            <div role="img" aria-label={spec?.title || "Grouped bar chart"}>
              <GroupedBar data={rows} height={260} />
            </div>
          );
        }
        if (spec?.type === "bar") {
          const rows = extractRows(data).map((d: any) => ({ label: String(d.label ?? d.name ?? ""), value: Number(d.value ?? d.count ?? 0) }));
          return (
            <div role="img" aria-label={spec?.title || "Bar chart"}>
              <BarChartBasic data={rows} height={240} yLabel={spec?.yLabel || "Count"} />
            </div>
          );
        }
        if (spec?.type === "pie") {
          const rows = extractRows(data).map((d: any) => ({ label: String(d.label ?? d.name ?? ""), value: Number(d.value ?? d.count ?? 0) }));
          return (
            <div role="img" aria-label={spec?.title || "Pie chart"}>
              <PieChartBasic data={rows} height={240} />
            </div>
          );
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
        return (
          <pre className="overflow-x-auto rounded-md bg-muted/30 p-2 text-xs">
            {JSON.stringify({ spec, data }, null, 2)}
          </pre>
        );
      })()}
    </ErrorBoundary>
  );
});

ChartRenderer.displayName = "ChartRenderer";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ToolState = {
  input: Record<string, unknown>;
  output?: unknown;
  errorText?: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  toolName?: string;
};

type ChainStep = {
  label: string;
  description?: string;
  status: "complete" | "active" | "pending";
  detail?: string;
};

type AssistantMetadata = {
  prompt: string;
  summary: SummaryStats | null;
  chainSteps: ChainStep[];
  reasoningText: string;
  toolState: ToolState | null;
  toolLogs: ToolLogEntry[];
};

function buildSummaryChain(
  summary: SummaryStats | null,
  question: string,
  streaming: boolean,
  toolLogs: ToolLogEntry[] = []
): ChainStep[] {
  const monthRange = summary
    ? summary.months.length > 1
      ? `${summary.months[0]} → ${summary.months[summary.months.length - 1]}`
      : summary.months[0] ?? "n/a"
    : null;

  if (summary) {
    const lastTool = toolLogs.at(-1);
    const gatherDescription = lastTool
      ? `Used ${lastTool.name} to fetch ${formatNumber(summary.rows.length)} records (${monthRange}).`
      : `${formatNumber(summary.rows.length)} monthly route records across ${summary.routeCount} routes (${monthRange}).`;

    return [
      {
        label: lastTool ? `Run ${lastTool.name}` : "Gather dataset",
        description: gatherDescription,
        status: "complete",
      },
      {
        label: "Aggregate KPIs",
        description: `${formatNumber(summary.totalViolations)} violations | ${formatPercent(
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

  if (toolLogs.length > 0) {
    const steps: ChainStep[] = toolLogs.map((log) => {
      const output = log.output as Record<string, unknown> | undefined;
      const rowsCount = output && Array.isArray((output as { rows?: unknown }).rows)
        ? ((output as { rows?: unknown }).rows as unknown[]).length
        : null;
      return {
        label: `Run ${log.name}`,
        description: log.error
          ? `Tool failed: ${log.error}`
          : rowsCount != null
          ? `Returned ${formatNumber(rowsCount)} rows.`
          : "Completed successfully.",
        status: "complete",
      };
    });
    steps.push({
      label: "Compose response",
      description: `Draft tailored answer for “${question}”`,
      status: streaming ? "active" : "complete",
    });
    return steps;
  }

  return [
    {
      label: "Assess cached context",
      description: "Question answered without tool calls",
      status: "complete",
    },
    {
      label: "Compose response",
      description: `Answer “${question}” with available context`,
      status: streaming ? "active" : "complete",
    },
  ];
}

function buildReasoningFromToolLogs(
  toolLogs: ToolLogEntry[],
  summary: SummaryStats | null,
  question: string
): string {
  if (toolLogs.length === 0) {
    return summary
      ? `Reused recent dataset context to answer “${question}”.`
      : `Answered “${question}” without running external tools.`;
  }

  const lines = toolLogs.map((log) => {
    if (log.error) {
      return `Tool ${log.name} failed: ${log.error}`;
    }
    const output = log.output as Record<string, unknown> | undefined;
    const rows = output && Array.isArray((output as { rows?: unknown }).rows)
      ? ((output as { rows?: unknown }).rows as unknown[]).length
      : null;
    if (rows != null) {
      return `Tool ${log.name} returned ${formatNumber(rows)} rows.`;
    }
    return `Tool ${log.name} completed successfully.`;
  });

  if (summary) {
    lines.push(
      `Synthesised answer from ${formatNumber(summary.rows.length)} grouped records with ${formatPercent(
        summary.exemptShare
      )} exempt share.`
    );
  }

  return lines.join("\n\n");
}

function deriveToolState(toolLogs: ToolLogEntry[], baseInput: Record<string, unknown>): ToolState | null {
  if (toolLogs.length === 0) {
    return null;
  }

  const last = toolLogs[toolLogs.length - 1];
  const inputCandidate = last.input;
  const input =
    inputCandidate && typeof inputCandidate === "object" && !Array.isArray(inputCandidate)
      ? (inputCandidate as Record<string, unknown>)
      : baseInput;

  return {
    input,
    output: last.output,
    errorText: last.error,
    state: last.error ? "output-error" : "output-available",
    toolName: last.name,
  };
}

export default function AskAI() {
  const user = useUser();
  const [inputValue, setInputValue] = useState("");
  const [model, setModel] = useState("openai/gpt-5-mini");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null);
  const [assistantMeta, setAssistantMeta] = useState<Record<string, AssistantMetadata>>({});
  const [activePersona, setActivePersona] = useState<(typeof personaOptions)[number]["value"]>("executive");
  const activePrompts = useMemo(() => personaPromptMap[activePersona], [activePersona]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isEmailing, setIsEmailing] = useState(false);
  const sp = useSearchParams();
  const scopeChips = useMemo(() => {
    const start = sp.get("start") || "";
    const end = sp.get("end") || "";
    const routeId = sp.get("routeId") || "";
    const campusType = sp.get("campusType") || "";
    const chips: Array<{ label: string; value: string }> = [];
    if (start) chips.push({ label: "Start", value: new Date(start).toLocaleString() });
    if (end) chips.push({ label: "End", value: new Date(end).toLocaleString() });
    if (routeId) chips.push({ label: "Routes", value: routeId });
    if (campusType) chips.push({ label: "Campus", value: campusType });
    return chips;
  }, [sp]);

  const submitQuestion = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question) {
        return;
      }

      const selectedModel = model;
      const currentConversationId = conversationId;

      setInputValue("");
      setError(null);
      setStatus("submitted");
      setIsStreaming(true);

      const scope = scopeChips.map((c) => `${c.label}: ${c.value}`).join(" | ");
      const scopedQuestion = scope ? `[Scope] ${scope}\n\n${question}` : question;

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: "user",
        content: scopedQuestion,
      };
      const assistantId = nanoid();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setActiveAssistantId(assistantId);

      const baseToolState: ToolState = {
        input: { model: selectedModel, question },
        state: "input-streaming",
      };

      const initialMeta: AssistantMetadata = {
        prompt: question,
        summary: null,
        chainSteps: buildSummaryChain(null, question, true, []),
        reasoningText: "",
        toolState: null,
        toolLogs: [],
      };

      setAssistantMeta((prev) => ({
        ...prev,
        [assistantId]: initialMeta,
      }));

      let toolMetaApplied = false;

      try {
        // Attach Neon Auth (Stack) JWT when available so server can query Neon Data API with RLS
        let authHeader: Record<string, string> = {};
        try {
          const auth = await (user as any)?.getAuthJson?.();
          const accessToken = auth?.accessToken as string | undefined;
          if (accessToken) authHeader = { Authorization: `Bearer ${accessToken}` };
        } catch {}

        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(currentConversationId ? { "x-conversation-id": currentConversationId } : {}),
            ...authHeader,
          },
        body: JSON.stringify({ question: scopedQuestion, model: selectedModel, conversationId: currentConversationId }),
        });

        if (!response.ok || !response.body) {
          throw new Error("AI response failed");
        }

        setStatus("streaming");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let latestDisplay = "";
        let toolMetaPayload: string | null = null;
        let collectingMeta = false;

        while (true) {
          const { value, done } = await reader.read();
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            if (collectingMeta) {
              toolMetaPayload = (toolMetaPayload ?? "") + chunk;
            } else {
              buffer += chunk;
              let displayBuffer = buffer;
              // Use last occurrence to avoid accidental matches in assistant text
              const sentinelIndex = buffer.lastIndexOf(TOOL_META_SENTINEL);
              if (sentinelIndex >= 0) {
                displayBuffer = buffer.slice(0, sentinelIndex);
                const payloadChunk = buffer.slice(sentinelIndex + TOOL_META_SENTINEL.length);
                toolMetaPayload = (toolMetaPayload ?? "") + payloadChunk;
                buffer = displayBuffer;
                collectingMeta = true;
              }
              latestDisplay = displayBuffer;
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId
                    ? { ...message, content: displayBuffer }
                    : message
                )
              );
            }
          }
          if (done) {
            break;
          }
        }

        try {
          const headerId = response.headers.get("x-conversation-id");
          if (headerId) setConversationId(headerId);
        } catch {}

        let parsedMeta: { toolLogs?: ToolLogEntry[] } | null = null;
        if (toolMetaPayload) {
          const trimmed = toolMetaPayload.trim();
          if (trimmed) {
            try {
              // Safely extract the JSON object in case extra trailing text is present
              let candidate = trimmed;
              const firstBrace = candidate.indexOf("{");
              const lastBrace = candidate.lastIndexOf("}");
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                candidate = candidate.slice(firstBrace, lastBrace + 1);
              }
              parsedMeta = JSON.parse(candidate);
            } catch (metaError) {
              console.error("Failed to parse tool metadata", metaError);
            }
          }
        }

        const toolLogs = Array.isArray(parsedMeta?.toolLogs) ? parsedMeta!.toolLogs : [];
        const summaryRows = extractSummaryRows(toolLogs);
        const summary = summaryRows ? computeSummary(summaryRows) : null;
        const reasoningText = buildReasoningFromToolLogs(toolLogs, summary, scopedQuestion);
        const toolState = deriveToolState(toolLogs, baseToolState.input);

        if (!latestDisplay.trim()) {
          const fallbackAnswer =
            buildAssistantFallback(summary, toolLogs, scopedQuestion) ?? "I wasn't able to generate an answer this time.";
          latestDisplay = fallbackAnswer;
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: fallbackAnswer }
                : message
            )
          );
        }

        setAssistantMeta((prev) => {
          const current = prev[assistantId] ?? initialMeta;
          const nextMeta: AssistantMetadata = {
            ...current,
            summary,
            chainSteps: buildSummaryChain(summary, question, false, toolLogs),
            reasoningText,
            toolState: toolLogs.length > 0 ? toolState ?? null : null,
            toolLogs,
          };
          return {
            ...prev,
            [assistantId]: nextMeta,
          };
        });
        toolMetaApplied = true;

        setStatus(undefined);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("error");
        setAssistantMeta((prev) => {
          const current = prev[assistantId] ?? initialMeta;
          const errorToolState: ToolState = {
            input: current.toolState?.input ?? baseToolState.input,
            output: current.toolState?.output,
            errorText: message,
            state: "output-error",
            toolName: current.toolState?.toolName,
          };

          const nextMeta: AssistantMetadata = {
            ...current,
            reasoningText: current.reasoningText || `Assistant response failed: ${message}`,
            toolState: errorToolState,
            toolLogs: current.toolLogs ?? [],
          };

          return {
            ...prev,
            [assistantId]: nextMeta,
          };
        });
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
        toolMetaApplied = true;
      } finally {
        setIsStreaming(false);
        setActiveAssistantId(null);
        if (!toolMetaApplied) {
          setAssistantMeta((prev) => {
            const current = prev[assistantId];
            if (!current) {
              return prev;
            }
            const updatedToolState: ToolState | null =
              current.toolState?.state === "input-streaming"
                ? { ...current.toolState, state: "input-available" }
                : current.toolState ?? null;
            const nextMeta: AssistantMetadata = {
              ...current,
              chainSteps: buildSummaryChain(current.summary, current.prompt, false, current.toolLogs ?? []),
              toolState: updatedToolState,
              toolLogs: current.toolLogs ?? [],
            };
            return {
              ...prev,
              [assistantId]: nextMeta,
            };
          });
        }
      }
    },
    [model, conversationId]
  );

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      await submitQuestion(message.text ?? "");
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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          // Send the audio for transcription
          await submitQuestion(`Please transcribe this audio: ${base64Audio}`);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        setAudioChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      setError("Failed to access microphone. Please check permissions.");
    }
  }, [submitQuestion]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  }, [mediaRecorder, isRecording]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError("Please select an audio file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      await submitQuestion(`Please transcribe this audio file: ${base64Audio}`);
    };
    reader.readAsDataURL(file);
  }, [submitQuestion]);

  const handleEmailChat = useCallback(async (messageContent: string, conversationId: string | null) => {
    if (!emailAddress.trim()) {
      setError("Please enter an email address");
      return;
    }

    setIsEmailing(true);
    setError(null);

    try {
      const response = await fetch('/api/email/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailAddress,
          subject: "AI Chat Response from MTA Data Assistant",
          conversationId,
          messageContent,
          userEmail: user?.primaryEmail,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowEmailModal(false);
        setEmailAddress("");
        // You could show a success toast here
        alert("Email sent successfully!");
      } else {
        setError(result.error || "Failed to send email");
      }
    } catch (err) {
      setError("Failed to send email. Please try again.");
    } finally {
      setIsEmailing(false);
    }
  }, [emailAddress, user?.primaryEmail]);

  return (
    <div className="flex h-full flex-col space-y-6 rounded-2xl border border-border/60 bg-card/70 p-6 shadow-xl backdrop-blur">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Ask the Transport assistant
          </h2>
          <p className="text-muted-foreground text-sm">
            Explore unified MTA and DOT data with AI-native UI
            elements powered by Vercel AI Elements.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-xs" htmlFor="askai-advanced-toggle">
            <input
              id="askai-advanced-toggle"
              type="checkbox"
              className="accent-primary"
              checked={showAdvanced}
              onChange={(e) => setShowAdvanced(e.currentTarget.checked)}
              aria-checked={showAdvanced}
            />
            Show advanced details
          </label>
          {error && (
            <span className="text-destructive text-sm" role="alert" aria-live="polite">{error}</span>
          )}
        </div>
      </div>

      <Conversation className="min-h-0 flex-1 rounded-xl border border-border/50 bg-background/80" aria-label="Chat messages" role="log">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Start a conversation"
              description="Ask about violations, exemptions, or bus routes to see AI Elements in action."
              icon={<MessageCircleIcon className="size-6" />}
            />
          ) : (
            messages.map((message) => {
              const meta =
                message.role === "assistant"
                  ? assistantMeta[message.id]
                  : undefined;
              const summaryRows = meta?.summary?.rows.slice(0, 5) ?? null;
              const summaryCard = meta?.summary && showAdvanced ? (
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
                                totalViolations: meta.summary?.totalViolations,
                                totalExempt: meta.summary?.totalExempt,
                                exemptShare: meta.summary?.exemptShare,
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
                        {formatNumber(meta.summary.totalViolations)}
                      </p>
                    </div>
                    <div className="grid gap-1">
                      <ArtifactDescription>Exempt share</ArtifactDescription>
                      <p className="font-semibold text-lg">
                        {formatPercent(meta.summary.exemptShare)}
                        <span className="text-muted-foreground text-xs">
                          {" "}({formatNumber(meta.summary.totalExempt)} exempt)
                        </span>
                      </p>
                    </div>
                    <div className="grid gap-1">
                      <ArtifactDescription>Top routes</ArtifactDescription>
                      <div className="grid gap-1.5">
                        {meta.summary.topRoutes.map((route) => (
                          <div
                            key={route.route}
                            className="flex items-center justify-between"
                          >
                            <span className="text-muted-foreground text-xs uppercase tracking-wide">
                              {route.route || "(unassigned)"}
                            </span>
                            <span className="font-medium text-sm">
                              {formatNumber(route.violations)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ArtifactContent>
                </Artifact>
              ) : null;
              const toolHeaderType: `tool-${string}` = meta?.toolState?.toolName
                ? (`tool-${meta.toolState.toolName.replace(/[^a-zA-Z0-9_-]/g, "-") || "generic"}` as `tool-${string}`)
                : "tool-generic";

              return (
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
                              tooltip="Email this response"
                              onClick={() => setShowEmailModal(true)}
                            >
                              <MailIcon className="size-4" />
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
                          <div className="flex items-center gap-2 text-muted-foreground text-sm" role="status" aria-live="polite">
                            <Loader />
                            <span>Streaming live response…</span>
                          </div>
                        )}

                        {isRecording && (
                          <div className="flex items-center gap-2 status-negative text-sm" role="status" aria-live="polite">
                            <div className="h-2 w-2 rounded-full bg-[color:var(--destructive)] animate-pulse" />
                            <span>Recording audio…</span>
                          </div>
                        )}

                        {message.content && (
                          <Branch defaultBranch={0}>
                            <BranchMessages>
                              <div className="grid gap-4">
                                <Response>{message.content}</Response>
                                {(() => {
                                  // Render ALL visuals and artifacts found in tool logs as well as the last toolState payload
                                  const cards: ReactNode[] = [];
                                  
                                  // Handle charts
                                  const visuals = (meta?.toolLogs || [])
                                    .map((log) => {
                                      const out: any = log?.output;
                                      const payload = out && (out.chart ? out : (out.output && out.output.chart ? out.output : null));
                                      return payload ? { id: log.id, payload, type: 'chart' } : null;
                                    })
                                    .filter(Boolean) as Array<{ id: string; payload: any; type: string }>;
                                  
                                  // Handle artifacts
                                  const artifacts = (meta?.toolLogs || [])
                                    .map((log) => {
                                      const out: any = log?.output;
                                      const payload = out && (out.artifact ? out : (out.output && out.output.artifact ? out.output : null));
                                      return payload ? { id: log.id, payload, type: 'artifact' } : null;
                                    })
                                    .filter(Boolean) as Array<{ id: string; payload: any; type: string }>;
                                  
                                  const lastOut: any = meta?.toolState?.output;
                                  const lastChartPayload = lastOut && (lastOut.chart ? lastOut : (lastOut.output && lastOut.output.chart ? lastOut.output : null));
                                  const lastArtifactPayload = lastOut && (lastOut.artifact ? lastOut : (lastOut.output && lastOut.output.artifact ? lastOut.output : null));
                                  
                                  if (lastChartPayload) {
                                    visuals.push({ id: `${meta?.toolState?.toolName || "tool"}-final`, payload: lastChartPayload, type: 'chart' });
                                  }
                                  if (lastArtifactPayload) {
                                    artifacts.push({ id: `${meta?.toolState?.toolName || "tool"}-final`, payload: lastArtifactPayload, type: 'artifact' });
                                  }
                                  
                                  // Render charts
                                  visuals.forEach((v, idx) => {
                                    cards.push(
                                      <div key={`chart-${v.id}-${idx}`} className="rounded-md border border-border/60 bg-background/70 p-2">
                                        <ChartRenderer spec={v.payload.chart} data={v.payload.data} />
                                      </div>
                                    );
                                  });
                                  
                                  // Render artifacts
                                  artifacts.forEach((a, idx) => {
                                    const getActionIcon = (type: string) => {
                                      switch (type) {
                                        case 'copy': return CopyIcon;
                                        case 'download': return DownloadIcon;
                                        case 'share': return ShareIcon;
                                        case 'edit': return EditIcon;
                                        default: return CopyIcon;
                                      }
                                    };

                                    const handleActionClick = (action: any) => {
                                      switch (action.type) {
                                        case 'copy':
                                          navigator.clipboard?.writeText(a.payload.artifact.content);
                                          break;
                                        case 'download':
                                          const blob = new Blob([a.payload.artifact.content], { type: 'text/plain' });
                                          const url = URL.createObjectURL(blob);
                                          const downloadLink = document.createElement('a');
                                          downloadLink.href = url;
                                          downloadLink.download = `${a.payload.artifact.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
                                          document.body.appendChild(downloadLink);
                                          downloadLink.click();
                                          document.body.removeChild(downloadLink);
                                          URL.revokeObjectURL(url);
                                          break;
                                        case 'share':
                                          if (navigator.share) {
                                            navigator.share({
                                              title: a.payload.artifact.title,
                                              text: a.payload.artifact.content,
                                            });
                                          } else {
                                            navigator.clipboard?.writeText(a.payload.artifact.content);
                                          }
                                          break;
                                        case 'edit':
                                          setInputValue(`Edit this document: ${a.payload.artifact.title}\n\n${a.payload.artifact.content}`);
                                          break;
                                        default:
                                          navigator.clipboard?.writeText(a.payload.artifact.content);
                                      }
                                    };

                                    cards.push(
                                      <div key={`artifact-${a.id}-${idx}`} className="rounded-md border border-border/60 bg-background/70 p-2">
                                        <Artifact>
                                          <ArtifactHeader>
                                            <div>
                                              <ArtifactTitle>{a.payload.artifact.title}</ArtifactTitle>
                                              {a.payload.artifact.description && (
                                                <ArtifactDescription>{a.payload.artifact.description}</ArtifactDescription>
                                              )}
                                            </div>
                                            {a.payload.artifact.actions && a.payload.artifact.actions.length > 0 && (
                                              <ArtifactActions>
                                                {a.payload.artifact.actions.map((action: any, actionIdx: number) => (
                                                  <ArtifactAction
                                                    key={actionIdx}
                                                    label={action.label}
                                                    tooltip={action.tooltip}
                                                    icon={getActionIcon(action.type)}
                                                    onClick={() => handleActionClick(action)}
                                                  />
                                                ))}
                                              </ArtifactActions>
                                            )}
                                          </ArtifactHeader>
                                          <ArtifactContent>
                                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                              {a.payload.artifact.content}
                                            </div>
                                          </ArtifactContent>
                                        </Artifact>
                                      </div>
                                    );
                                  });
                                  
                                  if (cards.length === 0) return null;
                                  return <>{cards}</>;
                                })()}
                                {meta?.summary && showAdvanced && (
                                  <InlineCitation className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <InlineCitationText>
                                      Source: NYC Open Data
                                    </InlineCitationText>
                                    <InlineCitationCard>
                                      <InlineCitationCardTrigger sources={[DATASET_URL]} />
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
                                {summaryCard}
                                {summaryRows && showAdvanced && (
                                  <CodeBlock
                                    code={JSON.stringify(summaryRows, null, 2)}
                                    language="json"
                                    showLineNumbers
                                  >
                                    <CodeBlockCopyButton aria-label="Copy JSON" />
                                  </CodeBlock>
                                )}
                              </div>
                            </BranchMessages>
                            {showAdvanced && (
                              <BranchSelector from="assistant">
                                <BranchPrevious />
                                <BranchPage />
                                <BranchNext />
                              </BranchSelector>
                            )}
                          </Branch>
                        )}

                        {showAdvanced && (
                          <ChainOfThought defaultOpen={false}>
                            <ChainOfThoughtHeader />
                            <ChainOfThoughtContent>
                              <ChainOfThoughtSearchResults>
                                <ChainOfThoughtSearchResult>
                                  {meta?.summary
                                    ? `${meta.summary.routeCount} routes analysed`
                                    : meta?.toolLogs?.length
                                    ? `${meta.toolLogs.length} tool ${meta.toolLogs.length === 1 ? "call" : "calls"}`
                                    : "No tool calls"}
                                </ChainOfThoughtSearchResult>
                              </ChainOfThoughtSearchResults>
                              {(meta?.chainSteps ?? []).map((step, index) => (
                                <ChainOfThoughtStep
                                  key={`${index}-${step.label}`}
                                  label={step.label}
                                  description={step.description}
                                  status={step.status}
                                />
                              ))}
                            </ChainOfThoughtContent>
                          </ChainOfThought>
                        )}

                        {showAdvanced && meta?.toolLogs && meta.toolLogs.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Task Progress</h4>
                            <Task defaultOpen={false}>
                              <TaskTrigger 
                                title="Data Analysis Workflow" 
                                status={meta.toolState?.state === "output-error" ? "error" : "completed"}
                              />
                              <TaskContent>
                                <TaskItem>
                                  Connected to <TaskItemFile>neon-db</TaskItemFile> database
                                </TaskItem>
                                <TaskItem>
                                  Executed SQL query with {meta.toolLogs.length} tool call{meta.toolLogs.length !== 1 ? 's' : ''}
                                </TaskItem>
                                <TaskItem>
                                  Processed {meta.summary ? formatNumber(meta.summary.rows.length) : 'N/A'} data records
                                </TaskItem>
                                <TaskItem>
                                  Generated analysis with {formatPercent(meta.summary?.exemptShare ?? 0)} exempt share
                                </TaskItem>
                              </TaskContent>
                            </Task>
                          </div>
                        )}

                        {showAdvanced && (
                          <Reasoning
                            isStreaming={isStreaming && activeAssistantId === message.id}
                            defaultOpen
                            duration={meta?.summary ? Math.max(1, Math.round(meta.summary.rows.length / 40)) : undefined}
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>
                              {meta?.reasoningText || "Reasoning unavailable for this turn."}
                            </ReasoningContent>
                          </Reasoning>
                        )}

                        {meta?.toolState && showAdvanced && (
                          <Tool defaultOpen className="bg-background/70">
                            <ToolHeader
                              type={toolHeaderType}
                              state={meta.toolState.state}
                            />
                            <ToolContent>
                              <ToolInput input={meta.toolState.input} />
                              {(() => {
                                const out: any = meta.toolState.output;
                                const payload = out && (out.chart ? out : out.output && out.output.chart ? out.output : null);
                                if (payload) {
                                  return (
                                    <div className="rounded-md border border-border/60 bg-background/70 p-2">
                                      <ChartRenderer spec={payload.chart} data={payload.data} />
                                    </div>
                                  );
                                }
                                return (
                                  <ToolOutput
                                    output={meta.toolState.output}
                                    errorText={meta.toolState.errorText}
                                  />
                                );
                              })()}
                            </ToolContent>
                          </Tool>
                        )}

                        {meta?.summary && showAdvanced && (
                          <Sources>
                            <SourcesTrigger count={1} />
                            <SourcesContent>
                              <Source href={DATASET_URL} title="Automated Bus Lane Enforcement Violations">
                                ACE violations dataset on data.ny.gov
                              </Source>
                            </SourcesContent>
                          </Sources>
                        )}

                        {showAdvanced && (
                          <OpenIn query={meta?.prompt || message.content || ""}>
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
                        )}
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
              );
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Component Demo</h3>
            <div className="space-y-2">
              <Task defaultOpen={true}>
                <TaskTrigger title="Task Component Example" status="completed" />
                <TaskContent>
                  <TaskItem>
                    This demonstrates the <TaskItemFile>Task</TaskItemFile> component
                  </TaskItem>
                  <TaskItem>
                    It supports different statuses: pending, in_progress, completed, error
                  </TaskItem>
                  <TaskItem>
                    You can nest <TaskItemFile>TaskItemFile</TaskItemFile> components for file references
                  </TaskItem>
                  <TaskItem>
                    Perfect for showing workflow progress and task lists
                  </TaskItem>
                </TaskContent>
              </Task>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Quick suggestions
          </p>
          <div className="flex flex-wrap gap-2">
            {personaOptions.map((option) => {
              const isActive = activePersona === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setActivePersona(option.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    isActive
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <Suggestions>
          {activePrompts.map((suggestion) => (
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
        aria-busy={status === "submitted" || status === "streaming"}
        aria-label="Message input form"
      >
        <PromptInputBody>
          <PromptInputTextarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Ask about transit data, violations, traffic patterns, or trends…"
            aria-label="Message"
          />
        </PromptInputBody>
        <PromptInputToolbar>
          <PromptInputTools>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                  isRecording
                    ? "status-negative border-[color:var(--destructive)]"
                    : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary"
                )}
                style={isRecording ? { backgroundColor: "color-mix(in srgb, var(--destructive) 18%, transparent)" } : undefined}
                title={isRecording ? "Stop recording" : "Start recording"}
                disabled={status === "submitted" || status === "streaming"}
              >
                {isRecording ? (
                  <MicOffIcon className="h-4 w-4" />
                ) : (
                  <MicIcon className="h-4 w-4" />
                )}
              </button>
              <label
                htmlFor="audio-upload"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                title="Upload audio file"
              >
                <UploadIcon className="h-4 w-4" />
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={status === "submitted" || status === "streaming"}
                />
              </label>
            </div>
            <PromptInputModelSelect value={model} onValueChange={setModel}>
              <PromptInputModelSelectTrigger>
                <PromptInputModelSelectValue placeholder="Model" />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                <PromptInputModelSelectItem value="openai/gpt-5-mini">
                  GPT-5 Mini (via Gateway)
                </PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="xai/grok-4-fast-reasoning">
                  Grok-4 Fast Reasoning (xAI)
                </PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="anthropic/claude-sonnet-4">
                  Claude Sonnet 4 (Anthropic)
                </PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="google/gemini-2.5-flash">
                  Gemini 2.5 Flash (Google)
                </PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="google/gemini-2.5-pro">
                  Gemini 2.5 Pro (Google)
                </PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="openai/gpt-oss-120b">
                  GPT-OSS 120B (OpenAI)
                </PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="moonshotai/kimi-k2-0905">
                  Kimi K2 0905 (Moonshot)
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

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4 shadow-soft-lg border border-border/60">
            <h3 className="text-lg font-semibold mb-4">Email Chat Response</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-input" className="block text-sm font-medium text-foreground/80 mb-1">
                  Email Address
                </label>
                <input
                  id="email-input"
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
                  disabled={isEmailing}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailAddress("");
                    setError(null);
                  }}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground"
                  disabled={isEmailing}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const lastMessage = messages[messages.length - 1];
                    if (lastMessage && lastMessage.role === "assistant") {
                      handleEmailChat(lastMessage.content, conversationId);
                    }
                  }}
                  disabled={isEmailing || !emailAddress.trim()}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEmailing ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
