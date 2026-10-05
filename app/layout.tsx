import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MotionProvider from "@/components/cloudfire/MotionProvider";
const display = Instrument_Sans({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });
export const metadata: Metadata = {
  title: { default: "CloudFire — Product thinking. Engineering depth.", template: "%s — CloudFire" },
  description: "CloudFire combines strategy, design and engineering to build digital products, intelligent automation and cloud platforms that move businesses forward.",
  openGraph: { title: "CloudFire — Product thinking. Engineering depth.", description: "A technology partner for ambitious digital products.", type: "website" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0A0A0A", colorScheme: "dark" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${display.variable} ${body.variable} ${mono.variable}`}>
    <MotionProvider><a className="skip-link" href="#main-content">Skip to content</a><Navbar />
    <main id="main-content">{children}</main><Footer /></MotionProvider>
  </body></html>;
}
