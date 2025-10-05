"use client";

import { ReactNode } from 'react';
import { cn } from "@/lib/utils";
import { SmartTooltip } from "@/components/ui/smart-tooltip";
import { AdaptiveMetric, SimpleContent, DetailedContent, ExpertContent } from "@/components/ViewModeToggle";
import StoryCard from "@/components/StoryCard";
import { MetricWithContext } from "@/components/ContextPanel";

interface EnhancedInsightCardProps {
  // Story card props for simple mode
  storyIcon: string;
  storyHeadline: string;
  storyMetric: string;
  storyDescription: string;
  storyBeforeAfter?: {
    before: string;
    after: string;
    improvement?: boolean;
  };
  storyTrend?: 'up' | 'down' | 'neutral';
  storyTrendLabel?: string;

  // Traditional insight card props for detailed/expert modes
  title: string;
  value: string;
  subline: string;
  trendLabel?: string;
  trendDelta?: string;
  trendPositive?: boolean;

  // Adaptive metric props
  simpleValue?: string;
  simpleDescription?: string;
  detailedValue?: string;
  detailedDescription?: string;
  expertValue?: string;
  expertDescription?: string;
  technicalDetails?: ReactNode;

  // Context
  metricId?: string;
  termId?: string;

  className?: string;
}

export default function EnhancedInsightCard({
  storyIcon,
  storyHeadline,
  storyMetric,
  storyDescription,
  storyBeforeAfter,
  storyTrend,
  storyTrendLabel,
  title,
  value,
  subline,
  trendLabel,
  trendDelta,
  trendPositive,
  simpleValue,
  simpleDescription,
  detailedValue,
  detailedDescription,
  expertValue,
  expertDescription,
  technicalDetails,
  metricId,
  termId,
  className
}: EnhancedInsightCardProps) {
  const content = (
    <>
      <SimpleContent>
        <StoryCard
          icon={storyIcon}
          headline={storyHeadline}
          metric={storyMetric}
          story={storyDescription}
          beforeAfter={storyBeforeAfter}
          trend={storyTrend}
          trendLabel={storyTrendLabel}
          theme="mta"
          className={className}
        />
      </SimpleContent>

      <DetailedContent>
        <AdaptiveMetric
          title={termId ? <SmartTooltip termId={termId}>{title}</SmartTooltip> : title}
          simpleValue={simpleValue || value}
          simpleDescription={simpleDescription || subline}
          detailedValue={detailedValue || value}
          detailedDescription={detailedDescription || subline}
          expertValue={expertValue}
          expertDescription={expertDescription}
          technicalDetails={technicalDetails}
          className={className}
        />
      </DetailedContent>

      <ExpertContent>
        <AdaptiveMetric
          title={termId ? <SmartTooltip termId={termId}>{title}</SmartTooltip> : title}
          simpleValue={simpleValue || value}
          simpleDescription={simpleDescription || subline}
          detailedValue={detailedValue || value}
          detailedDescription={detailedDescription || subline}
          expertValue={expertValue || `${value} ${trendDelta ? `(${trendDelta})` : ''}`}
          expertDescription={expertDescription || `${subline} ${trendLabel || ''}`}
          technicalDetails={technicalDetails}
          className={className}
        />
      </ExpertContent>
    </>
  );

  if (metricId) {
    return (
      <MetricWithContext metricId={metricId}>
        {content}
      </MetricWithContext>
    );
  }

  return content;
}