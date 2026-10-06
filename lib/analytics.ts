export type EventName = "enquiry_started" | "enquiry_submit" | "enquiry_success" | "enquiry_error" | "contact_click" | "work_click" | "book_call" | "case_study_open";
export function trackEvent(name: EventName, data?: { capability: string }) {
  if (typeof window === "undefined" || navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  const tracker = (window as Window & { umami?: { track: (name: string, data?: { capability: string }) => unknown } }).umami;
  try { Promise.resolve(tracker?.track(name, data)).catch(() => {}); } catch { /* Analytics never interrupts an enquiry. */ }
}
