import type { Metadata, Viewport } from "next";
import { Geist, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MotionProvider from "@/components/cloudfire/MotionProvider";
import Analytics from "@/components/cloudfire/Analytics";
import { siteUrl } from "@/lib/site";
import ScrollEffects from "@/components/cloudfire/ScrollEffects";
import CloudCompanion from "@/components/cloudfire/CloudCompanion";
const display = Geist({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "CloudFire | Product thinking. Engineering depth.", template: "%s | CloudFire" },
  description: "CloudFire combines strategy, design and engineering to build digital products, intelligent automation and cloud platforms that move businesses forward.",
  openGraph: { title: "CloudFire | Product thinking. Engineering depth.", description: "A technology partner for ambitious digital products.", type: "website", siteName: "CloudFire", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "CloudFire | Products that ship. Systems that last." }] },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0A0A0A", colorScheme: "dark" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${display.variable} ${body.variable} ${mono.variable}`}>
    <MotionProvider><a className="skip-link" href="#main-content">Skip to content</a><Navbar />
    <main id="main-content">{children}</main><Footer /><ScrollEffects /><CloudCompanion /></MotionProvider>
    <Analytics websiteId={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID} scriptUrl={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js"} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "CloudFire IT Services", url: siteUrl, email: "info@cloudfireitservices.com", sameAs: ["https://www.linkedin.com/company/cloudfire-it-services/"] }).replace(/</g, "\\u003c") }} />
  </body></html>;
}
