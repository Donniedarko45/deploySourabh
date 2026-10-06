export const servicePages = [
  { slug: "product-engineering", capability: "product-engineering", title: "Custom Software & Web App Development", description: "Design and build custom websites, web applications, mobile products and connected APIs with CloudFire.",
    headline: "Software shaped around your business.", needs: ["A new product with a focused first release", "A manual process ready for a connected application", "An existing system that needs to evolve"],
    process: ["Define the critical user journeys and the boundaries of the first release.", "Design and engineer the interface, APIs and integrations together.", "Review working increments and prepare the software for handover and operation."] },
  { slug: "ai-automation", capability: "ai-automation", title: "AI Automation for Business", description: "Connect documents, knowledge and business tools with practical AI automation, clear evaluation and human review.",
    headline: "Put intelligence around the work.", needs: ["Customer requests that need better context", "Documents that create repetitive re-entry", "Disconnected tools and operational handoffs"],
    process: ["Map the workflow, exceptions and the decisions that need a person.", "Build a focused automation around the data and tools it actually needs.", "Evaluate real examples, agree review controls and plan a deliberate rollout."] },
  { slug: "cloud-platform", capability: "cloud-platform", title: "Cloud Engineering & DevOps", description: "Build repeatable deployments, useful monitoring and cloud platforms your team can understand and operate.",
    headline: "A platform your team can rely on.", needs: ["Deployments that depend on manual steps", "A platform that is difficult to observe or recover", "Cloud architecture ready for its next stage"],
    process: ["Understand the current system, its operational needs and its failure modes.", "Create repeatable infrastructure and delivery workflows.", "Document ownership, monitoring and recovery before handover."] },
  { slug: "experience-growth", capability: "experience-growth", title: "UI/UX Design & Design Systems", description: "Make complex digital journeys clearer with product research, interaction design, accessible interfaces and reusable design systems.",
    headline: "Make the next step feel clear.", needs: ["A customer journey with too much friction", "A complex product that needs a coherent interface", "Inconsistent patterns across screens and releases"],
    process: ["Understand the people, tasks and points of friction.", "Prototype the critical journeys and test the design decisions.", "Build reusable patterns and connect the experience to product engineering."] },
] as const;
