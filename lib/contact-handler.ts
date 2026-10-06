import { createHash } from "node:crypto";

type DeliveryConfig = {
  apiKey?: string; from?: string; to: string; siteUrl: string;
  turnstileSecret?: string; turnstileSiteKey?: string;
};
export type ContactFailure = {
  code: string; reference: string; providerStatus?: number; providerCode?: string;
};
type Options = {
  config: DeliveryConfig; capabilities: { id: string; title: string }[];
  timelines: readonly string[];
  fetcher?: typeof fetch; now?: () => number; onFailure?: (failure: ContactFailure) => void;
};
const attempts = new Map<string, { count: number; expires: number }>();
const json = (message: string, status: number, extra: Record<string, string> = {}) =>
  Response.json({ message }, { status, headers: { "Cache-Control": "no-store", ...extra } });
const field = (body: Record<string, unknown>, key: string, max: number, min = 0) => {
  const value = body[key];
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max ? value.trim() : null;
};
const isEmail = (value?: string) => !!value && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const providerCodes = new Set(["unauthorized", "permission_denied", "invalid_parameter", "missing_parameter", "bad_request", "out_of_range", "duplicate_parameter", "not_found", "account_suspended", "insufficient_credit", "unauthorized_ip"]);
function brevoFailure(status: number, data: unknown) {
  const body = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const providerCode = typeof body.code === "string" && providerCodes.has(body.code) ? body.code : undefined;
  const message = typeof body.message === "string" ? body.message.slice(0, 1000).toLowerCase() : "";
  let code = "EMAIL_REQUEST_REJECTED";
  if (providerCode === "unauthorized_ip" || /\bip\b/.test(message) && /unauthoriz|unrecogni[sz]|not allowed|blocked|whitelist/.test(message)) code = "EMAIL_IP_BLOCKED";
  else if (status === 401 || (/(api[\s-]?key|authentication)/.test(message) && /invalid|unauthoriz|not found|not enabled/.test(message))) code = "EMAIL_AUTHENTICATION_FAILED";
  else if (/sender/.test(message) && /invalid|not valid|not verif|unverif|not regist|unauthoriz|not found|does not exist|not activ/.test(message)) code = "EMAIL_SENDER_REJECTED";
  else if (providerCode === "account_suspended" || /smtp|transactional|account/.test(message) && /not activ|not enabled|disabled|suspend|not authoriz/.test(message)) code = "EMAIL_ACCOUNT_INACTIVE";
  else if (providerCode === "insufficient_credit" || /insufficient|not enough|exhausted/.test(message) && /credit|quota/.test(message)) code = "EMAIL_QUOTA_EXCEEDED";
  else if (/htmlcontent|html content|textcontent/.test(message)) code = "EMAIL_CONTENT_REJECTED";
  else if (status === 403) code = "EMAIL_PERMISSION_DENIED";
  else if (status === 429) code = "EMAIL_RATE_LIMITED";
  else if (status >= 500) code = "EMAIL_PROVIDER_UNAVAILABLE";
  else if (status >= 200 && status < 300) code = "EMAIL_RESPONSE_INVALID";
  return { code, providerStatus: status, ...(providerCode && { providerCode }) };
}

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
  const { capabilities, timelines, fetcher = fetch, now = Date.now } = options;
  const config = { ...options.config, apiKey: options.config.apiKey?.trim(), from: options.config.from?.trim(),
    to: options.config.to.trim(), turnstileSecret: options.config.turnstileSecret?.trim(), turnstileSiteKey: options.config.turnstileSiteKey?.trim() };
  const origin = request.headers.get("origin");
  const allowed = [new URL(request.url).origin, new URL(config.siteUrl).origin];
  if (!origin || !allowed.includes(origin)) return json("Please submit your enquiry from our contact page.", 403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json("Please use the contact form to send your enquiry.", 415);
  if (Number(request.headers.get("content-length") || 0) > 16000) return json("Your enquiry is too long. Please shorten the message.", 413);

  // This bounded per-process limit supplements Turnstile and host-level limits.
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
    !isEmail(email) || /[\r\n]/.test(name + email + company) ||
    !timelines.includes(timeline) ||
    (capability !== "not-sure" && !capabilities.some(item => item.id === capability)) ||
    !requestId || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId))
    return json("Please check your name, email and project details before sending.", 422);
  const unavailable = (message: string, code: string, details: { providerStatus?: number; providerCode?: string } = {}) => {
    // Log only a reference and controlled codes/status; no keys, addresses, enquiry content or raw errors.
    try { options.onFailure?.({ code, reference: requestId, ...details }); } catch { /* Preserve recovery if logging fails. */ }
    return Response.json({ message, code, reference: requestId }, { status: 503, headers: { "Cache-Control": "no-store" } });
  };
  if (!config.apiKey || !config.from)
    return unavailable("Online enquiries are temporarily unavailable. Please email us directly; your details are still in the form.", "EMAIL_NOT_CONFIGURED");
  if (!isEmail(config.from) || !isEmail(config.to) || /[\r\n]/.test(config.apiKey))
    return unavailable("Online enquiries are temporarily unavailable. Please email us directly; your details are still in the form.", "EMAIL_CONFIGURATION_INVALID");
  if (Boolean(config.turnstileSecret) !== Boolean(config.turnstileSiteKey))
    return unavailable("Online enquiries are temporarily unavailable. Please email us directly; your details are still in the form.", "SPAM_CHECK_NOT_CONFIGURED");
  if (config.turnstileSecret && !token) return json("Please complete the spam check and try again.", 422);

  let stage = config.turnstileSecret ? "SPAM_CHECK" : "EMAIL";
  try {
    if (config.turnstileSecret) {
      const verification = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: config.turnstileSecret, response: token }),
        signal: AbortSignal.timeout(8000),
      });
      const check = await verification.json().catch(() => null) as { success?: boolean; action?: string; hostname?: string } | null;
      if (!verification.ok || !check) return unavailable("The spam check is temporarily unavailable. Please try again.", "SPAM_CHECK_UNAVAILABLE", { providerStatus: verification.status });
      const hostname = new URL(origin).hostname;
      if (!check.success || check.action !== "contact" || check.hostname !== hostname)
        return json("The spam check expired or failed. Please refresh it and try again.", 422);
    }
    stage = "EMAIL";
    const topic = capabilities.find(item => item.id === capability)?.title || "Let’s define it together";
    const text = ["New CloudFire project enquiry", "", "Name: " + name, "Email: " + email, "Company: " + company,
      "Capability: " + topic, "Start: " + timeline, "", "The challenge:", message].join("\n");
    const digest = createHash("sha256").update(text).digest("hex");
    const sent = await fetcher("https://api.brevo.com/v3/smtp/email", {
      method: "POST", headers: { "api-key": config.apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sender: { name: "CloudFire website", email: config.from }, to: [{ email: config.to }],
        replyTo: { email, name }, subject: "New project enquiry | " + topic, textContent: text,
        htmlContent: '<html><body><pre style="white-space:pre-wrap;font:14px/1.6 sans-serif">' + escapeHtml(text) + "</pre></body></html>",
        headers: { "Idempotency-Key": "contact-" + requestId + "-" + digest } }),
      signal: AbortSignal.timeout(10000),
    });
    const delivery: unknown = await sent.json().catch(() => null);
    const messageId = delivery && typeof delivery === "object" && "messageId" in delivery ? delivery.messageId : undefined;
    if (!sent.ok || typeof messageId !== "string" || !messageId.trim()) {
      const { code, ...details } = brevoFailure(sent.status, delivery);
      return unavailable("Your enquiry could not be sent just yet. Please try again or email us directly. Your details have been kept.", code, details);
    }
    return json("Your enquiry has been submitted. We’ll reply to the email address you shared.", 200);
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return unavailable("We couldn’t confirm submission. Please retry or email us directly. Your details have been kept.", stage + (timedOut ? "_TIMEOUT" : "_CONNECTION_FAILED"));
  }
}
