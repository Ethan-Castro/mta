"use client";

import React from "react";

type FooterStripProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

export default function FooterStrip({ left, right, className }: FooterStripProps) {
  return (
    <div className={["sb-footer", className].filter(Boolean).join(" ")}> 
      <div className="min-w-0 flex-1 truncate">{left}</div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}


