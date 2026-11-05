import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Sparkles, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function createStarGeometry() {
  const shape = new THREE.Shape();
  const spikes = 5;
  const outer = 0.34;
  const inner = 0.145;
  for (let index = 0; index < spikes * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / spikes;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.014,
    bevelSegments: 2,
  });
  geometry.center();
  return geometry;
}

function ProceduralPendant({ metal }) {
  const geometry = useMemo(() => createStarGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const links = [];
  for (let index = 0; index < 14; index += 1) {
    const t = index / 13;
    links.push({
      index,
      x: -0.42 + t * 0.84,
      y: 0.64 - Math.sin(t * Math.PI) * 0.24,
    });
  }

  return (
    <group>
      {links.map((link) => (
        <mesh key={link.index} position={[link.x, link.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.03, 0.007, 8, 12]} />
          <meshStandardMaterial color="#f0ddb0" metalness={0.45} roughness={0.32} emissive="#d6b77a" emissiveIntensity={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.16, 8]} />
        <meshStandardMaterial color="#f0ddb0" metalness={0.45} roughness={0.32} emissive="#d6b77a" emissiveIntensity={0.2} />
      </mesh>
      <mesh geometry={geometry} position={[0, -0.02, 0]}>
        <meshStandardMaterial color="#f3e2b8" metalness={0.4} roughness={0.28} emissive="#d6b77a" emissiveIntensity={0.35} />
      </mesh>
      <mesh geometry={geometry} position={[0, -0.02, 0.03]} scale={0.42}>
        <meshStandardMaterial color="#fff8e8" metalness={0.65} roughness={0.18} emissive={metal} emissiveIntensity={0.22} />
      </mesh>
    </group>
  );
}

function GltfPendant({ url, scale, y }) {
  const gltf = useGLTF(url);
  const cloned = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return <primitive object={cloned} scale={scale} position={[0, y, 0]} />;
}

function Necklace({ open, metal, modelUrl, modelScale, modelY }) {
  const ref = useRef(null);
  const base = useRef(-0.58);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const target = open ? 0.42 : -0.58;
    base.current += (target - base.current) * Math.min(1, delta * 2);
    const bob = open ? Math.sin(state.clock.elapsedTime * 1.25) * 0.02 : 0;
    ref.current.position.y = base.current + bob;
    if (open) ref.current.rotation.y += delta * 0.3;
  });

  return (
    <group ref={ref}>
      {modelUrl ? (
        <Suspense fallback={null}>
          <GltfPendant url={modelUrl} scale={modelScale} y={modelY} />
        </Suspense>
      ) : (
        <ProceduralPendant metal={metal} />
      )}
    </group>
  );
}

function GiftBox({ open, velvet, metal, children }) {
  const spin = useRef(null);
  const lid = useRef(null);
  const lidAngle = useRef(0);

  useFrame((state, delta) => {
    if (spin.current) {
      const sway = open ? 0.22 : Math.sin(state.clock.elapsedTime * 0.32) * 0.36;
      spin.current.rotation.y += (sway - spin.current.rotation.y) * Math.min(1, delta * 1.5);
    }
    if (lid.current) {
      const target = open ? -1.15 : 0;
      lidAngle.current += (target - lidAngle.current) * Math.min(1, delta * 2.1);
      lid.current.rotation.x = lidAngle.current;
    }
  });

  return (
    <group ref={spin} position={[0, -0.12, 0]}>
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[1.74, 0.68, 1.28]} />
        <meshStandardMaterial color={metal} metalness={0.42} roughness={0.38} emissive={metal} emissiveIntensity={0.22} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.58, 0.58, 1.12]} />
        <meshStandardMaterial color="#6d2746" roughness={0.78} metalness={0.05} emissive={velvet} emissiveIntensity={0.42} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[1.38, 0.07, 0.94]} />
        <meshStandardMaterial color="#7a3050" roughness={0.9} emissive="#3c1025" emissiveIntensity={0.2} />
      </mesh>
      {children}
      <group ref={lid} position={[0, 0.14, -0.56]}>
        <mesh position={[0, 0.045, 0.56]}>
          <boxGeometry args={[1.68, 0.1, 1.22]} />
          <meshStandardMaterial color={metal} metalness={0.42} roughness={0.38} emissive={metal} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 0.09, 0.56]}>
          <boxGeometry args={[1.5, 0.05, 1.04]} />
          <meshStandardMaterial color="#6d2746" roughness={0.78} emissive={velvet} emissiveIntensity={0.38} />
        </mesh>
      </group>
    </group>
  );
}

