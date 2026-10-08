"use client";

import { useEffect, useRef } from "react";
import { AsciiRenderer } from "@/lib/ascii-world";
import { useSiteMotion } from "./SiteMotion";
import styles from "./AsciiWorld.module.css";

/** One viewport-sized world for the entire homepage. DOM content owns every interaction. */
export default function AsciiWorld() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stopped = useRef(false);
  const { paused } = useSiteMotion();
  useEffect(() => { stopped.current = paused; window.dispatchEvent(new Event("ascii-motion")); }, [paused]);

  useEffect(() => {
    const element=canvas.current;
    if (!element) return;
    const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine=window.matchMedia("(pointer: fine)");
    let renderer: AsciiRenderer | undefined;
    let frame=0, resizeTimer=0, last=0, time=9, scene=0, targetScene=0, energy=0, frames=0, cost=0, quality=1;
    let intro=0, dirty=true, contextLost=false;
    let anchors: { top:number; scene:number }[]=[];
    const pointer=[.7,.5,0], target=[.7,.5,0], wake=[.7,.5,0];
    const ripples=new Float32Array(16); let rippleIndex=0;
    let previousX=.7, previousY=.5, previousTime=0;
    const measure = () => {
      const scenes:[string,number][]=[[".hero",0],["#work",1],["#capabilities",2],[".positioning-section",3],["#engineering",3.6],["#ai",4],["#engagements",4.5],[".final-cta",5]];
      anchors=scenes.flatMap(([selector,state])=>{
        const section=document.querySelector<HTMLElement>(`main ${selector}`);
        return section?[{top:state===0?0:section.getBoundingClientRect().top+window.scrollY-window.innerHeight*.32,scene:state}]:[];
      });
      scroll();
    };
    const scroll = () => {
      const y=window.scrollY;
      targetScene=0;
      for(let i=0;i<anchors.length;i++) {
        if(y<anchors[i].top) break;
        const next=anchors[i+1];
        targetScene=next ? anchors[i].scene+(next.scene-anchors[i].scene)*Math.min(1,Math.max(0,(y-anchors[i].top)/(next.top-anchors[i].top))) : anchors[i].scene;
      }
      dirty=true; schedule();
    };
    const resize=()=>{
      if (!renderer || contextLost) return;
      renderer.resize(window.innerWidth,window.innerHeight,quality); measure(); dirty=true; schedule();
    };
    const schedule=()=>{ if (renderer && !frame && !document.hidden && !contextLost) frame=requestAnimationFrame(draw); };
    const draw=(now:number)=>{
      frame=0;
      const still=reduce.matches||stopped.current;
      if(quality<1&&!still&&!dirty&&now-last<1000/30) {schedule();return;}
      const dt=Math.min(.05,Math.max(.001,(now-(last||now-16))/1000)); last=now;
      if(!still) {
        time+=dt; intro=Math.min(1,intro+dt*.8);
        scene+=(targetScene-scene)*(1-Math.exp(-dt*3.5));
        for(let i=0;i<3;i++) pointer[i]+=(target[i]-pointer[i])*(1-Math.exp(-dt*7));
        wake[2]*=Math.exp(-dt*3.5); energy*=Math.exp(-dt*1.8);
        for(let i=0;i<4;i++) ripples[i*4+2]+=dt;
      } else { scene=targetScene; intro=1; pointer[2]=0; wake[2]=0; ripples.fill(0); energy=0; }
      if(renderer&&(!still||dirty)) {
        renderer.render(time,scene,pointer,wake,ripples,energy,intro);
        cost+=dt; frames++;
        if(frames===120) {
          if(cost/frames>.028&&quality>.65) { quality=.65; resize(); }
          frames=0; cost=0;
        }
        element.dataset.scene=scene.toFixed(2); element.dataset.motion=still?"still":"live"; element.dataset.quality=String(quality);
        dirty=false;
      }
      if(!still) schedule();
    };
    const move=(event:PointerEvent)=>{
      if(!fine.matches||event.pointerType!=="mouse"||reduce.matches||stopped.current) return;
      const x=event.clientX/innerWidth,y=1-event.clientY/innerHeight;
      const speed=Math.hypot(x-previousX,y-previousY)/Math.max(.016,(event.timeStamp-previousTime)/1000);
      wake[0]=previousX; wake[1]=previousY; wake[2]=Math.min(1,speed*.35);
      target[0]=x; target[1]=y; target[2]=1;
      previousX=x; previousY=y; previousTime=event.timeStamp;
    };
    const leave=()=>{target[2]=0;};
    const click=(event:PointerEvent)=>{
      if(reduce.matches||stopped.current||(event.target as Element)?.closest("a,button,input,textarea,summary,select")) return;
      const offset=(rippleIndex++%4)*4;
      ripples.set([event.clientX/innerWidth,1-event.clientY/innerHeight,0,event.pointerType==="touch"?.5:1],offset);
    };
    const pulse=()=>{energy=1; dirty=true; schedule();};
    const visibility=()=>{last=0; if(document.hidden) {cancelAnimationFrame(frame);frame=0;} else {dirty=true;schedule();}};
    const lost=(event:Event)=>{event.preventDefault();contextLost=true;cancelAnimationFrame(frame);frame=0;element.dataset.available="false";};
    const restored=()=>{contextLost=false;renderer?.dispose();initialize();};
    const initialize=()=>{
      try { renderer=new AsciiRenderer(element);resize();element.dataset.available="true";schedule(); }
      catch { renderer?.dispose();renderer=undefined;element.dataset.available="false"; }
    };
    initialize();
    const observer=new ResizeObserver(measure);
    const main=document.getElementById("main-content"); if(main) observer.observe(main);
    const selections=new MutationObserver(pulse);
    if(main) selections.observe(main,{subtree:true,attributes:true,attributeFilter:["aria-pressed","aria-selected"]});
    const onResize=()=>{clearTimeout(resizeTimer);resizeTimer=window.setTimeout(resize,160);};
    window.addEventListener("resize",onResize);
    window.addEventListener("scroll",scroll,{passive:true});
    window.addEventListener("pointermove",move,{passive:true});
    window.addEventListener("pointerdown",click,{passive:true});
    document.addEventListener("pointerleave",leave);
    document.addEventListener("visibilitychange",visibility);
    window.addEventListener("ascii-pulse",pulse); window.addEventListener("ascii-motion",visibility);
    reduce.addEventListener("change",visibility);
    element.addEventListener("webglcontextlost",lost);element.addEventListener("webglcontextrestored",restored);
    return ()=>{
      cancelAnimationFrame(frame);clearTimeout(resizeTimer);observer.disconnect();selections.disconnect();renderer?.dispose();
      window.removeEventListener("resize",onResize);window.removeEventListener("scroll",scroll);window.removeEventListener("pointermove",move);window.removeEventListener("pointerdown",click);
      document.removeEventListener("pointerleave",leave);document.removeEventListener("visibilitychange",visibility);
      window.removeEventListener("ascii-pulse",pulse);window.removeEventListener("ascii-motion",visibility);reduce.removeEventListener("change",visibility);
      element.removeEventListener("webglcontextlost",lost);element.removeEventListener("webglcontextrestored",restored);
    };
  },[]);

  return <div className={styles.world} aria-hidden="true"><pre className={styles.fallback}>{STATIC_SILK}</pre><canvas ref={canvas} className={styles.canvas} /></div>;
}

const STATIC_SILK=Array.from({length:58},(_,row)=>Array.from({length:100},(_,column)=>{
  const x=(column-50)/27,y=(row-29)/20;
  const bend=x+.35*Math.sin(y*2.4);
  const envelope=Math.max(0,1-(bend*bend*.36+y*y*.5));
  const fold=Math.pow(Math.max(0,Math.cos(bend*4+y*y*2)),4)*envelope;
  return " .,:;~-=+*#%@"[Math.min(12,Math.floor(fold*12))];
}).join("")).join("\n");
