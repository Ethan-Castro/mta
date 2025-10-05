"use client";

import { cn } from "@/lib/utils";
import { ArrowRightIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react";

export interface BeforeAfterData {
  before: string;
  after: string;
  unit?: string;
  improvement?: boolean;
}

export interface StoryCardProps {
  icon: string;
  headline: string;
  metric?: string;
  story: string;
  beforeAfter?: BeforeAfterData;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  size?: 'default' | 'large';
  theme?: 'light' | 'dark' | 'mta';
  className?: string;
  onClick?: () => void;
}

export default function StoryCard({
  icon,
  headline,
  metric,
  story,
  beforeAfter,
  trend,
  trendLabel,
  size = 'default',
  theme = 'light',
  className,
  onClick
}: StoryCardProps) {
  const isInteractive = !!onClick;

  const TrendIcon = trend === 'up' ? TrendingUpIcon : trend === 'down' ? TrendingDownIcon : MinusIcon;

  // Theme-based styling
  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          card: 'border-gray-200 bg-white text-black shadow-lg',
          iconBg: 'bg-gray-100 text-gray-800',
          metric: 'text-gray-800',
          story: 'text-gray-700',
          beforeAfter: 'bg-gray-50 border-gray-200',
          trendUp: 'text-green-600',
          trendDown: 'text-red-600',
          trendNeutral: 'text-gray-500',
          hover: 'hover:border-gray-400'
        };
      case 'dark':
        return {
          card: 'border-gray-700 bg-black text-white shadow-xl',
          iconBg: 'bg-gray-800 text-white',
          metric: 'text-white',
          story: 'text-gray-300',
          beforeAfter: 'bg-gray-900 border-gray-700',
          trendUp: 'text-green-400',
          trendDown: 'text-red-400',
          trendNeutral: 'text-gray-400',
          hover: 'hover:border-gray-500'
        };
      case 'mta':
        return {
          card: 'border-blue-300 bg-gradient-to-br from-blue-50 to-white text-gray-900 shadow-lg',
          iconBg: 'bg-blue-600 text-white',
          metric: 'text-blue-700',
          story: 'text-gray-800',
          beforeAfter: 'bg-blue-50 border-blue-200',
          trendUp: 'text-green-600',
          trendDown: 'text-orange-600',
          trendNeutral: 'text-blue-600',
          hover: 'hover:border-blue-500'
        };
    }
  };

  const themeClasses = getThemeClasses();
  const trendColor = trend === 'up' ? themeClasses.trendUp : trend === 'down' ? themeClasses.trendDown : themeClasses.trendNeutral;

  return (
    <div
      className={cn(
        "group rounded-xl transition-all duration-300",
        themeClasses.card,
        size === 'large' ? 'p-6' : 'p-4',
        isInteractive && cn("cursor-pointer hover:-translate-y-1 hover:shadow-xl", themeClasses.hover),
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          "flex-shrink-0 flex items-center justify-center rounded-lg",
          themeClasses.iconBg,
          size === 'large' ? 'size-12 text-2xl' : 'size-10 text-xl'
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold leading-tight",
            size === 'large' ? 'text-lg' : 'text-base'
          )}>
            {headline}
          </h3>
          {metric && (
            <div className={cn(
              "font-bold mt-1",
              themeClasses.metric,
              size === 'large' ? 'text-2xl' : 'text-xl'
            )}>
              {metric}
            </div>
          )}
        </div>
        {trend && (
          <div className="flex-shrink-0 flex items-center gap-1">
            <TrendIcon className={cn("size-4", trendColor)} />
            {trendLabel && (
              <span className={cn("text-xs font-medium", trendColor)}>
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Story */}
      <p className={cn(
        "leading-relaxed mb-4",
        themeClasses.story,
        size === 'large' ? 'text-base' : 'text-sm'
      )}>
        {story}
      </p>

      {/* Before/After Comparison */}
      {beforeAfter && (
        <div className={cn("rounded-lg p-3", themeClasses.beforeAfter)}>
          <div className="flex items-center justify-between gap-4">
            <div className="text-center">
              <div className="text-xs opacity-60 font-medium mb-1">Before</div>
              <div className="text-sm font-semibold">
                {beforeAfter.before}
                {beforeAfter.unit && <span className="opacity-60 ml-1">{beforeAfter.unit}</span>}
              </div>
            </div>

            <ArrowRightIcon className={cn(
              "size-4 flex-shrink-0",
              beforeAfter.improvement ? themeClasses.trendUp : "opacity-60"
            )} />

            <div className="text-center">
              <div className="text-xs opacity-60 font-medium mb-1">After</div>
              <div className={cn(
                "text-sm font-semibold",
                beforeAfter.improvement ? themeClasses.trendUp : ""
              )}>
                {beforeAfter.after}
                {beforeAfter.unit && <span className="opacity-60 ml-1">{beforeAfter.unit}</span>}
              </div>
            </div>
          </div>

          {beforeAfter.improvement && (
            <div className="text-center mt-2">
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                themeClasses.trendUp,
                theme === 'light' && "bg-green-50",
                theme === 'dark' && "bg-green-900/20",
                theme === 'mta' && "bg-green-50"
              )}>
                ✓ Improvement
              </span>
            </div>
          )}
        </div>
      )}

      {/* Interactive indicator */}
      {isInteractive && (
        <div className="mt-3 pt-3 border-t border-opacity-40">
          <div className={cn(
            "text-xs transition-colors flex items-center gap-1 opacity-60",
            theme === 'mta' && "group-hover:text-blue-600",
            theme === 'light' && "group-hover:text-gray-800",
            theme === 'dark' && "group-hover:text-white"
          )}>
            Click to learn more
            <ArrowRightIcon className="size-3" />
          </div>
        </div>
      )}
    </div>
  );
}

