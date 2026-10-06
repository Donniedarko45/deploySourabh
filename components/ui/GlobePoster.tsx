"use client";
import { useId } from "react";
// Native vector globe for coarse pointers, data saving and reduced motion.
// No texture downloads or WebGL context are needed for this composition.
export function GlobePoster() {
  const id = useId();
  return <svg data-ai-globe data-quality="light" viewBox="0 0 400 400" fill="none" aria-hidden="true" focusable="false" style={{ width: "100%", height: "100%" }}>
    <defs><radialGradient id={id + "-surface"} cx=".32" cy=".25" r=".8"><stop stopColor="#666158" /><stop offset=".55" stopColor="#34312b" /><stop offset="1" stopColor="#121212" /></radialGradient>
      <radialGradient id={id + "-rim"}><stop offset=".6" stopColor="#ff5a36" stopOpacity="0" /><stop offset=".88" stopColor="#ff5a36" stopOpacity=".08" /><stop offset="1" stopColor="#ff5a36" stopOpacity="0" /></radialGradient>
      <clipPath id={id + "-clip"}><circle cx="200" cy="200" r="152" /></clipPath></defs>
    <circle cx="200" cy="200" r="180" fill={"url(#" + id + "-rim)"} />
    <circle cx="200" cy="200" r="152" fill={"url(#" + id + "-surface)"} stroke="#79604d" />
    <g clipPath={"url(#" + id + "-clip)"} fill="#b6b0a0" opacity=".23">
      <path d="M85 105L111 95L140 101L153 124L147 144L126 155L122 176L141 189L147 213L138 231L122 223L105 198L94 176L72 160L68 131ZM143 218L164 229L176 248L170 269L159 299L148 315L140 285L126 263L130 239Z" />
      <path d="M199 103L217 89L245 92L264 104L289 99L327 114L330 143L307 159L299 182L274 188L253 174L245 154L220 156L208 140L193 131ZM202 158L230 158L249 179L244 214L232 241L214 267L200 253L183 223L181 195ZM269 219L290 216L300 233L286 243ZM290 262L318 258L341 276L325 299L298 303L280 286Z" />
    </g>
    {[0, 1, 2].map(index => <ellipse key={index} cx="200" cy="200" rx={45 + index * 45} ry="152" stroke="#c4b8a1" opacity=".13" />)}
    {[0, 1, 2].map(index => <ellipse key={index} cx="200" cy="200" rx="152" ry={36 + index * 44} stroke="#c4b8a1" opacity=".13" />)}
  </svg>;
}
