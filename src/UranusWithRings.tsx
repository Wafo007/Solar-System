// UranusWithRings.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

type Props = {
  texture: string;
  ringTexture: string;
  radius: number;
  speedFactor: number; // nouveau
  orbitRadius: number;
  orbitSpeed: number;
  onClick?: (planetRef: THREE.Group) => void; // Ajout
  targetPosition?: THREE.Vector3 | null;
};

export default function UranusWithRings({ texture, ringTexture, radius, orbitRadius, orbitSpeed, speedFactor, onClick, targetPosition }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const planetRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  const planetMap = useTexture(`/textures/${texture}`);
  const ringMap = useTexture(`/textures/${ringTexture}`);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (targetPosition) {
      // Animation fluide vers targetPosition
      groupRef.current.position.lerp(targetPosition, 0.05); //0.05 = interpolation douce
    } else {
      // Orbite autour du Soleil
      groupRef.current.position.x = Math.cos(t * orbitSpeed * speedFactor) * orbitRadius;
      groupRef.current.position.z = Math.sin(t * orbitSpeed * speedFactor) * orbitRadius;
    }


    // Rotation propre
    planetRef.current.rotation.y += 0.001;

    // Rotation de l’anneau
    ringRef.current.rotation.y += 0.001;
  });

  return (
    <group ref={groupRef}
      onClick={() => {
        if (onClick && groupRef.current) {
          onClick(groupRef.current);
        }
      }}>
      {/* Uranus */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial map={planetMap} />
      </mesh>

      {/* Anneaux inclinés verticalement */}
      <mesh ref={ringRef} rotation={[THREE.MathUtils.degToRad(98), 0, 0]}>
        <ringGeometry args={[radius * 1.2, radius * 1.9, 64]} />
        <meshBasicMaterial
          map={ringMap}
          side={THREE.DoubleSide}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}
