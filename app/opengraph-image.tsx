import { ImageResponse } from "next/og";
export const alt = "CloudFire | Products that ship. Systems that last.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#0a0a0a", color: "#f2f1ea", padding: "66px 72px", position: "relative" }}>
    <div style={{ position: "absolute", display: "flex", right: -130, top: -140, width: 560, height: 560, borderRadius: "50%", border: "1px solid #ff5a3655", background: "radial-gradient(circle, #ff5a3618, #0a0a0a)" }} />
    <div style={{ position: "absolute", right: -70, top: -80, width: 440, height: 440, borderRadius: "50%", border: "1px solid #ff5a3633", display: "flex" }} />
    <div style={{ display: "flex", alignItems: "center", fontSize: 46, letterSpacing: -2, fontWeight: 700 }}>cloudfire<span style={{ color: "#ff5a36" }}>.</span></div>
    <div style={{ display: "flex", flexDirection: "column", marginTop: 74, fontSize: 78, lineHeight: 1.06, fontWeight: 700, letterSpacing: -4 }}><span>Products that ship.</span><span style={{ color: "#999892" }}>Systems that last<span style={{ color: "#ff5a36" }}>.</span></span></div>
    <div style={{ display: "flex", borderTop: "1px solid #ffffff24", marginTop: "auto", paddingTop: 25, fontSize: 20, color: "#b6b3a9", justifyContent: "space-between" }}><span>PRODUCT ENGINEERING · AI · CLOUD</span><span>cloudfireitservices.com</span></div>
  </div>, size);
}
