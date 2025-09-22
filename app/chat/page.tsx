"use client";

import dynamic from "next/dynamic";
const AskAI = dynamic(() => import("@/components/AskAI"), { ssr: false });
const ToolsChat = dynamic(() => import("@/components/ToolsChat"), { ssr: false });

export default function ChatPage() {
  return (
    <div className="mx-auto h-[calc(100vh-5rem)] max-w-6xl p-4 sm:p-6">
      <div className="grid h-full gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="flex h-full flex-col">
          <AskAI />
        </div>
        <div className="flex h-full flex-col">
          <ToolsChat />
        </div>
      </div>
    </div>
  );
}