// Predefined story cards for common MTA ACE concepts
export function StudentCommutesStoryCard({
  speedImprovement = "5-30%",
  beforeTime = "25 min",
  afterTime = "19 min",
  violationCount = "12,000",
  onClick
}: {
  speedImprovement?: string;
  beforeTime?: string;
  afterTime?: string;
  violationCount?: string;
  onClick?: () => void;
}) {
  return (
    <StoryCard
      icon="🚌"
      headline="Faster Commutes for Students"
      metric={speedImprovement + " speed improvement"}
      story={`When cars stay out of bus lanes, CUNY students get to class faster. ACE cameras caught ${violationCount} violators last month, helping buses maintain schedule.`}
      beforeAfter={{
        before: beforeTime,
        after: afterTime,
        unit: "average trip",
        improvement: true
      }}
      trend="up"
      trendLabel="Getting Better"
      onClick={onClick}
    />
  );
}

export function DowntownTrafficStoryCard({
  violationDrop = "23%",
  feeAmount = "$15",
  onClick
}: {
  violationDrop?: string;
  feeAmount?: string;
  onClick?: () => void;
}) {
  return (
    <StoryCard
      icon="🏙️"
      headline="Downtown Traffic Improvements"
      metric={violationDrop + " fewer violations"}
      story={`The ${feeAmount} congestion pricing fee is working. Fewer cars are entering downtown Manhattan, which means fewer cars blocking bus lanes during rush hour.`}
      beforeAfter={{
        before: "High violations",
        after: "Reduced violations",
        improvement: true
      }}
      trend="down"
      trendLabel="Fewer Problems"
      onClick={onClick}
    />
  );
}

export function CameraEffectivenessStoryCard({
  routesMonitored = "47",
  totalRoutes = "180",
  effectiveRate = "78%",
  onClick
}: {
  routesMonitored?: string;
  totalRoutes?: string;
  effectiveRate?: string;
  onClick?: () => void;
}) {
  const coverage = Math.round((parseInt(routesMonitored) / parseInt(totalRoutes)) * 100);

  return (
    <StoryCard
      icon="📷"
      headline="Camera System Working"
      metric={effectiveRate + " effective"}
      story={`Cameras are monitoring ${routesMonitored} out of ${totalRoutes} bus routes. Where cameras are installed, ${effectiveRate} show measurable improvement in bus speeds and reliability.`}
      beforeAfter={{
        before: routesMonitored + " routes",
        after: coverage + "% coverage",
        improvement: coverage > 25
      }}
      trend="up"
      trendLabel="Expanding"
      onClick={onClick}
    />
  );
}

export function ProblemAreasStoryCard({
  hotspotCount = "12",
  worstLocation = "14th St & 1st Ave",
  dailyViolations = "45",
  onClick
}: {
  hotspotCount?: string;
  worstLocation?: string;
  dailyViolations?: string;
  onClick?: () => void;
}) {
  return (
    <StoryCard
      icon="🔥"
      headline="Targeting Problem Areas"
      metric={hotspotCount + " problem spots"}
      story={`We've identified the worst locations where cars consistently block buses. ${worstLocation} sees about ${dailyViolations} violations per day - that's ${dailyViolations} times buses get delayed.`}
      trend="neutral"
      trendLabel="Monitoring"
      onClick={onClick}
    />
  );
}

// Grid layout for multiple story cards
interface StoryCardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function StoryCardGrid({
  children,
  columns = 2,
  className
}: StoryCardGridProps) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 1 && "grid-cols-1",
      columns === 2 && "grid-cols-1 md:grid-cols-2",
      columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      className
    )}>
      {children}
    </div>
  );
}