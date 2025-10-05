import { ReactNode } from "react"
import { stackServerApp } from "@/stack/server"
import { AppSidebar } from "@/components/app-sidebar"
import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await stackServerApp.getUser({ or: "redirect" })

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>
      <SidebarProvider>
        <AppSidebar aria-label="Primary navigation" />
        <SidebarInset
          id="main-content"
          tabIndex={-1}
          className="px-4 pb-10 sm:px-6 sm:pb-12 lg:px-8 lg:pb-14"
        >
          <header className="sticky top-0 z-0 flex h-16 shrink-0 items-center border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:h-20">
            <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-0 sm:px-2 lg:px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="hidden h-6 sm:block"
                decorative
                role="presentation"
              />
              <DynamicBreadcrumb />
            </div>
          </header>
          <div className="flex flex-1 flex-col">
            <div className="@container/main mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 py-6 sm:py-8">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
