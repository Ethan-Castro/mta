"use client";

import ExecutiveSummary from "@/components/ExecutiveSummary";

export default function TestExecutivePage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test Executive Summary Component</h1>
        <p className="text-muted-foreground mb-8">
          This page tests the ExecutiveSummary component with the fixed AI output rendering.
        </p>
        <ExecutiveSummary />
      </div>
    </div>
  );
}
