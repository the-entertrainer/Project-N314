'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useRef } from 'react';

function Orb() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.2]} />
      <meshPhongMaterial 
        color="#10b981" 
        emissive="#064e3b" 
        shininess={80} 
        wireframe={false}
      />
    </mesh>
  );
}

export default function ThreeDOrb() {
  return (
    <div className="w-16 h-16">
      <Canvas camera={{ position: [0, 0, 4] }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <Orb />
        <Stars radius={50} depth={10} count={30} factor={2} saturation={0} fade speed={1} />
      </Canvas>
    </div>
  );
}
