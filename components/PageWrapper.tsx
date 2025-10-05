import { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PageWrapperProps {
  children: ReactNode
  maxWidth?: "full" | "6xl" | "7xl"
  className?: string
}

export function PageWrapper({
  children,
  maxWidth = "full",
  className,
}: PageWrapperProps) {
  const maxWidthClass = {
    full: "max-w-none",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
  }[maxWidth]

  return (
    <div className="w-full py-6 sm:py-8">
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-6 px-4 sm:px-6 lg:px-8",
          maxWidthClass,
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
