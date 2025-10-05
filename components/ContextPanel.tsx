"use client";

import { useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { HelpCircleIcon, XIcon, ChevronDownIcon, ChevronUpIcon, LightbulbIcon, InfoIcon, AlertCircleIcon } from "lucide-react";
import { SmartTooltip } from "@/components/ui/smart-tooltip";
import { findTerm } from "@/lib/glossary";

interface ContextInfo {
  title: string;
  description: string;
  type: 'tip' | 'explanation' | 'warning' | 'info';
  relatedTerms?: string[];
  examples?: string[];
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

// Context information database
const CONTEXT_DATABASE: Record<string, ContextInfo[]> = {
  '/executive': [
    {
      title: 'What Executives Need to Know',
      description: 'These metrics show whether bus cameras are making transit faster and more reliable for NYC residents. Higher speed improvements and lower violation counts mean the system is working.',
      type: 'explanation',
      relatedTerms: ['speed-uplift', 'violations', 'ace-coverage'],
      examples: [
        'If speed uplift is 8%, buses that took 30 minutes now take 27-28 minutes',
        'Fewer violations means fewer cars blocking buses'
      ]
    },
    {
      title: 'How to Present These Numbers',
      description: 'Focus on passenger impact: "Cameras helped 15,000 students get to class faster" rather than "ACE coverage increased 12%"',
      type: 'tip',
      examples: [
        'Instead of "CBD violations dropped 23%" say "Downtown buses face 23% fewer traffic delays"',
        'Replace "Route M15-SBS shows positive speed uplift" with "M15 bus riders save 3 minutes per trip"'
      ]
    }
  ],
  '/operations': [
    {
      title: 'Understanding Route Performance',
      description: 'Route comparisons show which bus lines benefit most from camera enforcement. Use this to prioritize where to expand the program.',
      type: 'explanation',
      relatedTerms: ['route-comparison', 'hotspots', 'ace-coverage'],
      examples: [
        'Routes with high violation counts but no cameras are good expansion targets',
        'Routes with cameras but still slow speeds may need additional enforcement'
      ]
    },
    {
      title: 'Spotting Problem Areas',
      description: 'Hotspots with repeat violations suggest enforcement isn\'t deterring drivers. Consider additional signage, physical barriers, or increased penalties.',
      type: 'warning',
      relatedTerms: ['hotspots', 'repeaters']
    }
  ],
  '/students': [
    {
      title: 'Student Impact Analysis',
      description: 'CUNY students rely heavily on buses to get to campus. Improved bus speeds directly translate to better educational outcomes through reduced tardiness and stress.',
      type: 'explanation',
      relatedTerms: ['student-exposure'],
      examples: [
        'A 5-minute improvement helps students make connecting classes',
        'Reliable buses reduce need for expensive alternatives like rideshare'
      ]
    }
  ],
  '/policy': [
    {
      title: 'Policy Effectiveness Metrics',
      description: 'Congestion pricing and bus lane enforcement work together. Look for correlation between pricing implementation and violation reductions.',
      type: 'explanation',
      relatedTerms: ['congestion-pricing', 'cbd-violations', 'enforcement-effectiveness']
    }
  ],
  '/map': [
    {
      title: 'Reading the Map',
      description: 'Red areas show high violation concentrations. Blue areas show camera-monitored routes. Where these overlap, you can measure enforcement effectiveness.',
      type: 'tip',
      relatedTerms: ['hotspots', 'ace-coverage']
    }
  ],
  '/chat': [
    {
      title: 'Getting Better AI Answers',
      description: 'Ask specific questions about routes, time periods, or student populations. The AI has access to real MTA data and can generate visualizations.',
      type: 'tip',
      examples: [
        '"How did the M15 bus perform in September 2024?"',
        '"Show me violation trends for CUNY campus routes"',
        '"Create a map of problem areas in downtown Manhattan"'
      ]
    }
  ]
};

// Metric-specific context that appears when hovering over metrics
const METRIC_CONTEXT: Record<string, ContextInfo> = {
  'speed-uplift': {
    title: 'Why Speed Matters',
    description: 'Even small speed improvements have big impacts. A 5% speed increase can mean the difference between students making their classes and being late.',
    type: 'explanation',
    examples: ['5% faster = 1-2 minutes saved per trip', '10% faster = reliable enough to depend on'],
    relatedTerms: ['bus-speed', 'reliability']
  },
  'violations': {
    title: 'What Each Violation Means',
    description: 'Every violation represents a moment when 40+ bus passengers were delayed because one car blocked the lane.',
    type: 'explanation',
    examples: ['1,000 violations = roughly 40,000 passenger delays', 'Peak hour violations cause the most disruption'],
    relatedTerms: ['enforcement-effectiveness']
  },
  'cbd-violations': {
    title: 'Downtown Impact',
    description: 'CBD violations affect the most people because downtown buses carry more passengers and operate in denser areas.',
    type: 'explanation',
    examples: ['One CBD violation might delay 100+ passengers', 'Financial District violations affect commuters from all boroughs'],
    relatedTerms: ['congestion-pricing']
  }
};

interface ContextPanelProps {
  className?: string;
  metric?: string;
  autoShow?: boolean;
}

export default function ContextPanel({
  className,
  metric,
  autoShow = false
}: ContextPanelProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(autoShow);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  // Get context for current page
  const pageContext = CONTEXT_DATABASE[pathname] || [];
  const metricContext = metric ? METRIC_CONTEXT[metric] : null;

  // Auto-show for certain pages
  useEffect(() => {
    if (autoShow || pathname === '/') {
      setIsOpen(true);
    }
  }, [pathname, autoShow]);

  if (pageContext.length === 0 && !metricContext) {
    return null;
  }

  const contextItems = [
    ...(metricContext ? [metricContext] : []),
    ...pageContext
  ];

  const getIcon = (type: ContextInfo['type']) => {
    switch (type) {
      case 'tip':
        return LightbulbIcon;
      case 'warning':
        return AlertCircleIcon;
      case 'explanation':
        return InfoIcon;
      default:
        return InfoIcon;
    }
  };

  const getTypeColor = (type: ContextInfo['type']) => {
    switch (type) {
      case 'tip':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'explanation':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={cn(
      "fixed right-4 top-1/2 -translate-y-1/2 z-40 w-80 max-h-[80vh] transition-all duration-300",
      isOpen ? "translate-x-0" : "translate-x-full",
      className
    )}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "absolute left-0 top-8 -translate-x-full rounded-l-lg bg-primary text-primary-foreground p-2 shadow-lg transition-all hover:bg-primary/90",
          isOpen && "-translate-x-2"
        )}
        aria-label={isOpen ? "Close help panel" : "Open help panel"}
      >
        <HelpCircleIcon className="size-5" />
      </button>

      {/* Panel Content */}
      <div className="bg-card/95 backdrop-blur border border-border/60 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <HelpCircleIcon className="size-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              {metricContext ? 'About This Metric' : 'Page Guide'}
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {contextItems.map((item, index) => {
            const Icon = getIcon(item.type);
            const isExpanded = expandedSection === index;

            return (
              <div key={index} className="border-b border-border/20 last:border-b-0">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : index)}
                  className="w-full p-4 text-left hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-1.5 rounded-lg flex-shrink-0",
                      getTypeColor(item.type)
                    )}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        {isExpanded ? (
                          <ChevronUpIcon className="size-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDownIcon className="size-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="pl-12 space-y-3">
                      <p className="text-sm text-foreground leading-relaxed">
                        {item.description}
                      </p>

                      {item.examples && item.examples.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground mb-2">Examples:</h5>
                          <ul className="space-y-1">
                            {item.examples.map((example, i) => (
                              <li key={i} className="text-xs text-foreground/80 leading-relaxed">
                                • {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.relatedTerms && item.relatedTerms.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground mb-2">Related Terms:</h5>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedTerms.map((termId) => {
                              const term = findTerm(termId);
                              return (
                                <SmartTooltip key={termId} termId={termId}>
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full cursor-help">
                                    {term?.plain || termId}
                                  </span>
                                </SmartTooltip>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {item.actions && item.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {item.actions.map((action, i) => (
                            <button
                              key={i}
                              onClick={action.action}
                              className={cn(
                                "text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
                                action.variant === 'primary'
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              )}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-muted/20 border-t border-border/40">
          <p className="text-xs text-muted-foreground text-center">
            Need more help? Try the{' '}
            <a href="/chat" className="text-primary hover:underline">
              AI Assistant
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook for showing metric-specific context
export function useMetricContext(metricId: string) {
  return {
    showContext: () => {
      // This could trigger a modal or highlight the context panel
      console.log(`Showing context for metric: ${metricId}`);
    },
    hasContext: !!METRIC_CONTEXT[metricId]
  };
}

// Wrapper component that adds context to any metric display
interface MetricWithContextProps {
  metricId: string;
  children: ReactNode;
  showContextButton?: boolean;
  className?: string;
}

export function MetricWithContext({
  metricId,
  children,
  showContextButton = true,
  className
}: MetricWithContextProps) {
  const [showPanel, setShowPanel] = useState(false);
  const context = METRIC_CONTEXT[metricId];

  if (!context) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative", className)}>
      {children}
      {showContextButton && (
        <button
          onClick={() => setShowPanel(true)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircleIcon className="size-4" />
        </button>
      )}
      {showPanel && (
        <ContextPanel
          metric={metricId}
          autoShow={true}
          className="fixed"
        />
      )}
    </div>
  );
}