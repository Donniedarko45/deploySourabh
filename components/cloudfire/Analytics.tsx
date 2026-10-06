"use client";
import { useEffect, useSyncExternalStore } from "react";
import Script from "next/script";
import { trackEvent } from "@/lib/analytics";
const subscribe = () => () => {};
const permitted = () => navigator.doNotTrack !== "1" && !(navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
export default function Analytics({ websiteId, scriptUrl }: { websiteId?: string; scriptUrl?: string }) {
  const enabled = useSyncExternalStore(subscribe, permitted, () => false);
  useEffect(() => {
    if (!enabled || !websiteId) return;
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target) return;
      const href = target.getAttribute("href") || "";
      if (target.dataset.analyticsEvent === "book_call") trackEvent("book_call");
      else if (href.startsWith("/work/")) trackEvent("case_study_open");
      else if (href.startsWith("/contact") || href.startsWith("mailto:")) trackEvent("contact_click");
      else if (href === "/work") trackEvent("work_click");
    };
    document.addEventListener("click", click, { passive: true });
    return () => document.removeEventListener("click", click);
  }, [enabled, websiteId]);
  if (!enabled || !websiteId || !scriptUrl || !/^https:\/\//.test(scriptUrl)) return null;
  return <Script id="cloudfire-analytics" src={scriptUrl} strategy="afterInteractive" data-website-id={websiteId}
    data-do-not-track="true" data-exclude-search="true" data-exclude-hash="true" />;
}
