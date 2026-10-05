/**
 * Approved publishing source. The former site contained demo clients and metrics.
 * Do not migrate them here. A record requires a real source and explicit approval.
 */
export interface Approval { approved: boolean; source: string }
export interface CaseStudy {
  slug: string; title: string; industry: string; challenge: string;
  image: string; imageAlt: string; services: string[]; solution: string;
  outcome: string; verification: Approval;
}
export interface ClientStory {
  client: string; title: string; story: string; attribution: string;
  quote?: string; image?: string; verification: Approval;
}
export interface TrustItem { name: string; logo?: string; verification: Approval }
export const caseStudies: CaseStudy[] = [];
export const clientStories: ClientStory[] = [];
export const trustItems: TrustItem[] = [];
const filled = (values: string[]) => values.every(value => value.trim().length > 0);
const approved = (verification: Approval) => verification.approved === true && filled([verification.source]);
export function publishableCaseStudies(records: CaseStudy[]) {
  return records.filter(record => approved(record.verification) &&
    filled([record.slug, record.title, record.industry, record.challenge, record.image,
      record.imageAlt, record.solution, record.outcome]) &&
    record.services.length > 0 && filled(record.services));
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
    description: "Web and mobile platforms shaped around your users, your operations, and the next stage of your business.",
    items: ["Product strategy & technical discovery", "Web & mobile engineering", "API design & systems integration", "Modernization & ongoing evolution"],
    deliverable: "A maintainable product, an intentional architecture, and a team ready to own what comes next." },
  { id: "ai-automation", number: "02", title: "AI & Automation", label: "INTELLIGENCE WITH A PURPOSE",
    headline: "Less busywork.\nMore possibility.",
    description: "Connect the systems you already use. Put intelligence into the workflows that slow your team down.",
    items: ["Workflow mapping & opportunity assessment", "Document intelligence & knowledge retrieval", "Human-reviewed AI assistants", "Business system orchestration"],
    deliverable: "A focused workflow with review controls, measurable acceptance criteria, and a clear path to production." },
  { id: "cloud-platform", number: "03", title: "Cloud & Platform", label: "A FOUNDATION FOR WHAT COMES NEXT",
    headline: "Built to run.\nReady to evolve.",
    description: "Resilient infrastructure and delivery systems that make change safer, operations clearer, and scale more deliberate.",
    items: ["Cloud architecture & migration planning", "Infrastructure as code", "CI/CD & developer platforms", "Observability, reliability & security"],
    deliverable: "A documented platform, repeatable deployments, and visibility into how your systems behave." },
  { id: "experience-growth", number: "04", title: "Experience & Growth", label: "CLARITY AT EVERY INTERACTION",
    headline: "Make complex\nfeel intuitive.",
    description: "Digital product experiences that connect business intent with what people actually need to do.",
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
