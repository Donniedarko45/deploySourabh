import Link from "next/link";
import { useId } from "react";
import styles from "./Brand.module.css";

// A single emblem: the flame cuts through the cloud, with a clear seam at small sizes.
const cloud = "M16 40C8.3 40 3 34.9 3 28.2C3 21.6 7.9 16.4 14.3 15.8C16 8.7 22.2 4 29.5 4C37.1 4 43.2 8.6 45.2 15.3C53.3 14.4 61 20.4 61 28.4C61 35.1 55.7 40 48 40Z";
const fire = "M34.7 17C37.4 28.3 27.4 31.5 24.4 38.1C20.6 46.3 26 56 34.4 56C44.9 56 49.6 46.2 44.8 38.6C42.8 35.5 40.4 34 40.7 29.9C36.9 32.8 37.4 38.4 34.4 40.3C37 31.9 35.1 24.7 34.7 17Z";

export function BrandMark({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg className={className} width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <mask id={`${id}-brand-cut`} x="0" y="0" width="64" height="64" maskUnits="userSpaceOnUse">
          <rect width="64" height="64" fill="white" />
          <path d={fire} fill="black" stroke="black" strokeWidth="5" strokeLinejoin="round" />
        </mask>
      </defs>
      <path d={cloud} fill="currentColor" mask={`url(#${id}-brand-cut)`} />
      <path d={fire} fill="var(--accent, #ff5a36)" />
      <path d="M33.4 40.8C34.2 45 29.1 46.8 30.7 50C32.5 53.5 38.5 52.7 39 48.9C39.4 46.7 36.7 45.6 36.8 43.7C35.6 44.7 35.8 46.6 34.5 47.5C35.6 44.6 34.4 42.6 33.4 40.8Z" fill="var(--background, #0a0a0a)" />
    </svg>
  );
}

export default function Brand() {
  return (
    <Link href="/" className={`brand ${styles.brand}`} aria-label="CloudFire IT Services home">
      <BrandMark className={styles.mark} />
      <span className={styles.lockup}>
        <span className={styles.wordmark}>cloudfire<span className={styles.dot} aria-hidden="true">.</span></span>
        <small className={styles.descriptor}><span aria-hidden="true" />IT SERVICES</small>
      </span>
    </Link>
  );
}
