"use client";

import React from "react";

type RightValueProps = {
  value: React.ReactNode; // large number or metric
  unit?: string; // e.g., "MIN"
  className?: string;
};

export default function RightValue({ value, unit, className }: RightValueProps) {
  return (
    <div className={["sb-value", className].filter(Boolean).join(" ")}> 
      <div className="sb-number">{value}</div>
      {unit ? <div className="sb-unit">{unit}</div> : null}
    </div>
  );
}


