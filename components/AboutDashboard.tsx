"use client";

import * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function AboutDashboard() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-4 hover:bg-primary/10 transition-colors">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-primary">About This Dashboard</h3>
          </div>
          <ChevronDown className={`h-4 w-4 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 rounded-2xl border border-border/60 bg-card/80 p-5 space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">What is this dashboard?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This is a real-time monitoring center for New York City&apos;s Automated Camera Enforcement (ACE) program.
              ACE uses cameras to catch cars illegally blocking bus lanes, helping buses run faster and more reliably for passengers.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/40 bg-background/60 p-3">
              <h5 className="text-xs font-semibold mb-1.5 text-primary">📊 What you&apos;ll see</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Live violation counts from cameras</li>
                <li>• Routes with most enforcement activity</li>
                <li>• System health and data status</li>
                <li>• Social media monitoring</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border/40 bg-background/60 p-3">
              <h5 className="text-xs font-semibold mb-1.5 text-primary">💡 Key concepts</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>Violations:</strong> Cars caught blocking buses</li>
                <li>• <strong>Exempt:</strong> Authorized vehicles (police, fire)</li>
                <li>• <strong>SBS:</strong> Select Bus Service (express routes)</li>
                <li>• <strong>Lookback:</strong> Time period being monitored</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs text-muted-foreground">
              <strong className="text-amber-600 dark:text-amber-500">💭 Hover over underlined terms</strong> to see plain-language explanations and examples.
              Click the info icons for detailed tooltips about technical concepts.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-semibold mb-2">How to use this dashboard</h5>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Check <strong>Data & System Status</strong> to ensure you&apos;re viewing live data</li>
              <li>Review <strong>Most Active Routes</strong> to see where enforcement is happening</li>
              <li>Use the <strong>AI chat</strong> on the right to ask questions and get insights</li>
              <li>Monitor <strong>social feeds</strong> to see real-time MTA updates</li>
            </ol>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
