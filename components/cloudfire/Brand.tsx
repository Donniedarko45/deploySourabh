import Link from "next/link";
export function BrandMark({ className = "" }: { className?: string }) {
  return <svg className={className} width="36" height="38" viewBox="0 0 36 38" fill="none" aria-hidden="true">
    <path d="M26 20.5H11a7 7 0 0 1-1-13.93A9.2 9.2 0 0 1 27.4 9.3 5.7 5.7 0 0 1 26 20.5Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/>
    <path d="M20.7 14.2c.7 6.4-8 7.4-8 13.1a6.6 6.6 0 0 0 13.2 0c0-3.3-2.2-5.2-2.2-5.2.4 3.1-1.3 4.1-2.4 4.3 1.5-5.1-.6-12.2-.6-12.2Z" fill="#FF5A36"/>
  </svg>;
}
export default function Brand() {
  return <Link href="/" className="brand" aria-label="CloudFire home"><BrandMark /><span>cloudfire<span className="brand-dot">.</span><small>IT SERVICES</small></span></Link>;
}
