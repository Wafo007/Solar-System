import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

type Props = {
  name: string;
  texture: string;
  position: [number, number, number];
  radius: number;
  rotationSpeed?: number;
};

export default function PlanetWithTexture({ texture, position, radius, rotationSpeed = 0.01 }: Props) {
  const planetRef = useRef<THREE.Mesh>(null!);
  const map = useTexture(`/textures/${texture}`);

  useFrame(() => {
    planetRef.current.rotation.y += rotationSpeed;
  });

  return (
    <mesh ref={planetRef} position={position} castShadow>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial map={map} />
    </mesh>
  );
}
