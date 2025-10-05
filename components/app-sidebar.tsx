"use client"

import * as React from "react"
import {
  BarChart3,
  Bot,
  Command,
  FileText,
  LifeBuoy,
  Map,
  Database,
  Send,
  TrendingUp,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Analytics",
      url: "/executive",
      icon: BarChart3,
      isActive: true,
      items: [
        {
          title: "Executive",
          url: "/executive",
        },
        {
          title: "Operations",
          url: "/operations",
        },
        {
          title: "Data Science",
          url: "/data-science",
        },
      ],
    },
    {
      title: "Exploration",
      url: "/map",
      icon: Map,
      items: [
        {
          title: "Map Explorer",
          url: "/map",
        },
        {
          title: "CUNY Students",
          url: "/students",
        },
        {
          title: "Policy",
          url: "/policy",
        },
      ],
    },
    {
      title: "AI Tools",
      url: "/chat",
      icon: Bot,
      items: [
        {
          title: "Transport Copilot",
          url: "/chat",
        },
        {
          title: "Real-time",
          url: "/real-time",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Routes tracked",
      url: "/executive",
      icon: TrendingUp,
    },
    {
      name: "ACE coverage",
      url: "/operations",
      icon: BarChart3,
    },
    {
      name: "Student riders",
      url: "/students",
      icon: Map,
    },
  ],
  navSecondary: [
    {
      title: "Overview",
      url: "/",
      icon: Command,
    },
    {
      title: "Presentation",
      url: "/presentation",
      icon: FileText,
    },
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
    {
      title: "More Data",
      url: "/more-data",
      icon: Database,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">NYC Transport</span>
                  <span className="truncate text-xs">Unified MTA & DOT</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
