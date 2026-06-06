"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Drop this component once inside RootLayout.
 * It fires a POST /api/track on every navigation, silently.
 */
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Fire and forget — never block rendering
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pathname }),
    }).catch(() => { });
  }, [pathname]);

  return null;
}
