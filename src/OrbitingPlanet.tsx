import { useRef, useState, useMemo, useEffect } from 'react';
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
    name: string;
    onRegister?: (name: string, ref: THREE.Group, radius: number) => void;
    // ⚡️ Nouvelle prop pour déclencher l’explosion depuis SolarSystem
    isExploding?: boolean;

};

export default function OrbitingPlanet({
    texture, radius, orbitRadius, orbitSpeed, children, onClick, speedFactor, targetPosition,
    isExploding = false /* valeur par défaut = non explosée */, name, onRegister
}: Props) {
    const planetRef = useRef<THREE.Group>(null!);
    const surfaceRef = useRef<THREE.Mesh>(null!);
    const cloudRef = useRef<THREE.Mesh>(null!);

    const surfaceMap = useTexture(`/textures/${texture}`);

    // 🔥 Ajout : état pour gérer si la planète a explosé
    const [exploded, setExploded] = useState(false);
    const [particles, setParticles] = useState<any[]>([]);

    useEffect(() => {
        // Informe le parent de la ref et du rayon unefois monté
        if (onRegister && planetRef.current) {
            onRegister(name, planetRef.current, radius);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 🔥 Déclencher explosion quand `isExploding` passe à true
    useEffect(() => {
        if (isExploding && !exploded) {
            setExploded(true);

            const count = 200; // un peu plus de fragments pour un effet réaliste
            const temp: any[] = [];
            for (let i = 0; i < count; i++) {
                temp.push({
                    position: new THREE.Vector3(0, 0, 0), // départ du centre
                    velocity: new THREE.Vector3(
                        (Math.random() - 0.5) * 2, // plus rapide
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2
                    ),
                    life: 0
                });
            }
            setParticles(temp);
        }
    }, [isExploding, exploded]);

    useFrame(({ clock }, delta) => {
        const t = clock.getElapsedTime();

        if (!exploded) {
            // 🌍 Animation orbitale normale tant que la planète n’a pas explosé
            if (targetPosition) {
                planetRef.current.position.lerp(targetPosition, 0.05);
            } else {
                planetRef.current.position.x = Math.cos(t * orbitSpeed * speedFactor) * orbitRadius;
                planetRef.current.position.z = Math.sin(t * orbitSpeed * speedFactor) * orbitRadius;
            }

            // Rotation de la planète
            if (surfaceRef.current) surfaceRef.current.rotation.y += 0.002;
            if (cloudRef.current) cloudRef.current.rotation.y += 0.0022;
        } else {
            // 💥 Animation des particules de l’explosion
            setParticles((prev) =>
                prev.map((p) => {
                    const newPos = p.position.clone().add(p.velocity.clone().multiplyScalar(delta * 30));
                    const newVel = p.velocity.clone().multiplyScalar(0.98); // friction
                    return {
                        ...p,
                        position: newPos,
                        velocity: newVel,
                        life: p.life + delta
                    };
                }).filter((p) => p.life < 5) // supprimer après 5s
            );
        }
    });


    return (
        <group
            ref={planetRef}
            onClick={() => {
                if (onClick && planetRef.current) {
                    onClick(planetRef.current);
                }
            }}
        >
            {!exploded ? (
                <>
                    {/* 🌍 Surface de la planète */}
                    <mesh ref={surfaceRef} castShadow receiveShadow>
                        <sphereGeometry args={[radius, 64, 64]} />
                        <meshStandardMaterial map={surfaceMap} />
                    </mesh>

                    {/* ☁️ Nuages */}
                    <mesh ref={cloudRef}></mesh>

                    {/* 🌙 Satellites éventuels */}
                    <group name="satellites">
                        {children}
                    </group>
                </>
            ) : (
                <>
                    {/* 💥 Particules de l’explosion */}
                    {particles.map((p, i) => (
                        <mesh key={i} position={p.position}>
                            <sphereGeometry args={[radius * 0.05 /* explosion plus realiste avec sa + p.life * 0.02*/, 8, 8]} />
                            <meshStandardMaterial
                                color={"orange"}
                                emissive={"yellow"}
                                emissiveIntensity={2}
                                transparent
                                opacity={Math.max(1 - p.life / 5, 0)} // disparaît progressivement
                            />
                        </mesh>
                    ))}
                </>
            )}
        </group>
    );
}