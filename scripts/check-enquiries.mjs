import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { handleEnquiry } from "../lib/contact-handler.ts";
import { timelines } from "../lib/contact-options.ts";
import { capabilities } from "../lib/content.ts";
let sequence = 0;
const base = { name: "Test Visitor", email: "visitor@example.com", company: "Test Company", capability: "product-engineering", timeline: timelines[0], message: "Build a website with a clear customer enquiry journey.", website: "", requestId: randomUUID(), token: "test-token" };
const config = { apiKey: "test-only-key", from: "website@example.com", to: "inbox@example.com", siteUrl: "https://example.com" };
const request = (payload = base, headers = {}) => new Request("https://example.com/api/contact", { method: "POST", headers: { origin: "https://example.com", "content-type": "application/json", "x-forwarded-for": "192.0.2." + (++sequence), ...headers }, body: JSON.stringify(payload) });
const calls = [];
const fetcher = async (url, options) => {
  calls.push({ url, options });
  if (url.includes("siteverify")) return Response.json({ success: true, action: "contact", hostname: "example.com" });
  return Response.json({ messageId: "<test-message@example.com>" }, { status: 201 });
};
const failures = [];
const options = { config, capabilities, timelines, fetcher, onFailure: failure => failures.push(failure) };
let response = await handleEnquiry(request(), options);
assert.equal(response.status, 200);
const email = JSON.parse(calls[0].options.body);
assert.equal(calls[0].url, "https://api.brevo.com/v3/smtp/email");
assert.deepEqual(email.to, [{ email: "inbox@example.com" }]);
assert.equal(email.replyTo.email, "visitor@example.com");
assert.equal(calls[0].options.headers["api-key"], "test-only-key");
assert.ok(email.headers["Idempotency-Key"]);
assert.doesNotMatch(email.textContent, /budget/i);
assert.match(email.textContent, /Test Visitor/);
assert.match(email.htmlContent, /<html>/);
const idempotency = email.headers["Idempotency-Key"];
await handleEnquiry(request(), options);
assert.equal(JSON.parse(calls[1].options.body).headers["Idempotency-Key"], idempotency, "retries keep their key");
const before = calls.length;
for (const payload of [{...base,email:"not-an-email"}, {...base,name:"Bad\nHeader"}, {...base,message:"short"}, {...base,capability:"unsupported"}, {...base,website:"https://bot.example"}, {...base,requestId:"invalid"}]) {
  assert.ok((await handleEnquiry(request(payload), options)).status >= 400);
}
assert.equal(calls.length,before,"invalid enquiries never reach Brevo");
assert.equal((await handleEnquiry(request(base,{origin:"https://other.example"}),options)).status,403);
assert.equal((await handleEnquiry(request(base,{"content-length":"17000"}),options)).status,413);
assert.equal((await handleEnquiry(request(),{...options,config:{...config,apiKey:undefined}})).status,503);
assert.equal((await handleEnquiry(request(),{...options,fetcher:async()=>Response.json({message:"Unavailable"},{status:500})})).status,503);
assert.equal((await handleEnquiry(request(),{...options,fetcher:async()=>{throw new Error("Network failure")}})).status,503);
const protectedOptions={...options,config:{...config,turnstileSecret:"test-secret",turnstileSiteKey:"test-site-key"}};
assert.equal((await handleEnquiry(request(),protectedOptions)).status,200);
assert.equal((await handleEnquiry(request({...base,token:""}),protectedOptions)).status,422);
assert.equal((await handleEnquiry(request(),{...protectedOptions,fetcher:async()=>Response.json({success:false})})).status,422);
assert.equal((await handleEnquiry(request(),{...protectedOptions,fetcher:async()=>Response.json({success:true,action:"contact",hostname:"other.example"})})).status,422);
for(let i=0;i<6;i++) assert.equal((await handleEnquiry(request(base,{"x-forwarded-for":"198.51.100.1"}),options)).status,200);
const limited=await handleEnquiry(request(base,{"x-forwarded-for":"198.51.100.1"}),options);
assert.equal(limited.status,429); assert.ok(limited.headers.get("retry-after"));
const cases = [
 [401, {code:"unauthorized",message:"Key not found"}, "EMAIL_AUTHENTICATION_FAILED"],
 [401, {code:"unauthorized",message:"We detected an unrecognised IP address"}, "EMAIL_IP_BLOCKED"],
 [400, {code:"invalid_parameter",message:"Sender is not valid"}, "EMAIL_SENDER_REJECTED"],
 [400, {code:"permission_denied",message:"Your SMTP account is not activated"}, "EMAIL_ACCOUNT_INACTIVE"],
 [400, {code:"insufficient_credit",message:"Not enough credits"}, "EMAIL_QUOTA_EXCEEDED"],
 [400, {code:"missing_parameter",message:"htmlContent is required"}, "EMAIL_CONTENT_REJECTED"],
 [403, {code:"permission_denied",message:"Forbidden"}, "EMAIL_PERMISSION_DENIED"],
 [429, {message:"Rate limited"}, "EMAIL_RATE_LIMITED"],
 [500, {message:"Provider temporarily unavailable"}, "EMAIL_PROVIDER_UNAVAILABLE"],
 [201, {}, "EMAIL_RESPONSE_INVALID"],
 [201, {messageId:""}, "EMAIL_RESPONSE_INVALID"],
 [400, {code:"visitor@example.com Test Company test-only-key",message:"Rejected private details: Test Visitor"}, "EMAIL_REQUEST_REJECTED"],
];
for (const [status,data,expected] of cases) {
 const result = await handleEnquiry(request(), {...options,fetcher:async()=>Response.json(data,{status})});
 assert.equal(result.status,503);
 const details=await result.json();
 assert.equal(details.code,expected);
 assert.equal(details.reference,base.requestId);
 assert.equal(failures.at(-1).code,expected);
 assert.equal(failures.at(-1).providerStatus,status);
 assert.doesNotMatch(JSON.stringify(details),/test-only-key|visitor@example.com|Test Visitor|Test Company/);
}
let result=await handleEnquiry(request(),{...options,fetcher:async()=>new Response("<html>upstream failure</html>",{status:502})});
assert.equal((await result.json()).code,"EMAIL_PROVIDER_UNAVAILABLE");
result=await handleEnquiry(request(),{...options,fetcher:async()=>{throw new DOMException("Private network failure test-only-key","TimeoutError")}});
assert.equal((await result.json()).code,"EMAIL_TIMEOUT");
result=await handleEnquiry(request(),{...options,config:{...config,apiKey:" \n ",from:"website@example.com"}});
assert.equal((await result.json()).code,"EMAIL_NOT_CONFIGURED");
for(const changed of [{from:"CloudFire <website@example.com>"},{to:"invalid"},{apiKey:"key\nbad"}]){
 result=await handleEnquiry(request(),{...options,config:{...config,...changed}});
 assert.equal((await result.json()).code,"EMAIL_CONFIGURATION_INVALID");
}
result=await handleEnquiry(request(),{...options,config:{...config,turnstileSiteKey:"site"}});
assert.equal((await result.json()).code,"SPAM_CHECK_NOT_CONFIGURED");
const paddedCalls=[];
result=await handleEnquiry(request({...base,message:'Build a website. <img src=x onerror=alert(1)> & keep this text.'}),{
 ...options,config:{...config,apiKey:" test-only-key \n",from:" website@example.com ",to:" inbox@example.com "},
 fetcher:async(url,init)=>{paddedCalls.push(init);return Response.json({messageId:"safe-message"},{status:201})}
});
assert.equal(result.status,200);
assert.equal(paddedCalls[0].headers["api-key"],"test-only-key");
const normalized=JSON.parse(paddedCalls[0].body);
assert.equal(normalized.sender.email,"website@example.com");
assert.deepEqual(normalized.to,[{email:"inbox@example.com"}]);
assert.doesNotMatch(normalized.htmlContent,/<img/);
assert.match(normalized.htmlContent,/&lt;img/);
assert.match(normalized.textContent,/<img/);
assert.doesNotMatch(JSON.stringify(failures),/test-only-key|visitor@example.com|Test Visitor|Test Company|private network|onerror/);
console.log("Enquiry checks passed: Brevo payload, retry keys, no budget, validation, spam limits, challenge checks, HTML escaping, setting normalization, safe diagnostic codes and honest delivery failures.");
