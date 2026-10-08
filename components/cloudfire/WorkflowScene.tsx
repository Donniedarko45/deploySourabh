import type { CSSProperties } from "react";
import styles from "./WorkflowScene.module.css";

const points = [[28, 68], [51, 35], [104, 26], [161, 45], [183, 102], [163, 165], [111, 187], [47, 167], [22, 123]];
const delay = (index: number) => ({ animationDelay: `${index * -0.55}s` } as CSSProperties);

function Discover() {
  return <>
    <circle className={styles.orbit} cx="110" cy="107" r="77" /><circle className={styles.faint} cx="110" cy="107" r="43" />
    <g className={styles.connections}>{points.map(([x, y]) => <path key={x} d={`M${x} ${y} 110 107`} />)}</g>
    {points.map(([x, y], index) => <g key={x}><circle className={styles.node} cx={x} cy={y} r="5" /><circle className={styles.echo} style={delay(index)} cx={x} cy={y} r="10" /></g>)}
    <rect className={styles.core} x="89" y="86" width="42" height="42" rx="12" /><path className={styles.icon} d="M101 100h18M101 107h12M101 114h16" />
    <text className={styles.label} x="13" y="20">INPUT</text><text className={styles.label} x="139" y="213">INSIGHT</text>
  </>;
}

function Define() {
  return <>
    <path className={styles.faint} d="M110 19v18m0 156v19" />
    {[42, 92, 142].map((y, index) => <g key={y} className={styles.planCard} style={{ animationDelay: `${index * .18}s` }}>
      <rect className={styles.surface} x="31" y={y} width="151" height="40" rx="5" /><rect className={styles.core} x="43" y={y + 12} width="15" height="15" rx="3" />
      <path className={styles.line} d={`M69 ${y + 15}h${[57, 77, 48][index]}m-${[57, 77, 48][index]} 8h${[90, 52, 87][index]}`} /><text className={styles.label} x="147" y={y + 16}>0{index + 1}</text>
    </g>)}
    <path className={styles.accentLine} d="M22 62v100m0-100h9m-9 50h9m-9 50h9" /><circle className={styles.planDot} cx="22" cy="62" r="3" />
    <text className={styles.label} x="31" y="213">PRIORITIZED / ALIGNED</text>
  </>;
}

function Design() {
  return <>
    <rect className={styles.surface} x="15" y="34" width="188" height="145" rx="7" /><path className={styles.faint} d="M15 55h188M51 55v124" />
    {[26, 34, 42].map(x => <circle key={x} fill="#6a7068" cx={x} cy="45" r="2" />)}
    <path className={styles.line} d="M26 73h13m-13 14h13m-13 14h10m-10 52h13" />
    <g className={styles.assemble}><rect className={styles.core} x="64" y="68" width="125" height="39" rx="4" /><path className={styles.heroLines} d="M73 79h64m-64 9h47" /><rect className={styles.fill} x="160" y="81" width="20" height="13" rx="3" /></g>
    <g className={styles.assemble} style={{ animationDelay: ".25s" }}><rect className={styles.surface} x="64" y="116" width="59" height="48" rx="4" /><path className={styles.accentLine} d="m72 150 9-9 9 3 10-14 15-5" /><path className={styles.faint} d="M72 155h43" /></g>
    <g className={styles.assemble} style={{ animationDelay: ".5s" }}><rect className={styles.surface} x="131" y="116" width="58" height="48" rx="4" /><path className={styles.line} d="M140 128h36m-36 9h28m-28 9h33" /></g>
    {[64, 89, 114, 139].map((x, index) => <rect key={x} x={x} y="190" width="17" height="8" rx="2" fill={index === 0 ? "var(--stage-ink)" : ["", "#d3d4cd", "#888d88", "#555c59"][index]} />)}
    <path className={styles.cursor} d="m168 151 0-15 12 10-6 0-3 6Z" /><text className={styles.label} x="15" y="213">COMPONENTS / TOKENS</text>
  </>;
}

function Engineer() {
  return <>
    <rect className={styles.surface} x="19" y="29" width="180" height="116" rx="6" /><path className={styles.faint} d="M19 51h180" />
    <text className={styles.label} x="30" y="43">product.ts</text><text className={styles.label} x="165" y="43">main</text>
    <g className={styles.code}><path className={styles.accentLine} d="M39 66h26m7 0h39" /><path className={styles.line} d="M48 80h51m8 0h38M48 94h23m7 0h62M48 108h44m7 0h59" /><path className={styles.accentLine} d="M39 122h13" /></g>
    {[68, 82, 96, 110].map((y, index) => <text key={y} className={styles.lineNumber} x="28" y={y}>{index + 1}</text>)}
    <path className={styles.caret} d="M161 103v10" /><path className={styles.connections} d="M38 176h143" />
    {[38, 110, 181].map((x, index) => <g key={x}><circle className={styles.node} cx={x} cy="176" r="11" /><path className={styles.check} style={{ animationDelay: `${index * .7}s` }} d={`m${x - 4} 176 3 3 5-6`} /></g>)}
    <circle className={styles.pipelinePacket} cx="38" cy="176" r="2.5" />
    <text className={styles.label} x="25" y="204">BUILD</text><text className={styles.label} x="98" y="204">TEST</text><text className={styles.label} x="164" y="204">SHIP</text>
  </>;
}

function Scale() {
  return <>
    <path className={styles.connections} strokeDasharray="2 4" d="M110 74 45 112m65-38 66 38m-66-38V32" />
    {[[29, 98], [159, 98], [93, 16]].map(([x, y], index) => <g key={x} className={styles.infra} style={{ animationDelay: `${index * .7}s` }}><rect className={styles.surface} x={x} y={y} width="34" height="28" rx="5" /><path className={styles.line} d={`M${x + 8} ${y + 10}h18m-18 9h18`} /></g>)}
    <circle className={styles.core} cx="110" cy="74" r="16" /><path className={styles.icon} d="m102 74 5 5 10-11" />
    <path className={styles.faint} d="M21 144h178m-178 23h178m-178 23h178" /><path fill="var(--stage-ink)" opacity=".06" d="M21 189 43 185 65 190 87 177 109 181 131 163 153 169 175 151 197 144v49H21Z" />
    <g className={styles.growth}><path className={styles.accentLine} d="M21 189 43 185 65 190 87 177 109 181 131 163 153 169 175 151 197 144" /><circle className={styles.fill} cx="197" cy="144" r="3" /></g>
    <text className={styles.label} x="21" y="213">OBSERVE / ADAPT / GROW</text>
  </>;
}

const scenes = [Discover, Define, Design, Engineer, Scale];

export default function WorkflowScene({ phase, active }: { phase: number; active: boolean }) {
  const Scene = scenes[phase];
  return <svg className={styles.svg} viewBox="0 0 220 224" aria-hidden="true" focusable="false" data-active={active}><Scene /></svg>;
}
