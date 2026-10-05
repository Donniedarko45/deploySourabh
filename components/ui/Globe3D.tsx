"use client";

// Adapted from Aceternity UI's 3D Globe: https://ui.aceternity.com/components/3d-globe.
// Local Earth maps, demand rendering when idle, and a static SVG fallback.
import { Component, Suspense, useCallback, useEffect, useId, useMemo, useRef, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useAmbientPlayback } from "../cloudfire/useAmbientPlayback";
import styles from "./Globe3D.module.css";

class GlobeBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Earth({ onReady }: { onReady: () => void }) {
  const [earth, bump] = useTexture(["/brand/earth-blue-marble.jpg", "/brand/earth-topology.png"]);
  const material = useMemo(() => {
    const surface = new THREE.MeshStandardMaterial({ map: earth, bumpMap: bump, bumpScale: 0.022, roughness: 0.8, color: "#b6b4ad" });
    surface.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>",
        "#include <map_fragment>\ndiffuseColor.rgb = vec3(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)));");
    };
    return surface;
  }, [earth, bump]);
  const atmosphere = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { atmosphereColor: { value: new THREE.Color("#ff5a36") } },
    vertexShader: "varying vec3 vNormal; varying vec3 vPosition; void main(){vNormal=normalize(normalMatrix*normal);vPosition=(modelViewMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: "uniform vec3 atmosphereColor; varying vec3 vNormal; varying vec3 vPosition; void main(){float rim=pow(1.0-abs(dot(vNormal,normalize(-vPosition))),2.5);gl_FragColor=vec4(atmosphereColor,rim*0.24);}",
    side: THREE.BackSide, transparent: true, depthWrite: false,
  }), []);
  useEffect(() => {
    onReady();
    return () => { material.dispose(); atmosphere.dispose(); };
  }, [material, atmosphere, onReady]);
  return <group rotation={[-0.12, -0.85, 0.1]}>
    <mesh material={material}><sphereGeometry args={[2, 64, 40]} /></mesh>
    <mesh scale={1.075} material={atmosphere}><sphereGeometry args={[2, 48, 24]} /></mesh>
    <mesh>
      <sphereGeometry args={[2.004, 32, 16]} />
      <meshBasicMaterial color="#e0b99e" wireframe transparent opacity={0.055} />
    </mesh>
  </group>;
}

export function Globe3D() {
  const host = useRef<HTMLDivElement>(null);
  const { seen, running, finePointer } = useAmbientPlayback(host);
  const id = useId();
  const ready = useCallback(() => { if (host.current) host.current.dataset.ready = "true"; }, []);
  const failed = useCallback(() => { if (host.current) host.current.dataset.ready = "false"; }, []);
  return <div ref={host} className={styles.globe} data-ai-globe data-ready="false" data-playing={running} aria-hidden="true">
    <svg className={styles.fallback} viewBox="0 0 400 400" fill="none" focusable="false">
      <defs><radialGradient id={id}><stop stopColor="#4c4945" /><stop offset="1" stopColor="#151515" /></radialGradient></defs>
      <circle cx="200" cy="200" r="152" fill={"url(#" + id + ")"} stroke="#79604d" />
      {[0, 1, 2].map(index => <ellipse key={index} cx="200" cy="200" rx={45 + index * 45} ry="152" stroke="#aaa192" opacity=".2" />)}
      {[0, 1, 2].map(index => <ellipse key={index} cx="200" cy="200" rx="152" ry={36 + index * 44} stroke="#aaa192" opacity=".2" />)}
    </svg>
    {seen && <GlobeBoundary onFailure={failed}>
      <Canvas frameloop={running ? "always" : "demand"} fallback={<span />} dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        camera={{ fov: 42, position: [0, 0, 7.2], near: 0.1, far: 100 }}
        className={styles.canvas}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 3, 5]} intensity={2.2} color="#f1ebdf" />
        <directionalLight position={[-4, 0, -2]} intensity={1.1} color="#ff7a49" />
        <Suspense fallback={null}><Earth onReady={ready} /></Suspense>
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={running && finePointer}
          enabled={running && finePointer} autoRotate={running} autoRotateSpeed={0.38}
          enableDamping dampingFactor={0.1} rotateSpeed={0.35} />
      </Canvas>
    </GlobeBoundary>}
  </div>;
}