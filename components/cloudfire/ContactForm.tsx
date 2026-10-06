"use client";
import { useCallback, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";
import { capabilities, contactEmail } from "@/lib/content";
import { timelines } from "@/lib/contact-options";
import { trackEvent } from "@/lib/analytics";
import SpamCheck from "./SpamCheck";
import styles from "./ContactForm.module.css";

class SubmissionError extends Error {}
export default function ContactForm({ available, siteKey }: { available: boolean; siteKey?: string }) {
  const query = useSearchParams();
  const selected = capabilities.some(item => item.id === query.get("capability")) ? query.get("capability")! : "not-sure";
  const [sending, setSending] = useState(false), [success, setSuccess] = useState(false);
  const [status, setStatus] = useState(""), [token, setToken] = useState(""), [resetCount, setResetCount] = useState(0);
  const submission = useRef(""), started = useRef(false), busy = useRef(false);
  const confirmation = useRef<HTMLDivElement>(null), feedback = useRef<HTMLParagraphElement>(null);
  const onToken = useCallback((value: string) => setToken(value), []);
  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy.current || !available) return;
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data.entries());
    if (!submission.current) submission.current = crypto.randomUUID();
    busy.current = true; setSending(true); setStatus("");
    trackEvent("enquiry_submit", { capability: String(payload.capability) });
    try {
      const response = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, token, requestId: submission.current }),
        signal: AbortSignal.timeout(25000),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new SubmissionError(result.message || "Your enquiry could not be sent. Please try again.");
      setSuccess(true);
      trackEvent("enquiry_success", { capability: String(payload.capability) });
      requestAnimationFrame(() => confirmation.current?.focus());
    } catch (error) {
      setStatus(error instanceof SubmissionError ? error.message : "We couldn’t confirm submission. Please try again; your details are still here.");
      trackEvent("enquiry_error");
      requestAnimationFrame(() => feedback.current?.focus());
    } finally {
      busy.current = false; setSending(false); setToken(""); setResetCount(value => value + 1);
    }
  };
  if (success) return <div ref={confirmation} tabIndex={-1} className={styles.success} role="status">
    <span className={styles.successIcon}><Check size={28} aria-hidden="true" /></span>
    <p className="eyebrow">A GOOD PLACE TO BEGIN</p><h2>Your enquiry<br /><span className="muted">is on its way.</span></h2>
    <p>Thanks for sharing your idea. We’ll reply to the email address you provided to discuss the next step.</p>
    <Link href="/work" className="text-link">Explore our work<ArrowUpRight size={17} aria-hidden="true" /></Link>
    <button type="button" onClick={() => { setSuccess(false); submission.current = ""; setStatus(""); }}>Send another enquiry</button>
  </div>;
  return <form className={"project-form " + styles.form} onSubmit={send} aria-busy={sending}
    onChange={() => { submission.current = ""; }}
    onFocusCapture={() => { if (!started.current) { started.current = true; trackEvent("enquiry_started"); } }}>
    <div className={styles.heading}><p className="eyebrow">TELL US WHAT YOU HAVE IN MIND</p><p>A few details now. A better conversation next.</p></div>
    {!available && <p className={styles.notice} role="status">Online enquiries are temporarily unavailable. You can reach us at <a href={"mailto:" + contactEmail}>{contactEmail}</a>.</p>}
    <fieldset disabled={sending}>
      <div className="form-pair"><label htmlFor="name">Your name *<input id="name" name="name" required autoComplete="name" placeholder="Your name" maxLength={150} /></label>
        <label htmlFor="email">Work email *<input id="email" name="email" type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@company.com" maxLength={254} /></label></div>
      <label htmlFor="company">Company *<input id="company" name="company" required autoComplete="organization" placeholder="Your company" maxLength={200} /></label>
      <label htmlFor="capability">What are you looking to build?<select id="capability" name="capability" defaultValue={selected}><option value="not-sure">Let’s define it together</option>{capabilities.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label htmlFor="timeline">When would you like to start?<select id="timeline" name="timeline">{timelines.map(item => <option key={item}>{item}</option>)}</select></label>
      <label htmlFor="message">Tell us about the challenge *<textarea id="message" name="message" required minLength={20} maxLength={4000} rows={5} placeholder="What needs to change? What would success look like?" /></label>
      <div className={styles.honeypot} aria-hidden="true"><label htmlFor="website">Leave this field empty<input id="website" name="website" tabIndex={-1} autoComplete="off" /></label></div>
    </fieldset>
    {siteKey && available && <SpamCheck siteKey={siteKey} resetCount={resetCount} onToken={onToken} />}
    <p className="form-note">We’ll use these details to respond to your enquiry. Please leave out confidential information. <Link href="/privacy">Privacy information<ArrowUpRight size={12} aria-hidden="true" /></Link></p>
    <button type="submit" className="button button-primary" disabled={sending || !available || (!!siteKey && !token)}>
      {sending ? <>Sending enquiry<LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /></> : <>Send enquiry<ArrowUpRight size={17} aria-hidden="true" /></>}
    </button>
    {siteKey && available && !token && !sending && <p className={styles.verificationNote}>Complete the spam check to send your enquiry.</p>}
    <p ref={feedback} tabIndex={-1} className={styles.error} role="status">{status}</p>
    <noscript>Please enable JavaScript to send an enquiry, or email {contactEmail} directly.</noscript>
  </form>;
}
