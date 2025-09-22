"use client";

import dynamic from "next/dynamic";
const AskAI = dynamic(() => import("@/components/AskAI"), { ssr: false });

export default function ChatPage() {
  return (
    <div className="mx-auto h-[calc(100vh-5rem)] max-w-5xl p-4 sm:p-6">
      <div className="flex h-full flex-col">
        <AskAI />
      </div>
    </div>
  );
}
