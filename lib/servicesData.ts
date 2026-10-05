export interface Service {
  id: string;
  title: string;
  description: string;
  iconName: string; // Storing icon name as string for serializability if needed, but we can also map it.
  gradient: string;
  border: string;
  longDescription: string;
  features: string[];
  benefits: string[];
}

export const servicesData: Service[] = [
  {
    id: "app-development",
    title: "App Development",
    description:
      "Native and cross-platform mobile applications crafted for performance and user engagement.",
    iconName: "Smartphone",
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "group-hover:border-blue-500/50",
    longDescription:
      "In a world dominated by mobile interactions, having a high-performance application is no longer a luxury. It is a necessity. We engineer robust, scalable, and intuitive mobile applications that serve as the perfect extension of your brand. Our expert developers specialize in both native iOS & Android development as well as powerful cross-platform solutions using React Native and Flutter. From concept to deployment and beyond, we ensure your app not only meets market standards but sets new benchmarks for user experience and functionality.",
    features: [
      "Custom Native iOS & Android Development",
      "High-Performance Cross-Platform Apps (React Native, Flutter)",
      "Intuitive UI/UX Design Tailored for Mobile",
      "Advanced API Integration & Backend Support",
      "Rigorous Testing & Quality Assurance",
      "App Store Optimization (ASO) & Launch Structure",
      "Ongoing Maintenance & Feature Updates",
    ],
    benefits: [
      "Direct Customer Access Anytime, Anywhere",
      "Enhanced Brand Visibility & Recognition",
      "Personalized User Experiences",
      "Increased Customer Loyalty & Retention",
      "New Revenue Streams via In-App Purchases",
    ],
  },
  {
    id: "web-development",
    title: "Web Development",
    description:
      "Responsive, high-speed websites and web apps built with the latest technologies like Next.js.",
    iconName: "Globe",
    gradient: "from-[#368ACA]/20 to-pink-500/20",
    border: "group-hover:border-[#368ACA]/50",
    longDescription:
      "Your website is the digital headquarters of your business, and first impressions matter. We create stunning, lightning-fast, and responsive websites that captivate visitors and convert them into loyal customers. Leveraging cutting-edge technologies like Next.js, React, and Tailwind CSS, we build scalable web architectures that are SEO-friendly, secure, and easy to manage. Whether it's a corporate site, a dynamic web application, or a complex e-commerce platform, we deliver digital experiences that drive growth.",
    features: [
      "Bespoke Website Design & Development",
      "Enterprise-Grade E-commerce Solutions",
      "Progressive Web Apps (PWA) for Offline Access",
      "Headless CMS Integration (Sanity, Contentful, Strapi)",
      "API Development & Third-Party Integrations",
      "Speed Optimization & Core Web Vitals Focus",
      "Robust Security Implementation",
    ],
    benefits: [
      "Global Reach 24/7/365",
      "Established Credibility & Professional Trust",
      "Seamless Experience Across Devices",
      "Scalable Infrastructure for Growth",
      "Data-Driven Insights on User Behavior",
    ],
  },
  {
    id: "software-solutions",
    title: "Software Solutions",
    description:
      "Custom software tailored to streamline your specific business processes and workflow.",
    iconName: "Code2",
    gradient: "from-green-500/20 to-emerald-500/20",
    border: "group-hover:border-green-500/50",
    longDescription:
      "Every business has unique challenges that generic software can't solve. We specialize in developing custom software solutions that perfectly align with your operational needs. From automating complex workflows to building comprehensive CRM and ERP systems, our software empowers your team to work smarter, not harder. We focus on security, scalability, and integration to ensure your custom solution grows with your business and provides a competitive edge.",
    features: [
      "End-to-End SaaS Product Development",
      "Custom CRM & ERP System Architecture",
      "Business Process Automation Software",
      "Secure Cloud-Based Solutions",
      "Legacy System Modernization & Migration",
      "Database Design, Management & Optimization",
      "Real-time Data Analytics Dashboards",
    ],
    benefits: [
      "Streamlined Operations & Efficiency",
      "Complete Ownership of Technology",
      "Reduced Operational Costs",
      "Enhanced Data Security & Compliance",
      "Agility to Adapting Market Needs",
    ],
  },
  {
    id: "social-media-mgmt",
    title: "Social Media Mgmt",
    description:
      "Strategic content planning and management to grow your brand presence online effectively.",
    iconName: "Share2",
    gradient: "from-pink-500/20 to-rose-500/20",
    border: "group-hover:border-pink-500/50",
    longDescription:
      "Social media is where conversations happen, and your brand needs to be a part of them. Our comprehensive social media management services help you build a vibrant community and foster meaningful connections with your audience. We craft data-backed strategies, create visually arresting content, and manage your community across all major platforms. By analyzing trends and engagement metrics, we ensure your brand voice resonates loud and clear, turning followers into advocates.",
    features: [
      "Platform-Specific Strategy Development",
      "Creative Content Production (Video/Graphics)",
      "Community Engagement & Moderation",
      "Targeted Social Media Advertising",
      "Influencer Partnership Management",
      "Monthly Performance Analytics & Reporting",
      "Crisis Management & PR",
    ],
    benefits: [
      "Skyrocketed Brand Awareness",
      "Direct Communication Channel",
      "Higher Website Traffic & Leads",
      "Improved Customer Insight",
      "Stronger Community Loyalty",
    ],
  },
  {
    id: "digital-marketing",
    title: "Digital Marketing",
    description:
      "SEO, PPC, and data-driven campaigns to drive traffic and convert leads into customers.",
    iconName: "TrendingUp",
    gradient: "from-yellow-500/20 to-orange-500/20",
    border: "group-hover:border-yellow-500/50",
    longDescription:
      "Visibility is the key to profitability. Our results-oriented digital marketing strategies break through the noise to get your business in front of the right people at the right time. We employ a holistic approach combining technical SEO, precision-targeted PPC campaigns, and compelling content marketing. We don't just drive traffic; we drive qualified leads that convert. Our goal is to maximize your ROI and establish your brand as an authority in your industry.",
    features: [
      "Comprehensive SEO (On-page, Off-page, Technical)",
      "Precision PPC Campaigns (Google Ads, Social Ads)",
      "Strategic Email Marketing Automation",
      "Content Marketing & Authority Building",
      "Conversion Rate Optimization (CRO)",
      "Detailed ROI Tracking & Attribution",
      "Local SEO & Google My Business Optimization",
    ],
    benefits: [
      "Significant Increase in Qualified Leads",
      "Measurable & Transparent ROI",
      "Dominant Search Engine Rankings",
      "Cost-Effective Customer Acquisition",
      "Sustainable Long-Term Growth",
    ],
  },
  {
    id: "ui-ux-design",
    title: "UI/UX Design",
    description:
      "Intuitive and beautiful user interfaces that provide seamless and enjoyable user experiences.",
    iconName: "Palette",
    gradient: "from-red-500/20 to-orange-500/20",
    border: "group-hover:border-red-500/50",
    longDescription:
      "Great design lies at the intersection of aesthetics and functionality. We craft immersive digital experiences that users love. Our UI/UX design process is deeply rooted in user research and behavioral psychology. We prototype, test, and refine every interaction to ensure it's intuitive, accessible, and delightful. From complex dashboards to sleek mobile interfaces, we ensure your product not only looks world-class but performs seamlessly.",
    features: [
      "In-Depth User Research & Persona Creation",
      "Information Architecture & User Flows",
      "Interactive Wireframing & Prototyping",
      "High-Fidelity User Interface (UI) Design",
      "Usability Testing & Iteration",
      "Comprehensive Design Systems & Style Guides",
      "Accessibility Compliance (WCAG)",
    ],
    benefits: [
      "Higher User Satisfaction & Retention",
      "Reduced Development Cost via Prototyping",
      "Increased Conversion Rates",
      "Stronger Brand Perception",
      "Intuitive Products requiring Less Support",
    ],
  },
];
