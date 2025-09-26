'use client';

import InstagramEmbed from "@/components/social/InstagramEmbed";
import XEmbed from "@/components/social/XEmbed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SocialMonitor() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold sm:text-base">Live social monitor</h2>
          <p className="text-xs text-muted-foreground">
            Watch the latest from MTA's official channels without leaving the dashboard.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
          Live
        </span>
      </div>

      <Tabs defaultValue="x" className="w-full">
        <TabsList className="mb-2 w-full gap-1 bg-muted/30 p-1">
          <TabsTrigger value="x" className="flex-1 text-xs sm:text-sm">
            X / Twitter
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex-1 text-xs sm:text-sm">
            Instagram
          </TabsTrigger>
        </TabsList>

        <TabsContent value="x" className="focus-visible:outline-none">
          <XEmbed handle="MTA" />
        </TabsContent>
        <TabsContent value="instagram" className="focus-visible:outline-none">
          <InstagramEmbed username="mta" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
