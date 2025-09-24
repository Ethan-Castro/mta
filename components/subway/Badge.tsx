"use client";

import React from "react";

type BadgeProps = {
  label: string;
  color?: "blue" | "green"; // extendable for more lines
  className?: string;
};

export default function Badge({ label, color = "blue", className }: BadgeProps) {
  const base = color === "green" ? "sb-badge sb-badge--green" : "sb-badge sb-badge--blue";
  return <div className={[base, className].filter(Boolean).join(" ")}>{label}</div>;
}


