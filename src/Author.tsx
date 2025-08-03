import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useRef, useState } from 'react'

export default function Author() {
    const groupRef = useRef < THREE.Group > (null!)
    const [hovered, setHovered] = useState(false)
    const [t, setT] = useState(0)

    // Animation flottante (sinus)
    useFrame((_, delta) => {
        setT((prev) => prev + delta)
        if (groupRef.current) {
            groupRef.current.position.y = 20 + Math.sin(t * 2) * 0.5
        }

        groupRef.current.rotation.y = -50.2
    })

    // Clique : ouvrir lien
    const handleClick = () => {
        window.open('https://github.com/Wafo007', '_blank')
    }

    return (
        <group
            ref={groupRef}
            position={[15, -20, -150]}
            onClick={handleClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            {/* Plaque lumineuse */}
            <mesh>
                <planeGeometry args={[80, 65]} />
                <meshStandardMaterial
                    color={hovered ? '#ffaa00' : '#333'}
                    emissive={hovered ? '#ff9900' : '#111'}
                    metalness={0.3}
                    roughness={0.4}
                />
            </mesh>

            {/* Texte par-dessus la plaque */}
            <Text
                position={[0, 0, 0.01]}
                fontSize={6}
                background='black'
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.3}
                outlineColor="black"
            >
                Author :
                WAFO PAUlNAIF
            </Text>
        </group>
    )
}
