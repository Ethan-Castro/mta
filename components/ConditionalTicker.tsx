"use client";

import { usePathname } from "next/navigation";
import MarketTickerBar from "./MarketTickerBar";

export default function ConditionalTicker() {
  const pathname = usePathname();
  
  // Hide ticker on map page
  if (pathname === "/map") {
    return null;
  }
  
  return <MarketTickerBar />;
}
