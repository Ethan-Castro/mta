"use client";

import React from "react";

type ListRowProps = {
  left?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

export default function ListRow({ left, title, subtitle, right, className }: ListRowProps) {
  return (
    <div className={["sb-row", className].filter(Boolean).join(" ")}> 
      <div className="sb-left">{left}</div>
      <div className="sb-text">
        <div className="sb-title">{title}</div>
        {subtitle ? <div className="sb-subtitle">{subtitle}</div> : null}
      </div>
      {right}
    </div>
  );
}


