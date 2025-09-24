import { ReactNode } from "react";
import DashboardShell from "@/components/DashboardShell";
import { stackServerApp } from "@/stack/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await stackServerApp.getUser({ or: "redirect" });
  return <DashboardShell>{children}</DashboardShell>;
}
