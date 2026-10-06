import type { Metadata } from "next";
function absoluteSiteUrl() {
  const configured = process.env.SITE_URL || "https://www.cloudfireitservices.com";
  const url = new URL(configured);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("SITE_URL must be an HTTP(S) URL");
  return url.origin;
}
export const siteUrl = absoluteSiteUrl();
export function pageMetadata(title: string, description: string, path: string): Metadata {
  const url = new URL(path, siteUrl).href;
  const images = [{ url: new URL("/opengraph-image", siteUrl).href, width: 1200, height: 630, alt: "CloudFire | Products that ship. Systems that last." }];
  return { title, description, alternates: { canonical: url },
    openGraph: { title: title + " | CloudFire", description, url, siteName: "CloudFire", type: "website", images },
    twitter: { card: "summary_large_image", title: title + " | CloudFire", description, images: [images[0].url] } };
}
export function bookingUrl() {
  const raw = process.env.BOOKING_URL;
  if (!raw) return undefined;
  try { const url = new URL(raw); return url.protocol === "https:" && ["cal.com", "www.cal.com", "app.cal.com", "calendly.com", "www.calendly.com"].includes(url.hostname) ? url.href : undefined; } catch { return undefined; }
}
