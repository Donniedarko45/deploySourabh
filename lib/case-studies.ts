export interface CaseStudy {
  slug: string; projectSlug: string; headline: string; problem: string;
  role: string; approach: string[]; delivered: string[]; result: string;
  timeline?: string; verification: { approved: boolean; source: string };
}
const source = "CloudFire team confirmed end-to-end, from-scratch delivery on 2026-10-06. Product details use the supplied live project records. No business metrics, delivery duration or client quotation was supplied.";
export const caseStudies: CaseStudy[] = [
  {
    slug: "modulx", projectSlug: "modulx", headline: "Make an industrial product easier to understand and enquire about.",
    problem: "A B2B product website needs to help buyers understand specifications, compare supply formats and find a clear route to an enquiry. MODULX’s diesel exhaust fluid range spans individual containers through bulk supply.",
    role: "End-to-end website design and engineering.",
    approach: ["Organize the product story around the information a buyer needs: the product, its specifications and available formats.",
      "Bring product information and the quotation journey into one coherent customer-facing website.",
      "Keep the visual hierarchy clear so the product and the next step are easy to find."],
    delivered: ["A custom-built product website", "Product and supply-format information", "A route to quotation enquiries"],
    result: "A live website that gives customers a place to explore the MODULX range and begin a product enquiry.",
    verification: { approved: true, source },
  },
  {
    slug: "aegisstore", projectSlug: "aegisstore", headline: "Build the storage system behind the interface.",
    problem: "An object store has to do more than accept a file. It needs to organize objects, protect integrity, handle node failures and make its operating state understandable.",
    role: "End-to-end product and distributed-system engineering.",
    approach: ["Use buckets to organize stored objects and storage nodes to replicate them.",
      "Build integrity verification, version restoration and failover into the storage workflow.",
      "Expose system activity through an interface and live analytics, alongside the services that perform the storage work."],
    delivered: ["Bucket-based object storage", "Replicated storage nodes and automatic failover", "SHA-256 integrity verification", "Version restoration and live analytics"],
    result: "A public, inspectable object-storage implementation, with a React interface and documented services in the source repository.",
    verification: { approved: true, source },
  },
  {
    slug: "death-wish-coffee", projectSlug: "death-wish-coffee", headline: "Connect the product, the bundle and the repeat purchase.",
    problem: "A coffee storefront serves different shopping intentions: a first purchase, a bundle, a subscription and merchandise. The customer-facing experience needs to make those routes understandable.",
    role: "End-to-end storefront design and implementation.",
    approach: ["Bring products, bundles and subscription choices into the customer-facing storefront.",
      "Build the experience on Shopify, using its commerce foundations for the shopping journey.",
      "Give the brand and the product information a clear place in the experience."],
    delivered: ["A Shopify storefront", "Coffee, bundle and merchandise journeys", "Subscription shopping options"],
    result: "A live commerce experience where customers can explore the range, shop bundles and choose a subscription.",
    verification: { approved: true, source },
  },
  {
    slug: "101-blockchains", projectSlug: "101-blockchains", headline: "Help people find the right path through a growing subject.",
    problem: "Professional learning platforms need to make courses and certifications easier to navigate. People exploring Web3, blockchain and AI need to understand the available paths before choosing one.",
    role: "End-to-end learning-platform website delivery.",
    approach: ["Structure the customer-facing information around courses, certifications and learning needs.",
      "Use WordPress as the website’s publishing foundation.",
      "Connect the individual and team learning paths within the same platform experience."],
    delivered: ["A WordPress learning website", "Course and certification information", "Individual and team learning paths"],
    result: "A live training platform presenting courses and certifications for professionals and teams.",
    verification: { approved: true, source },
  },
];
export function publishableCaseStudies(records: CaseStudy[], approvedProjectSlugs: string[]) {
  return records.filter(item => item.verification.approved && item.verification.source.trim() &&
    approvedProjectSlugs.includes(item.projectSlug) && [item.slug, item.headline, item.problem, item.role, item.result].every(value => value.trim()) &&
    item.approach.length > 0 && item.delivered.length > 0 && [...item.approach, ...item.delivered].every(value => value.trim()));
}
