// FollowCamera.tsx
import { useFrame } from '@react-three/fiber';
import { MutableRefObject } from 'react';
import * as THREE from 'three';

type Props = {
  target: THREE.Object3D | null;
  controls: MutableRefObject<any>;
};

export default function FollowCamera({ target, controls }: Props) {
  useFrame(() => {
    if (target && controls.current) {
      controls.current.target.lerp(target.position, 0.5);
      controls.current.update();
    }
  });

  return null;
}
