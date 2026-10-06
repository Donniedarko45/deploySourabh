"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
type Turnstile = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void; reset: (id: string) => void;
};
const api = () => (window as Window & { turnstile?: Turnstile }).turnstile;
export default function SpamCheck({ siteKey, resetCount, onToken }: { siteKey: string; resetCount: number; onToken: (token: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const provider = api();
    if (!loaded || !host.current || !provider) return;
    widget.current = provider.render(host.current, {
      sitekey: siteKey, action: "contact", theme: "dark", size: host.current.clientWidth < 300 ? "compact" : "flexible",
      callback: (token: string) => { setError(false); onToken(token); },
      "expired-callback": () => onToken(""),
      "error-callback": () => { onToken(""); setError(true); },
    });
    return () => { if (widget.current) provider.remove(widget.current); widget.current = undefined; };
  }, [loaded, siteKey, onToken]);
  useEffect(() => {
    if (widget.current && resetCount) api()?.reset(widget.current);
  }, [resetCount]);
  return <div>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive"
      onReady={() => setLoaded(true)} onError={() => setError(true)} />
    <div ref={host} aria-label="Spam protection" />
    {error && <p role="status">The spam check couldn’t load. <button type="button" onClick={() => { if (widget.current) api()?.reset(widget.current); else { const script = document.createElement("script"); script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; script.async = true; script.onload = () => setLoaded(true); script.onerror = () => setError(true); document.head.appendChild(script); } }}>Retry verification</button></p>}
  </div>;
}
