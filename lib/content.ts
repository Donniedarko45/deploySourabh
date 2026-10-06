/**
 * Approved publishing source. The former site contained demo clients and metrics.
 * Do not migrate them here. A record requires a real source and explicit approval.
 */
export interface Approval { approved: boolean; source: string }
/**
 * A shipped project. Every record links to the real thing (a live site or a public repository), and only states
 * what a visitor could verify there. `role` and `outcome` are deliberately optional: add them only when the
 * team has confirmed what CloudFire did and has a source for any result. They render when present.
 */
export interface ProjectImage { src: string; width: number; height: number }
export interface Project {
  slug: string; title: string; industry: string;
  summary: string; url: string; built: string[];
  image?: ProjectImage; featured?: boolean;
  role?: string; outcome?: string;
  verification: Approval;
}
export interface ClientStory {
  client: string; title: string; story: string; attribution: string;
  quote?: string; image?: string; verification: Approval;
}
export interface TrustItem { name: string; logo?: string; verification: Approval }
// The number of live projects, as stated by the CloudFire team (2026-10-05). The site shows a curated selection of them.
export const liveProjectCount = "20+";
// Display order is array order. Featured projects (with an image) lead the page; the rest form the index.
export const projects: Project[] = [
  { slug: "modulx", title: "MODULX", industry: "Industrial manufacturing · B2B",
    summary: "Product and quote site for a BIS-approved Diesel Exhaust Fluid manufacturer in Bhiwadi, Rajasthan, supplying everything from 10 litre buckets to 12 KL tankers across India.",
    url: "https://modulx.in/", built: ["Custom-built site"], featured: true,
    image: { src: "/work/modulx.jpg", width: 1440, height: 2600 },
    role: "End-to-end design and engineering.",
    verification: { approved: true, source: "Listed by the CloudFire team as its own work, 2026-10-05; public URL reachable when checked. User confirmed from-scratch delivery, 2026-10-06." } },
  { slug: "aegisstore", title: "AegisStore", industry: "Open source · Distributed systems",
    summary: "A distributed object store inspired by Amazon S3. Files live in buckets and are replicated across storage nodes, with SHA-256 verification, automatic failover, version restore and live analytics.",
    url: "https://github.com/Donniedarko45/AegisStore", built: ["Fastify", "React", "PostgreSQL", "Redis", "Docker"], featured: true,
    image: { src: "/work/aegisstore.jpg", width: 1440, height: 900 },
    role: "End-to-end design and engineering.",
    verification: { approved: true, source: "Public repository listed by the CloudFire team as its own work, 2026-10-05; README read the same day. User confirmed from-scratch delivery, 2026-10-06." } },
  { slug: "death-wish-coffee", title: "Death Wish Coffee", industry: "E-commerce · Food & beverage",
    summary: "Online store for a USDA Organic and Fair Trade Certified coffee brand, with bundles, subscriptions and merchandise.",
    url: "https://www.deathwishcoffee.com/", built: ["Shopify"], featured: true,
    image: { src: "/work/death-wish-coffee.jpg", width: 1440, height: 2600 },
    role: "End-to-end design and engineering.",
    verification: { approved: true, source: "Listed by the CloudFire team as its own work, 2026-10-05; public URL reachable when checked. User confirmed from-scratch delivery, 2026-10-06." } },
  { slug: "101-blockchains", title: "101 Blockchains", industry: "Education · Web3 & AI",
    summary: "Training platform for Web3, blockchain and AI professionals, with courses and accredited certifications for individuals and teams.",
    url: "https://101blockchains.com/", built: ["WordPress"], featured: true,
    image: { src: "/work/101-blockchains.jpg", width: 1440, height: 2600 },
    role: "End-to-end design and engineering.",
    verification: { approved: true, source: "Listed by the CloudFire team as its own work, 2026-10-05; public URL reachable when checked. User confirmed from-scratch delivery, 2026-10-06." } },
  { slug: "kleenly", title: "Kleenly", industry: "E-commerce · Personal care",
    summary: "Direct-to-consumer storefront for a plastic-free, all-natural deodorant brand, built around bundle-building.",
    url: "https://livekleenly.com/", built: ["WordPress", "Elementor"],
    verification: { approved: true, source: "Listed by the CloudFire team as its own work, 2026-10-05; public URL reachable when checked." } },
  { slug: "remedy-films", title: "Remedy Films", industry: "Media · Video production",
    summary: "Site for an Atlanta video production company that makes film, photo and social content for brands and ad agencies.",
    url: "https://remedyfilms.com/", built: ["WordPress"],
    verification: { approved: true, source: "Listed by the CloudFire team as its own work, 2026-10-05; public URL reachable when checked." } },
  { slug: "ashwini-trading-academy", title: "Ashwini Trading Academy", industry: "Education · Financial markets",
    summary: "Site for a SEBI-registered research analyst's trading academy in Bangalore, with course information, live market sessions and a demo-class sign-up.",
    url: "https://ashwinitradingacademy.com/", built: ["Custom-built site"],
    verification: { approved: true, source: "Listed by the CloudFire team as its own work, 2026-10-05; public URL reachable when checked." } },
  { slug: "kudose", title: "Kudose Mental Health", industry: "Healthcare · Mental health",
    summary: "Site for a mental health practice offering services and medication management, with a patient portal.",
    url: "https://kudose2u.com/", built: ["WordPress"],
    verification: { approved: true, source: "Listed by the CloudFire team as its own work, 2026-10-05; public URL reachable when checked." } },
  { slug: "seawag", title: "Seawag", industry: "E-commerce · Consumer products",
    summary: "Storefront for a waterproof phone case brand, with separate storefronts for Europe, Australia, New Zealand and the USA.",
    url: "https://www.seawag.com/", built: ["Webflow"],
    verification: { approved: true, source: "Listed by the CloudFire team as its own work, 2026-10-05; public URL reachable when checked." } },
  { slug: "momo-and-co", title: "Momo & Co", industry: "Food & hospitality · London",
    summary: "Site for a London street-food business serving handmade Himalayan momo dumplings, with locations, click & collect, delivery and a loyalty club.",
    url: "https://momoandco.uk/", built: ["WordPress"],
    verification: { approved: true, source: "Listed by the CloudFire team as its own work, 2026-10-05; public URL reachable when checked." } },
  // Website delivery was confirmed by the CloudFire team on 2026-10-06. These records describe the website contribution, not the brands' wider products.
  { slug: "headspace", title: "Headspace", industry: "Health & wellness · App",
    summary: "Marketing site for the Headspace meditation, sleep and mental health app.",
    url: "https://www.headspace.com/", built: ["Next.js"], role: "Website design and engineering.",
    verification: { approved: true, source: "CloudFire team confirmed from-scratch delivery of the listed websites, 2026-10-06. This record describes the marketing website." } },
  { slug: "sephora", title: "Sephora", industry: "Retail · Beauty",
    summary: "Online storefront for the global beauty retailer.",
    url: "https://www.sephora.com/", built: ["Custom website"], role: "Website design and engineering.",
    verification: { approved: true, source: "CloudFire team confirmed from-scratch delivery of the listed websites, 2026-10-06. Specific technology details were not supplied." } },
];
export const clientStories: ClientStory[] = [];
export const trustItems: TrustItem[] = [];
const filled = (values: string[]) => values.every(value => value.trim().length > 0);
const approved = (verification: Approval) => verification.approved === true && filled([verification.source]);
const optional = (value?: string) => value === undefined || value.trim().length > 0;
export function publishableProjects(records: Project[]) {
  return records.filter(record => approved(record.verification) &&
    filled([record.slug, record.title, record.industry, record.summary]) &&
    /^https:\/\/[^\s/]+\.[^\s/]+/.test(record.url.trim()) &&
    record.built.length > 0 && filled(record.built) &&
    optional(record.role) && optional(record.outcome) &&
    (!["headspace", "sephora"].includes(record.slug) || !!record.role?.trim()) &&
    (!record.featured || (!!record.image && filled([record.image.src]) && record.image.width > 0 && record.image.height > 0)));
}
export function publishableStories(records: ClientStory[]) {
  return records.filter(record => approved(record.verification) &&
    filled([record.client, record.title, record.story, record.attribution]));
}
export function publishableTrust(records: TrustItem[]) {
  return records.filter(record => approved(record.verification) && filled([record.name]));
}
export const contactEmail = "info@cloudfireitservices.com";
export const linkedIn = "https://www.linkedin.com/company/cloudfire-it-services/";
export const capabilities = [
  { id: "product-engineering", number: "01", title: "Product Engineering", label: "FROM IDEA TO EVERYDAY ESSENTIAL",
    headline: "Build the product.\nMove the business.",
    description: "Turn a new idea, a manual process or an ageing application into a web or mobile product your team can run and improve.",
    items: ["Product strategy & technical discovery", "Web & mobile engineering", "API design & systems integration", "Modernization & ongoing evolution"],
    deliverable: "Working software, tested integrations and a documented handover, with a clear plan for the next release." },
  { id: "ai-automation", number: "02", title: "AI & Automation", label: "INTELLIGENCE WITH A PURPOSE",
    headline: "Less busywork.\nMore possibility.",
    description: "Help your team find answers, process documents and move work between systems, with clear checks before AI takes action.",
    items: ["Workflow mapping & opportunity assessment", "Document intelligence & knowledge retrieval", "Human-reviewed AI assistants", "Business system orchestration"],
    deliverable: "A focused workflow with review controls, measurable acceptance criteria, and a clear path to production." },
  { id: "cloud-platform", number: "03", title: "Cloud & Platform", label: "A FOUNDATION FOR WHAT COMES NEXT",
    headline: "Built to run.\nReady to evolve.",
    description: "Replace fragile deployments and unclear ownership with repeatable releases, useful monitoring and a recovery plan.",
    items: ["Cloud architecture & migration planning", "Infrastructure as code", "CI/CD & developer platforms", "Observability, reliability & security"],
    deliverable: "A documented platform, repeatable deployments, and visibility into how your systems behave." },
  { id: "experience-growth", number: "04", title: "Experience & Growth", label: "CLARITY AT EVERY INTERACTION",
    headline: "Make complex\nfeel intuitive.",
    description: "Find where users get stuck. Prototype clearer journeys, test them with people and build consistent interfaces your team can extend.",
    items: ["User research & product discovery", "Interaction design & prototyping", "Design systems & accessibility", "Product analytics & experimentation"],
    deliverable: "A coherent experience, a reusable design system, and a learning plan grounded in real user behavior." },
];
export const workflow = [
  { title: "Discover", body: "Understand the business, listen to users, and find the constraints that matter.", output: "A shared problem statement" },
  { title: "Define", body: "Turn ambition into a focused scope, a technical direction, and clear acceptance criteria.", output: "A practical product blueprint" },
  { title: "Design", body: "Make the experience tangible. Prototype the critical journeys before committing to code.", output: "An experience you can test" },
  { title: "Engineer", body: "Build in small, reviewable increments. Test the product and its operational foundations together.", output: "Working, reviewed software" },
  { title: "Scale", body: "Observe real usage, support the handover, and evolve the product around evidence.", output: "A clear path for the next release" },
];
export const insights = [
  { slug: "start-with-the-workflow", category: "AI & AUTOMATION", title: "Before you add AI, understand the workflow.", summary: "The most useful automation starts with a business problem, a clear boundary, and a person accountable for the result.",
    paragraphs: [
      "Start with a task that your team can describe clearly. Who initiates it? What information is needed? What does a useful result look like? If those answers are uncertain, adding a model introduces another uncertainty rather than resolving the original one.",
      "Map the handoffs, exceptions, and checks in the current workflow. Repetitive, well-defined steps may need ordinary automation. Tasks that depend on unstructured documents or contextual interpretation may benefit from AI. The right solution can combine both.",
      "Choose a narrow first release. Give the system access only to the information and actions it needs. Put human review before consequential changes, and make it possible to understand why a result was produced.",
      "Agree on an evaluation set before launch. Include routine inputs, incomplete information, and awkward exceptions. Compare results against an agreed baseline rather than treating a convincing demonstration as proof.",
      "Measure the whole workflow: time to a reviewed result, correction effort, escalation rate, and operational cost. The goal is a useful business process, not simply a successful model response."
    ] },
  { slug: "beyond-the-first-release", category: "PRODUCT ENGINEERING", title: "A good product is built beyond its first release.", summary: "The decisions that make software easier to change are often the ones your customers never see.",
    paragraphs: [
      "A first release establishes what a product can do. Its foundations determine how confidently the team can change it. Architecture, automated checks, and deployment practices belong in the product conversation from the beginning.",
      "Keep boundaries explicit. Describe which part of the system owns a capability, where its data lives, and how another service interacts with it. Start with the simplest structure that meets the requirements; complexity should earn its place.",
      "Write acceptance criteria around user journeys and failure behavior. A happy-path screen is only one part of the experience. Slow responses, missing data, interrupted connections, and recovery deserve deliberate design.",
      "Make delivery repeatable. Changes should pass meaningful checks and reach an environment where stakeholders can review them. Deployment and rollback should be documented, rather than depending on one person's memory.",
      "Treat handover as a product feature. Explain decisions, provide operational guidance, and make ownership clear. A system that another team can understand is better positioned for its next release."
    ] },
  { slug: "observability-is-a-product-decision", category: "CLOUD & PLATFORM", title: "Observability is a product decision.", summary: "You cannot improve what you cannot understand. Design visibility into your systems before you need it.",
    paragraphs: [
      "A production system needs to explain what it is doing. Logs, metrics, and traces are tools for that explanation, but collecting them without a question in mind creates noise.",
      "Begin with the journeys that matter. Can a person sign in, finish a transaction, or retrieve the information they need? Define signals that indicate whether those journeys are working, then connect them to the underlying services.",
      "Use context consistently. A request identifier across boundaries helps connect an interface failure to the API, service, or dependency responsible. Take care to avoid storing secrets or unnecessary personal information in telemetry.",
      "Make alerts actionable. An alert should indicate a condition that needs attention and point to a useful first step. Document ownership and recovery procedures alongside the alert.",
      "Review operating behavior with the product team. Reliability tradeoffs, infrastructure costs, and support patterns influence what should be built next. Visibility becomes valuable when it changes a decision."
    ] },
];
