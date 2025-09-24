"use client";

import React from "react";

type SectionHeaderProps = {
  children: React.ReactNode;
  className?: string;
};

export default function SectionHeader({ children, className }: SectionHeaderProps) {
  return <div className={["sb-section", className].filter(Boolean).join(" ")}>{children}</div>;
}


