"use client";

import { useState } from "react";
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
export default function ExecutivePage() {
  const [showExplain, setShowExplain] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat/ui" }),
  });

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


