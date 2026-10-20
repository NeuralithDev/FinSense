import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// 3D Institutional Card Mesh
function CreditCardMesh() {
  const cardRef = useRef();

  useFrame((state) => {
    if (!cardRef.current) return;
    const { pointer } = state;
    cardRef.current.rotation.x = THREE.MathUtils.lerp(cardRef.current.rotation.x, -pointer.y * 0.25 + 0.08, 0.06);
    cardRef.current.rotation.y = THREE.MathUtils.lerp(cardRef.current.rotation.y, pointer.x * 0.35 - 0.15, 0.06);
  });

  return (
    <group ref={cardRef}>
      {/* Institutional Slate Card Body */}
      <RoundedBox args={[3.4, 2.14, 0.08]} radius={0.12} smoothness={4}>
        <meshPhysicalMaterial
          roughness={0.25}
          metalness={0.3}
          transmission={0.4}
          ior={1.4}
          reflectivity={0.8}
          thickness={0.4}
          color="#0F172A"
          specularColor="#FFFFFF"
          transparent
          opacity={0.98}
        />
      </RoundedBox>

      {/* Brushed Platinum Smart Chip */}
      <mesh position={[-1.1, 0.45, 0.05]}>
        <boxGeometry args={[0.42, 0.32, 0.02]} />
        <meshStandardMaterial metalness={0.8} roughness={0.3} color="#CBD5E1" />
      </mesh>

      {/* Brand Text */}
      <Text
        position={[0.85, 0.65, 0.06]}
        fontSize={0.2}
        color="#FFFFFF"
        anchorX="right"
      >
        FinSense.
      </Text>

      {/* Card Number */}
      <Text
        position={[-1.1, -0.15, 0.06]}
        fontSize={0.16}
        color="#F8FAFC"
        anchorX="left"
      >
        •••• 8492
      </Text>

      {/* Autopilot Safe Badge */}
      <Text
        position={[-1.1, -0.65, 0.06]}
        fontSize={0.11}
        color="#0D9488"
        anchorX="left"
      >
        0% OVERDRAFT IMMUNITY
      </Text>
    </group>
  );
}

export default function GlassCard3D() {
  return (
    <div style={{ width: '100%', height: '400px', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={2.2} color="#FFFFFF" />
        <pointLight position={[-4, 3, 2]} intensity={1.8} color="#FFFFFF" />
        <pointLight position={[4, -3, 2]} intensity={1.2} color="#0D9488" />

        <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.3}>
          <CreditCardMesh />
        </Float>
      </Canvas>
    </div>
  );
}
