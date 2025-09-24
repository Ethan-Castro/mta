import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack/server";

export default function Page(props: any) {
  return <StackHandler fullPage app={stackServerApp} routeProps={props} />;
}
