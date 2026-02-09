'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei';
import { useRef } from 'react';
import { motion } from 'framer-motion-3d';
import * as THREE from 'three';

function AnimatedOrb() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere args={[1, 100, 200]} scale={2.2} ref={meshRef}>
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          emissive="#4f46e5"
          emissiveIntensity={0.2}
        />
      </Sphere>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#a855f7" />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#06b6d4" />
      
      <AnimatedOrb />
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
    </>
  );
}

export default function AvatarHero() {
  return (
    <div className="w-full h-[45vh] relative flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-dark)] z-10 pointer-events-none" />
      
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <Scene />
      </Canvas>
      
      <div className="absolute bottom-10 z-20 text-center w-full px-6">
        <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 animate-pulse">
          AI Companion
        </h1>
        <p className="text-[var(--text-muted)] mt-2 text-sm font-light tracking-wide">
          How can I help you today?
        </p>
      </div>
    </div>
  );
}
