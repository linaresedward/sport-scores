"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveRefresh({ hasLive }: { hasLive: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!hasLive) return;
    const interval = setInterval(() => {
      router.refresh();
    }, 60000); // 60 secondes
    return () => clearInterval(interval);
  }, [hasLive, router]);

  return null;
}