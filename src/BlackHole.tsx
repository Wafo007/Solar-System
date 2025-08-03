import { useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { TextureLoader, AdditiveBlending } from 'three'

export default function BlackHole() {
  const diskRef = useRef<THREE.Mesh>(null!)
  const texture = useLoader(TextureLoader, '/textures/blackhole_disk.jpg')

  useFrame(() => {
    // Rotation dans le sens des aiguilles d'une montre autour de l’axe Y
    diskRef.current.rotation.y;
    
  })

  return (
    <group position={[0, 0, -300]}> {/* très éloigné, dans le "halo" du système solaire */}
      {/* Noyau sombre */}
      <mesh>
        <sphereGeometry args={[25, 74, 74]} /> {/* plus gros noyau */}
        <meshStandardMaterial color="black" />
      </mesh>

      {/* Disque d’accrétion lumineux */}
      <mesh ref={diskRef} rotation={[0, 0, 0]}>
        <ringGeometry args={[28, 60, 148]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={2}
          blending={AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
