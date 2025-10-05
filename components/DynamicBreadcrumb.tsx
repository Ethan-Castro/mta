"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/executive": "Executive",
  "/operations": "Operations",
  "/data-science": "Data Science",
  "/map": "Map Explorer",
  "/students": "CUNY Students",
  "/policy": "Policy",
  "/chat": "Transport Copilot",
  "/real-time": "Real-time",
  "/presentation": "Presentation",
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const currentPage = PAGE_TITLES[pathname] || "Dashboard"

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/">
            NYC Transport
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{currentPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
