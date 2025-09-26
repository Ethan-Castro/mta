'use client';

import { useEffect, useRef } from "react";

export default function XEmbed({ handle = "MTA" }: { handle?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const existing = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]') as HTMLScriptElement | null;
    function load() {
      if ((window as any).twttr && (window as any).twttr.widgets) {
        (window as any).twttr.widgets.load(ref.current);
      }
    }
    if (!existing) {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://platform.twitter.com/widgets.js";
      s.onload = load;
      document.body.appendChild(s);
    } else {
      load();
    }
  }, []);

  return (
    <div ref={ref} className="overflow-hidden rounded-lg border border-border/60 bg-background/60">
      <a
        className="twitter-timeline"
        data-height="520"
        href={`https://x.com/${handle}`}
      >
        Tweets by {handle}
      </a>
    </div>
  );
}
