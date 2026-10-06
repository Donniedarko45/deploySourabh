import { createHash } from "node:crypto";

type DeliveryConfig = {
  apiKey?: string; from?: string; to: string; siteUrl: string;
  turnstileSecret?: string; turnstileSiteKey?: string;
};
type Options = {
  config: DeliveryConfig; capabilities: { id: string; title: string }[];
  timelines: readonly string[];
  fetcher?: typeof fetch; now?: () => number;
};
const attempts = new Map<string, { count: number; expires: number }>();
const json = (message: string, status: number, extra: Record<string, string> = {}) =>
  Response.json({ message }, { status, headers: { "Cache-Control": "no-store", ...extra } });
const field = (body: Record<string, unknown>, key: string, max: number, min = 0) => {
  const value = body[key];
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max ? value.trim() : null;
};

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16000) { await reader.cancel(); throw new Error("Body too large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid body");
  return body as Record<string, unknown>;
}

export async function handleEnquiry(request: Request, options: Options): Promise<Response> {
  const { config, capabilities, timelines, fetcher = fetch, now = Date.now } = options;
  const origin = request.headers.get("origin");
  const allowed = [new URL(request.url).origin, new URL(config.siteUrl).origin];
  if (!origin || !allowed.includes(origin)) return json("Please submit your enquiry from our contact page.", 403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json("Please use the contact form to send your enquiry.", 415);
  if (Number(request.headers.get("content-length") || 0) > 16000) return json("Your enquiry is too long. Please shorten the message.", 413);

  // This is a bounded, best-effort per-process limit. Turnstile provides the
  // optional production spam barrier across instances; use host-level limits as well.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = createHash("sha256").update(ip).digest("hex");
  const time = now();
  for (const [entry, value] of attempts) if (value.expires <= time) attempts.delete(entry);
  if (attempts.size >= 1000) attempts.delete(attempts.keys().next().value!);
  const limit = attempts.get(key) || { count: 0, expires: time + 10 * 60 * 1000 };
  if (limit.count >= 6) return json("Too many attempts. Please wait a few minutes and try again.", 429, { "Retry-After": String(Math.ceil((limit.expires - time) / 1000)) });
  limit.count++; attempts.set(key, limit);

  let body: Record<string, unknown>;
  try { body = await readBody(request); } catch { return json("We couldn’t read the enquiry. Please check the form and try again.", 400); }
  if (body.website) return json("Please check the form and try again.", 400);
  const name = field(body, "name", 150, 1), email = field(body, "email", 254, 3);
  const company = field(body, "company", 200, 1), message = field(body, "message", 4000, 20);
  const capability = field(body, "capability", 50), timeline = field(body, "timeline", 80);
  const requestId = field(body, "requestId", 36, 36);
  const token = field(body, "token", 2048, 1);
  if (!name || !email || !company || !message || !capability || !timeline ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || /[\r\n]/.test(name + email + company) ||
    !timelines.includes(timeline) ||
    (capability !== "not-sure" && !capabilities.some(item => item.id === capability)) ||
    !requestId || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId))
    return json("Please check your name, email and project details before sending.", 422);
  if (!config.apiKey || !config.from || Boolean(config.turnstileSecret) !== Boolean(config.turnstileSiteKey))
    return json("Online enquiries are temporarily unavailable. Please email us directly; your details are still in the form.", 503);
  if (config.turnstileSecret && !token) return json("Please complete the spam check and try again.", 422);

  try {
    if (config.turnstileSecret) {
    const verification = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: config.turnstileSecret, response: token }),
      signal: AbortSignal.timeout(8000),
    });
    const check = await verification.json() as { success?: boolean; action?: string; hostname?: string };
    if (!verification.ok) return json("The spam check is temporarily unavailable. Please try again.", 503);
    const hostname = new URL(origin).hostname;
    if (!check.success || check.action !== "contact" || check.hostname !== hostname)
      return json("The spam check expired or failed. Please refresh it and try again.", 422);
    }
    const topic = capabilities.find(item => item.id === capability)?.title || "Let’s define it together";
    const text = ["New CloudFire project enquiry", "", "Name: " + name, "Email: " + email, "Company: " + company,
      "Capability: " + topic, "Start: " + timeline, "", "The challenge:", message].join("\n");
    const digest = createHash("sha256").update(text).digest("hex");
    const sent = await fetcher("https://api.brevo.com/v3/smtp/email", {
      method: "POST", headers: { "api-key": config.apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sender: { name: "CloudFire website", email: config.from }, to: [{ email: config.to }], replyTo: { email, name }, subject: "New project enquiry | " + topic, textContent: text, headers: { idempotencyKey: "contact-" + requestId + "-" + digest } }),
      signal: AbortSignal.timeout(10000),
    });
    const delivery = await sent.json() as { messageId?: string };
    if (!sent.ok || !delivery.messageId) return json("Your enquiry could not be sent just yet. Please try again or email us directly. Your details have been kept.", 503);
    return json("Your enquiry has been submitted. We’ll reply to the email address you shared.", 200);
  } catch {
    return json("We couldn’t confirm submission. Please retry or email us directly. Your details have been kept.", 503);
  }
}
