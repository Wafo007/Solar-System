import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ASTEROID_COUNT = 1000; // augmente pour plus de densité

export default function AsteroidBelt() {
  const groupRef = useRef<THREE.Group>(null!);

  // Génère aléatoirement la position de chaque astéroïde
  const asteroids = useMemo(() => {
    const data = [];
    for (let i = 0; i < ASTEROID_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 55 + Math.random() * 10; // Ceinture entre Mars et Jupiter
      const y = (Math.random() - 0.5) * 2; // légère épaisseur verticale
      const speed = 0.001 + Math.random() * 0.002;

      data.push({ angle, radius, y, speed });
    }
    return data;
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      asteroids.forEach((asteroid, i) => {
        asteroid.angle += asteroid.speed;
        const x = Math.cos(asteroid.angle) * asteroid.radius;
        const z = Math.sin(asteroid.angle) * asteroid.radius;

        const mesh = groupRef.current.children[i] as THREE.Mesh;
        mesh.position.set(x, asteroid.y, z);
        mesh.rotation.y += 0.01; // rotation propre
      });
    }
  });

  return (
    <group ref={groupRef}>
      {asteroids.map((_, i) => (
        <mesh key={i} scale={0.3}>
          <sphereGeometry args={[0.5, 6, 6]} />
          <meshStandardMaterial color="#888888" roughness={1} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}
