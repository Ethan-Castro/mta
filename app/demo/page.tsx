"use client";

import { useState } from 'react';
import { ViewModeProvider, ViewModeToggle, AdaptiveMetric, SimpleContent, DetailedContent, ExpertContent, ViewModeIndicator } from "@/components/ViewModeToggle";
import { SmartTooltip, JargonTerm, PlainLanguage } from "@/components/ui/smart-tooltip";
import StoryCard, { StoryCardGrid, StudentCommutesStoryCard, DowntownTrafficStoryCard, CameraEffectivenessStoryCard } from "@/components/StoryCard";
import OnboardingTour, { TourStarter } from "@/components/OnboardingTour";
import ContextPanel from "@/components/ContextPanel";
import EnhancedInsightCard from "@/components/EnhancedInsightCard";

export default function DemoPage() {
  const [showTour, setShowTour] = useState(false);
  const [userType, setUserType] = useState<'resident' | 'student' | 'executive' | null>(null);

  return (
    <ViewModeProvider defaultMode="simple">
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        {/* Header */}
        <header className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Demo: Layman-Friendly Features
              </h1>
              <p className="text-muted-foreground mt-2">
                Showcasing all the new components that make the MTA ACE data accessible to everyone
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ViewModeIndicator />
              <ViewModeToggle />
            </div>
          </div>
        </header>

        {/* Tour Demo */}
        <section className="mb-8 rounded-xl border border-border/60 bg-card/80 p-6">
          <h2 className="text-xl font-semibold mb-4">1. Interactive Onboarding Tour</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Customized tours for different user types with contextual guidance
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTour(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Tour Selection
            </button>
            <button
              onClick={() => { setUserType('resident'); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Resident Tour
            </button>
            <button
              onClick={() => { setUserType('student'); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Student Tour
            </button>
            <button
              onClick={() => { setUserType('executive'); }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Executive Tour
            </button>
          </div>
        </section>

        {/* Smart Tooltips Demo */}
        <section className="mb-8 rounded-xl border border-border/60 bg-card/80 p-6">
          <h2 className="text-xl font-semibold mb-4">2. Smart Tooltips & Plain Language</h2>
          <div className="space-y-4">
            <div className="p-4 bg-background/60 rounded-lg border">
              <h3 className="font-medium mb-2">Before (Technical Jargon):</h3>
              <p className="text-sm">ACE coverage increased 15% with CBD violations dropping 23% and exempt fleet repeaters identified across hotspots.</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
              <h3 className="font-medium mb-2">After (Plain Language + Tooltips):</h3>
              <p className="text-sm">
                <JargonTerm termId="ace-coverage" /> increased 15% with <JargonTerm termId="cbd-violations" /> dropping 23% and
                <JargonTerm termId="repeaters" /> identified across <JargonTerm termId="hotspots" />.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium text-sm">Original Term</div>
                <div className="text-xs text-muted-foreground">ACE</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium text-sm">Plain Language</div>
                <div className="text-xs text-muted-foreground"><PlainLanguage termId="ace" /></div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium text-sm">With Tooltip</div>
                <div className="text-xs"><SmartTooltip termId="ace">Hover for explanation</SmartTooltip></div>
              </div>
            </div>
          </div>
        </section>

        {/* Story Cards Demo */}
        <section className="mb-8 rounded-xl border border-border/60 bg-card/80 p-6">
          <h2 className="text-xl font-semibold mb-4">3. Visual Story Cards</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Replace complex charts with narrative explanations that show real-world impact
          </p>
          <StoryCardGrid columns={3}>
            <StudentCommutesStoryCard />
            <DowntownTrafficStoryCard />
            <CameraEffectivenessStoryCard />
          </StoryCardGrid>

          <div className="mt-6">
            <h3 className="font-medium mb-3">Theme Variations:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StoryCard
                icon="🚌"
                headline="Light Theme"
                metric="5% faster"
                story="Clean white background with gray accents for professional presentations."
                theme="light"
              />
              <StoryCard
                icon="🚌"
                headline="Dark Theme"
                metric="5% faster"
                story="Bold black background with white text for high contrast viewing."
                theme="dark"
              />
              <StoryCard
                icon="🚌"
                headline="MTA Theme"
                metric="5% faster"
                story="Official MTA blue gradient that matches transit branding."
                theme="mta"
              />
            </div>
          </div>
        </section>

        {/* Progressive Disclosure Demo */}
        <section className="mb-8 rounded-xl border border-border/60 bg-card/80 p-6">
          <h2 className="text-xl font-semibold mb-4">4. Progressive Information Disclosure</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Information complexity adapts to user expertise level. Try switching view modes above!
          </p>

          <div className="space-y-4">
            <SimpleContent>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-800 dark:text-green-200">Simple View Active</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Showing easy-to-understand story cards and plain language explanations.
                </p>
              </div>
            </SimpleContent>

            <DetailedContent>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-800 dark:text-blue-200">Detailed View Active</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Showing additional context, tooltips, and more comprehensive explanations.
                </p>
              </div>
            </DetailedContent>

            <ExpertContent>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
                <h3 className="font-medium text-purple-800 dark:text-purple-200">Expert Mode Active</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  Showing all technical details, methodology notes, and full data complexity.
                </p>
              </div>
            </ExpertContent>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <AdaptiveMetric
                title="Bus Speed Improvement"
                simpleValue="👍 Getting Better"
                simpleDescription="Buses are 6 minutes faster on average"
                detailedValue="8.2%"
                detailedDescription="Average speed improvement on ACE routes"
                expertValue="8.2% ± 1.4% (p<0.05)"
                expertDescription="Statistically significant improvement across 47 monitored routes"
                technicalDetails={
                  <div className="text-xs space-y-1">
                    <div>Sample size: 47 routes, 6 months data</div>
                    <div>Methodology: Weighted by ridership</div>
                    <div>Confidence interval: 95%</div>
                  </div>
                }
              />
              <AdaptiveMetric
                title="Student Impact"
                simpleValue="15,000 students"
                simpleDescription="Students helped by faster buses daily"
                detailedValue="15,247"
                detailedDescription="CUNY students on monitored routes per weekday"
                expertValue="15,247 (±2,103)"
                expertDescription="Daily ridership exposure with 95% confidence interval"
                technicalDetails={
                  <div className="text-xs space-y-1">
                    <div>Data source: CUNY enrollment × route usage</div>
                    <div>Peak vs off-peak weighted</div>
                    <div>Excludes weekend/holiday patterns</div>
                  </div>
                }
              />
              <AdaptiveMetric
                title="Problem Areas"
                simpleValue="12 hotspots"
                simpleDescription="Locations where cars frequently block buses"
                detailedValue="12 primary hotspots"
                detailedDescription="High-violation intersections requiring attention"
                expertValue="12 (α=0.05, >50 violations/month)"
                expertDescription="Statistically significant violation clusters"
                technicalDetails={
                  <div className="text-xs space-y-1">
                    <div>Clustering algorithm: DBSCAN</div>
                    <div>Minimum violations: 50/month</div>
                    <div>Spatial radius: 100m</div>
                  </div>
                }
              />
            </div>
          </div>
        </section>

        {/* Enhanced Insight Cards Demo */}
        <section className="mb-8 rounded-xl border border-border/60 bg-card/80 p-6">
          <h2 className="text-xl font-semibold mb-4">5. Enhanced Insight Cards</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Cards that adapt their presentation based on view mode - story format for simple, metrics for detailed/expert
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <EnhancedInsightCard
              storyIcon="🚌"
              storyHeadline="Buses Getting Faster"
              storyMetric="8.2% improvement"
              storyDescription="Camera enforcement is working! Buses on monitored routes are moving faster."
              storyBeforeAfter={{
                before: "Before cameras",
                after: "8.2% faster",
                improvement: true
              }}
              storyTrend="up"
              storyTrendLabel="Improving"
              title="Speed Uplift"
              value="8.2%"
              subline="Average improvement on ACE routes"
              trendLabel="Routes"
              trendDelta="47"
              trendPositive={true}
              metricId="speed-uplift"
              termId="speed-uplift"
              expertValue="8.2% ± 1.4% (p<0.05)"
              expertDescription="Statistically significant across monitored corridors"
              technicalDetails={
                <div className="text-xs space-y-1">
                  <div>Routes: 47 monitored</div>
                  <div>Period: 6 months post-implementation</div>
                  <div>Method: Weighted by ridership</div>
                </div>
              }
            />
            <EnhancedInsightCard
              storyIcon="🏙️"
              storyHeadline="Downtown Improving"
              storyMetric="23% fewer problems"
              storyDescription="Congestion pricing and cameras are reducing downtown traffic violations."
              storyTrend="up"
              storyTrendLabel="Better"
              title="CBD Violation Drop"
              value="23%"
              subline="Reduction since congestion pricing"
              metricId="cbd-violations"
              termId="cbd-violations"
            />
            <EnhancedInsightCard
              storyIcon="🎓"
              storyHeadline="Students Helped"
              storyMetric="15,000 daily"
              storyDescription="This many CUNY students benefit from faster, more reliable buses to campus."
              storyTrend="neutral"
              storyTrendLabel="Tracking"
              title="Student Exposure"
              value="15,247"
              subline="Students on monitored routes daily"
              metricId="student-exposure"
              termId="student-exposure"
            />
          </div>
        </section>

        {/* Tour Components */}
        {showTour && (
          <TourStarter
            onSelectUserType={(type) => {
              setUserType(type);
              setShowTour(false);
            }}
          />
        )}

        {userType && (
          <OnboardingTour
            userType={userType}
            autoStart={true}
            onComplete={() => setUserType(null)}
          />
        )}

        <ContextPanel />
      </div>
    </ViewModeProvider>
  );
}