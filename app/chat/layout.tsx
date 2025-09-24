import { ReactNode } from "react";
import { stackServerApp } from "@/stack/server";

export default async function ChatLayout({ children }: { children: ReactNode }) {
  await stackServerApp.getUser({ or: "redirect" });
  return children;
}
