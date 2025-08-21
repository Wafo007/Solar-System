import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

type Props = {
    texture: string;
    radius: number;
    orbitRadius: number;
    orbitSpeed: number;
    speedFactor: number;
    children?: React.ReactNode;
    onClick?: (planetRef: THREE.Group) => void;
    targetPosition?: THREE.Vector3 | null;
    destroyed?: boolean; // nouveau : pour déclencher l’explosion depuis parent
};

export default function OrbitingPlanet({
    texture,
    radius,
    orbitRadius,
    orbitSpeed,
    children,
    onClick,
    speedFactor,
    targetPosition,
    destroyed = false
}: Props) {
    const planetRef = useRef<THREE.Group>(null!);
    const surfaceRef = useRef<THREE.Mesh>(null!);
    const cloudRef = useRef<THREE.Mesh>(null!);

    const surfaceMap = useTexture(`/textures/${texture}`);

    const [isExploding, setIsExploding] = useState(false);

    // Prépare les particules de l’explosion
    const explosionRef = useRef<THREE.Points>(null);
    const { positions, velocities, colors } = useMemo(() => {
        const count = 250;
        const pos = new Float32Array(count * 3);
        const vel = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            pos[i * 3] = 0;
            pos[i * 3 + 1] = 0;
            pos[i * 3 + 2] = 0;

            const dir = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(0.5 + Math.random() * 2);

            vel[i * 3] = dir.x;
            vel[i * 3 + 1] = dir.y;
            vel[i * 3 + 2] = dir.z;

            const c = new THREE.Color("#ffaa55").lerp(new THREE.Color("gray"), Math.random());
            col[i * 3] = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
        }
        return { positions: pos, velocities: vel, colors: col };
    }, []);

    const [life, setLife] = useState(1);

    useFrame(({ clock }, delta) => {
        const t = clock.getElapsedTime();

        if (!isExploding) {
            if (targetPosition) {
                planetRef.current.position.lerp(targetPosition, 0.05);
            } else {
                planetRef.current.position.x = Math.cos(t * orbitSpeed * speedFactor) * orbitRadius;
                planetRef.current.position.z = Math.sin(t * orbitSpeed * speedFactor) * orbitRadius;
            }

            surfaceRef.current.rotation.y += 0.002;
            cloudRef.current.rotation.y += 0.0022;

            // Si le parent indique destruction
            if (destroyed) {
                setIsExploding(true);
            }
        } else {
            // Animation particules
            const decay = 0.98;
            for (let i = 0; i < positions.length / 3; i++) {
                velocities[i * 3] *= decay;
                velocities[i * 3 + 1] *= decay;
                velocities[i * 3 + 2] *= decay;

                positions[i * 3] += velocities[i * 3] * delta * 10;
                positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 10;
                positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 10;
            }
            if (explosionRef.current) {
                (explosionRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
            }
            setLife(l => Math.max(l - delta * 0.5, 0));
        }
    });

    if (isExploding) {
        return (
            <points ref={explosionRef} position={planetRef.current?.position || [0,0,0]}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        array={positions}
                        count={positions.length / 3}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        array={colors}
                        count={colors.length / 3}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial vertexColors size={0.5} transparent opacity={life} depthWrite={false} />
            </points>
        );
    }

    return (
        <group
            ref={planetRef}
            onClick={() => {
                if (onClick && planetRef.current) {
                    onClick(planetRef.current);
                }
            }}
        >
            <mesh ref={surfaceRef} castShadow receiveShadow>
                <sphereGeometry args={[radius, 64, 64]} />
                <meshStandardMaterial map={surfaceMap} />
            </mesh>

            <mesh ref={cloudRef}></mesh>

            <group name="satellites">{children}</group>
        </group>
    );
}