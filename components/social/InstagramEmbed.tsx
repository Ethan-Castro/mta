'use client';

import { useEffect, useRef } from "react";

export default function InstagramEmbed({ username = "mta" }: { username?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const existing = document.querySelector('script[src="https://www.instagram.com/embed.js"]') as HTMLScriptElement | null;
    function load() {
      if ((window as any).instgrm && (window as any).instgrm.Embeds) {
        (window as any).instgrm.Embeds.process();
      }
    }
    if (!existing) {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://www.instagram.com/embed.js";
      s.onload = load;
      document.body.appendChild(s);
    } else {
      load();
    }
  }, []);

  return (
    <div ref={ref} className="overflow-hidden rounded-lg border border-border/60 bg-background/60 p-2">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={`https://www.instagram.com/${username}/`}
        data-instgrm-version="14"
        style={{ background: "transparent", width: "100%" }}
      ></blockquote>
    </div>
  );
}
