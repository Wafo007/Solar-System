import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

type Props = {
    texture: string;
    radius: number;
    orbitRadius: number;
    orbitSpeed: number;
    speedFactor: number; // nouveau
    children?: React.ReactNode;
    onClick?: (planetRef: THREE.Group) => void; // Ajout
    targetPosition?: THREE.Vector3 | null;
};

export default function OrbitingPlanet({ texture, radius, orbitRadius, orbitSpeed, children, onClick, speedFactor, targetPosition }: Props) {
    const planetRef = useRef<THREE.Group>(null!);
    const surfaceRef = useRef<THREE.Mesh>(null!);
    const cloudRef = useRef<THREE.Mesh>(null!);

    const surfaceMap = useTexture(`/textures/${texture}`);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();

        if (targetPosition) {
            // Animation fluide vers targetPosition
            planetRef.current.position.lerp(targetPosition, 0.05); // 0.05 = interpolation douce
        } else {
            // Mouvement orbital normal
            planetRef.current.position.x = Math.cos(t * orbitSpeed * speedFactor) * orbitRadius;
            planetRef.current.position.z = Math.sin(t * orbitSpeed * speedFactor) * orbitRadius;
        }

        // Rotation de la planète
        surfaceRef.current.rotation.y += 0.002;
        cloudRef.current.rotation.y += 0.0022;
    });


    return (
        <group ref={planetRef}
            onClick={() => {
                if (onClick && planetRef.current) {
                    onClick(planetRef.current);
                }
            }}>
            {/* Surface de la planète */}
            <mesh ref={surfaceRef} castShadow receiveShadow>
                <sphereGeometry args={[radius, 64, 64]} />
                <meshStandardMaterial map={surfaceMap} />
            </mesh>

            {/* Nuages */}
            <mesh ref={cloudRef}>

            </mesh>

            {/* Groupe pour les satellites (comme la Lune) */}
            <group name="satellites">
                {children}
            </group>
        </group>
    );
}
