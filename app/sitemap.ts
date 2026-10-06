import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { insights, projects, publishableProjects } from "@/lib/content";
import { caseStudies, publishableCaseStudies } from "@/lib/case-studies";
import { servicePages } from "@/lib/services";
export default function sitemap(): MetadataRoute.Sitemap {
  const studies = publishableCaseStudies(caseStudies, publishableProjects(projects).map(item => item.slug));
  const routes = ["/", "/capabilities", "/work", "/industries", "/insights", "/contact", "/privacy", "/services",
    ...insights.map(item => "/insights/" + item.slug),
    ...studies.map(item => "/work/" + item.slug),
    ...servicePages.map(item => "/services/" + item.slug)];
  return routes.map(path => ({ url: new URL(path, siteUrl).href }));
}
