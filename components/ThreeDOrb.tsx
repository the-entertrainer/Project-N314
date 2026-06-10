'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
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

interface ThreeDOrbProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
};

export default function ThreeDOrb({ size = 'md' }: ThreeDOrbProps) {
  return (
    <div className={`${sizeMap[size]} shrink-0`}>
      <Canvas camera={{ position: [0, 0, 4] }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <Orb />
        <Stars radius={50} depth={10} count={30} factor={2} saturation={0} fade speed={1} />
      </Canvas>
    </div>
  );
}