function CameraRig({ open, onSettle }) {
  const progress = useRef(0);
  const settled = useRef(false);
  useFrame((state, delta) => {
    const goal = open ? 1 : 0;
    progress.current += (goal - progress.current) * Math.min(1, delta * 1.6);
    if (open && progress.current > 0.97) {
      if (!settled.current) {
        settled.current = true;
        onSettle();
      }
      return;
    }
    const t = progress.current;
    state.camera.position.set(0, 1.24 - t * 0.42, 4.1 - t * 1.5);
    state.camera.lookAt(0, -0.02 + t * 0.3, 0);
  });
  return null;
}

function Stage({ open, quality, metal, velvet, modelUrl, modelScale, modelY }) {
  const [ready, setReady] = useState(false);
  const count = quality === "low" ? 14 : quality === "medium" ? 28 : 46;

  return (
    <>
      <ambientLight intensity={0.72} />
      <hemisphereLight args={["#fff6e4", "#3c1025", 0.55]} />
      <spotLight position={[2.4, 5.2, 3.1]} angle={0.52} penumbra={0.8} intensity={22} color="#fff6e4" />
      <directionalLight position={[-3.2, 2.4, 2.2]} intensity={1.6} color="#ffd9ae" />
      <pointLight position={[0, 0.55, 0.8]} intensity={open ? 6 : 1.1} color="#ffd7a2" distance={6} decay={2} />
      <GiftBox open={open} velvet={velvet} metal={metal}>
        <Necklace open={open} metal={metal} modelUrl={modelUrl} modelScale={modelScale} modelY={modelY} />
      </GiftBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]}>
        <circleGeometry args={[1.45, quality === "low" ? 24 : 48]} />
        <meshStandardMaterial color="#12121a" metalness={0.35} roughness={0.55} transparent opacity={0.92} />
      </mesh>
      {quality !== "low" ? (
        <ContactShadows
          position={[0, -0.94, 0]}
          opacity={0.48}
          scale={7}
          blur={2.3}
          far={3.4}
          color="#000000"
          resolution={quality === "high" ? 512 : 256}
        />
      ) : null}
      <Sparkles count={count} scale={[3.4, 2, 2.6]} size={2} speed={0.3} color="#d6b77a" opacity={0.65} />
      <CameraRig open={open} onSettle={() => setReady(true)} />
      {ready ? (
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={1.8}
          maxDistance={5.4}
          minPolarAngle={0.78}
          maxPolarAngle={1.38}
          target={[0, 0.28, 0]}
        />
      ) : null}
    </>
  );
}

export default function JewelryCanvas({ open, quality, metal, velvet, modelUrl, modelScale, modelY, onReady }) {
  const dpr = quality === "low" ? [1, 1] : quality === "medium" ? [1, 1.3] : [1, 1.6];
  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 1.24, 4.1], fov: 36 }}
      gl={{ antialias: quality !== "low", alpha: true, stencil: false, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        window.requestAnimationFrame(() => onReady?.());
      }}
    >
      <Stage
        open={open}
        quality={quality}
        metal={metal}
        velvet={velvet}
        modelUrl={modelUrl}
        modelScale={modelScale}
        modelY={modelY}
      />
    </Canvas>
  );
}
