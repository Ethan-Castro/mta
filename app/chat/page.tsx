"use client";

import { useMemo, useState } from "react";
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
import {
  AI_STARTER_PROMPTS,
  ANALYST_SCENARIOS,
  DOCUMENTATION_LINKS,
} from "@/lib/data/insights";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat/ui" }),
  });

  const starterPrompts = useMemo(() => AI_STARTER_PROMPTS.slice(0, 4), []);
  const quickDocs = useMemo(() => DOCUMENTATION_LINKS.slice(0, 4), []);
  const scenarios = useMemo(() => ANALYST_SCENARIOS.slice(0, 2), []);

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
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="relative rounded-lg border border-foreground/10 h-[620px] flex flex-col">
          <div className="px-5 pt-5 pb-3 border-b border-foreground/10">
            <h1 className="text-lg font-semibold tracking-tight">ACE copilot</h1>
            <p className="text-xs text-foreground/60">Ask for insights, code, SQL, or visualizations across ACE, congestion pricing, and campus routes.</p>
          </div>
          <Conversation className="relative w-full flex-1">
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-10" />}
                  title="Start with a route or question"
                  description="Compare campus corridors, audit exempt fleets, or simulate next month’s violations."
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
          <div className="px-5 pb-5">
            <PromptInput onSubmit={handleSubmit} className="relative">
              <PromptInputTextarea
                value={input}
                placeholder="E.g. Compare ACE speed gains for M15-SBS vs Q46 with charts"
                onChange={(e) => setInput(e.currentTarget.value)}
                className="pr-12"
              />
              <PromptInputSubmit status={status} disabled={!input.trim()} className="absolute bottom-1 right-1" />
            </PromptInput>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-lg border border-foreground/10 p-4 space-y-3">
            <h2 className="text-sm font-medium">Quick prompts</h2>
            <div className="space-y-2 text-sm">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="w-full text-left rounded-md border border-foreground/10 px-3 py-2 hover:border-foreground/30 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-foreground/10 p-4 space-y-3">
            <h2 className="text-sm font-medium">Playbooks</h2>
            <div className="space-y-2 text-xs text-foreground/70">
              {scenarios.map((scenario) => (
                <div key={scenario.title} className="rounded-md border border-foreground/10 px-3 py-2">
                  <div className="font-medium text-foreground/90 text-sm">{scenario.title}</div>
                  <p className="mt-1 leading-relaxed">{scenario.description}</p>
                  <button
                    type="button"
                    onClick={() => setInput(`Follow the playbook: ${scenario.playbook}`)}
                    className="mt-2 inline-flex items-center text-xs text-blue-600 hover:underline"
                  >
                    Ask the copilot
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-foreground/10 p-4 space-y-3">
            <h2 className="text-sm font-medium">Key documentation</h2>
            <ul className="space-y-2 text-xs text-foreground/70">
              {quickDocs.map((doc) => (
                <li key={doc.href} className="rounded-md border border-foreground/10 px-3 py-2">
                  <a href={doc.href} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground/90 text-sm hover:underline">
                    {doc.title}
                  </a>
                  <p className="mt-1 leading-relaxed">{doc.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

