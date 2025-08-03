// OrbitCircle.tsx
import { Line } from '@react-three/drei';
import * as THREE from 'three';

type OrbitCircleProps = {
  radius: number;
  segments?: number;
  color?: string;
};

export default function OrbitCircle({ radius, segments = 128, color = 'gray' }: OrbitCircleProps) {
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
    />
  );
}
