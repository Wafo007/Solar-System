// Moon.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

type Props = {
  texture: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
};

export default function Moon({ texture, radius, orbitRadius, orbitSpeed }: Props) {
  const moonGroupRef = useRef<THREE.Group>(null!);
  const moonMeshRef = useRef<THREE.Mesh>(null!);
  const map = useTexture(`/textures/${texture}`);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Rotation de la lune autour de la Terre (locale)
    moonGroupRef.current.rotation.y = t * orbitSpeed;

    // Rotation propre de la lune
    moonMeshRef.current.rotation.y += 0.001;
  });

  return (
    <group ref={moonGroupRef}>
      <mesh ref={moonMeshRef} position={[orbitRadius, 0, 0]}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial map={map} />
      </mesh>
    </group>
  );
}
