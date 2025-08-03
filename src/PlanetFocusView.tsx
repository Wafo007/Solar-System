import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { useTexture, OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import './PlanetFocusView.css'
import HamburgerMenu from './HamburgerMenu'
import Author from './Author'
import OrbitCircle from './OrbitCircle'

const planetData: Record<string, {
    name: string
    gravity: string
    mass: string
    distanceFromSun: string
    moons: string
    temperature: string
    description: string
}> = {
    Mercury: {
        name: "Mercure",
        gravity: "3.7 m/s²",
        mass: "3.3 × 10²³ kg",
        distanceFromSun: "57.9 M km",
        moons: "0",
        temperature: "167°C",
        description: "Mercure est la planète la plus proche du Soleil, sans atmosphère significative."
    },
    Venus: {
        name: "Vénus",
        gravity: "8.87 m/s²",
        mass: "4.87 × 10²⁴ kg",
        distanceFromSun: "108.2 M km",
        moons: "0",
        temperature: "464°C",
        description: "Vénus a une atmosphère dense composée principalement de dioxyde de carbone."
    },
    Earth: {
        name: "Terre",
        gravity: "9.81 m/s²",
        mass: "5.97 × 10²⁴ kg",
        distanceFromSun: "149.6 M km",
        moons: "1 (la Lune)",
        temperature: "15°C",
        description: "Notre planète bleue abrite la vie et possède un champ magnétique protecteur."
    },
    Mars: {
        name: "Mars",
        gravity: "3.71 m/s²",
        mass: "6.42 × 10²³ kg",
        distanceFromSun: "227.9 M km",
        moons: "2 (Phobos, Deimos)",
        temperature: "-63°C",
        description: "Mars est connue comme la planète rouge, avec de grandes calottes polaires."
    },
    Jupiter: {
        name: "Jupiter",
        gravity: "24.79 m/s²",
        mass: "1.90 × 10²⁷ kg",
        distanceFromSun: "778.5 M km",
        moons: "79+",
        temperature: "-108°C",
        description: "Jupiter est la plus grande planète du système solaire, célèbre pour sa Grande Tache Rouge."
    },
    Saturn: {
        name: "Saturne",
        gravity: "10.44 m/s²",
        mass: "5.68 × 10²⁶ kg",
        distanceFromSun: "1.43 B km",
        moons: "83+",
        temperature: "-139°C",
        description: "Saturne possède les anneaux les plus spectaculaires du système solaire."
    },
    Uranus: {
        name: "Uranus",
        gravity: "8.69 m/s²",
        mass: "8.68 × 10²⁵ kg",
        distanceFromSun: "2.87 B km",
        moons: "27",
        temperature: "-195°C",
        description: "Uranus a une inclinaison extrême, tournant presque sur le côté."
    },
    Neptune: {
        name: "Neptune",
        gravity: "11.15 m/s²",
        mass: "1.02 × 10²⁶ kg",
        distanceFromSun: "4.5 B km",
        moons: "14",
        temperature: "-200°C",
        description: "Neptune est la planète la plus lointaine, célèbre pour ses vents violents."
    },
}


type Props = {
    planetName: string
    onBack: () => void
}

const planetTextures: Record<string, string> = {
    Mercury: 'mercury.jpg',
    Venus: 'venus_surface.jpg',
    Earth: 'earth_daymap.jpg',
    Mars: 'mars.jpg',
    Jupiter: 'jupiter.jpg',
    Saturn: 'saturn.jpg',
    Uranus: 'uranus.jpg',
    Neptune: 'neptune.jpg'
}

const ringTextures: Record<string, string> = {
    Saturn: 'saturn_ring_alpha.png',
    Uranus: 'saturn_ring_alpha.png'
}

//Le soleil
function Sun() {
    const texture = useTexture('/textures/sun.jpg')
    const sunRef = useRef<THREE.Mesh>(null!)

    useFrame(() => {
        if (sunRef.current) {
            sunRef.current.rotation.y += 0.001
        }
    })

    return (
        <mesh ref={sunRef} position={[800, 0, 0]}>
            <sphereGeometry args={[120, 64, 64]} />
            <meshStandardMaterial map={texture} emissiveIntensity={2} />
        </mesh>
    )
}

//Les autres planetes
function BasicPlanet({ textureUrl, onClick }: { textureUrl: string, onClick: () => void }) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const texture = useTexture(`/textures/${textureUrl}`)

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.002
        }
    })

    return (
        <mesh ref={meshRef} position={[0, 0, 0]} onClick={onClick}>
            <sphereGeometry args={[14, 64, 64]} />
            <meshStandardMaterial map={texture} />
        </mesh>
    )
}

//Les anneaux de saturne et uranus
function RingedPlanet({ textureUrl, ringTexture }: { textureUrl: string, ringTexture: string }) {
    const groupRef = useRef<THREE.Group>(null!)
    const planetMap = useTexture(`/textures/${textureUrl}`)
    const ringMap = useTexture(`/textures/${ringTexture}`)

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.002
        }
    })

    return (
        <group ref={groupRef}>
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[14, 64, 64]} />
                <meshStandardMaterial map={planetMap} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[18, 28, 64]} />
                <meshBasicMaterial
                    map={ringMap}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={1}
                />
            </mesh>
        </group>
    )
}

//La terre et ses nuages
function EarthWithClouds() {
    const earthRef = useRef<THREE.Mesh>(null!)
    const cloudRef = useRef<THREE.Mesh>(null!)

    const earthMap = useTexture('/textures/earth_daymap.jpg')
    const cloudMap = useTexture('/textures/earth_cloud.jpg')

    useFrame(() => {
        earthRef.current.rotation.y += 0.002
        cloudRef.current.rotation.y += 0.0035
    })

    return (
        <group>
            <mesh ref={earthRef} position={[0, 0, 0]}>
                <sphereGeometry args={[14, 64, 64]} />
                <meshStandardMaterial map={earthMap} />
            </mesh>
            <mesh ref={cloudRef} position={[0, 0, 0]}>
                <sphereGeometry args={[14.02, 64, 64]} />
                <meshStandardMaterial
                    map={cloudMap}
                    transparent
                    opacity={0.4}
                    depthWrite={false}
                />
            </mesh>
        </group>
    )
}

//Mini lune
function MiniMoon() {
    const moonRef = useRef<THREE.Mesh>(null!)
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime()
        const radius = 30
        moonRef.current.position.x = Math.cos(t * 0.4) * radius
        moonRef.current.position.z = Math.sin(t * 0.4) * radius
        moonRef.current.rotation.y += 0.008
    })

    const moonTexture = useTexture('/textures/moon.jpg')

    return (
        <mesh ref={moonRef}>
            <sphereGeometry args={[4, 32, 32]} />
            <meshStandardMaterial map={moonTexture} />
        </mesh>
    )
}

//Jupiter et ses lunes
function JupiterWithMoons() {
    const groupRef = useRef<THREE.Group>(null!);

    const jupiterMap = useTexture('/textures/jupiter.jpg');
    const ioMap = useTexture('/textures/io.jpg');
    const europaMap = useTexture('/textures/europa.jpg');
    const ganymedeMap = useTexture('/textures/ganymede.jpg');
    const callistoMap = useTexture('/textures/calisto.jpg');

    const moonOrbitSpeed = 0.01;

    // Créer des refs pour les lunes et leur animation
    const ioRef = useRef<THREE.Mesh>(null!);
    const europaRef = useRef<THREE.Mesh>(null!);
    const ganymedeRef = useRef<THREE.Mesh>(null!);
    const callistoRef = useRef<THREE.Mesh>(null!);
    const jupiterRef = useRef<THREE.Mesh>(null!);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (ioRef.current) {
            ioRef.current.position.set(Math.sin(t * 1.2) * 25, 0, Math.cos(t * 1.2) * 25);
        }
        if (europaRef.current) {
            europaRef.current.position.set(Math.sin(t * 0.9) * 30, 0, Math.cos(t * 0.9) * 30);
        }
        if (ganymedeRef.current) {
            ganymedeRef.current.position.set(Math.sin(t * 0.7) * 36, 0, Math.cos(t * 0.7) * 36);
        }
        if (callistoRef.current) {
            callistoRef.current.position.set(Math.sin(t * 0.5) * 42, 0, Math.cos(t * 0.5) * 42);
        }
        if(jupiterRef.current){
            jupiterRef.current.rotation.y += 0.002
        }
    });

    return (
        <group ref={groupRef}>
            {/* Jupiter */}
            <mesh ref={jupiterRef} position={[0, 0, 0]}>
                <sphereGeometry args={[14, 64, 64]} />
                <meshStandardMaterial map={jupiterMap} />
            </mesh>

            {/* Io */}
            <OrbitCircle radius={25} color="white" />
            <mesh ref={ioRef}>
                <sphereGeometry args={[2.5, 32, 32]} />
                <meshStandardMaterial map={ioMap} />
            </mesh>

            {/* Europa */}
            <OrbitCircle radius={30} color="white" />
            <mesh ref={europaRef}>
                <sphereGeometry args={[2.2, 32, 32]} />
                <meshStandardMaterial map={europaMap} />
            </mesh>

            {/* Ganymède */}
            <OrbitCircle radius={36} color="white" />
            <mesh ref={ganymedeRef}>
                <sphereGeometry args={[2.8, 32, 32]} />
                <meshStandardMaterial map={ganymedeMap} />
            </mesh>

            {/* Callisto */}
            <OrbitCircle radius={42} color="white" />
            <mesh ref={callistoRef}>
                <sphereGeometry args={[2.6, 32, 32]} />
                <meshStandardMaterial map={callistoMap} />
            </mesh>
        </group>
    );
}

export default function PlanetFocusView({ planetName, onBack }: Props) {
    const textureFile = planetTextures[planetName]
    const ringFile = ringTextures[planetName]
    const [showInfo, setShowInfo] = useState(false)
    const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null)

    //On teste si la planette est selectionne pour faire un focus simple
    if (selectedPlanet) {
        return (
            <PlanetFocusView
                planetName={selectedPlanet}
                onBack={() => setSelectedPlanet(null)}
            />
        )
    }

    return (
        <div style={{ height: '93vh' }}>
            {/* Menu Hamburger */}
            <div>
                <HamburgerMenu onSelectPlanet={setSelectedPlanet} />
            </div>


            {/* Button pour ouvrir le paneau infos */}
            <button
                onClick={() => setShowInfo(true)}
                className="absolute top-4 right-4 z-50 bg-white text-black px-4 py-2 rounded"
            >
                Infos
            </button>

            <button
                onClick={onBack}
                className="absolute top-4 left-4 z-50 bg-white text-black px-4 py-2 rounded"
            >
                Retour
            </button>

            <Canvas camera={{ position: [0, 0, 35], fov: 45 }}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 10, 10]} intensity={2} />
                <Stars radius={250} depth={70} count={8000} fade />

                <Sun />
                <Author />

                {/* Rendu conditionnel selon la planète */}
                {planetName === 'Earth' ? (
                    <>
                        <EarthWithClouds />
                        <MiniMoon />
                    </>
                ) : planetName === 'Jupiter' ? (
                    <JupiterWithMoons />
                ) : ringFile ? (
                    <RingedPlanet textureUrl={textureFile} ringTexture={ringFile} />
                ) : (
                    <BasicPlanet textureUrl={textureFile} />
                )}


                <OrbitControls enableZoom enablePan={false} />
            </Canvas>
            <div className={`info-panel ${showInfo ? 'open' : ''}`}>
                <button className="close-btn" onClick={() => setShowInfo(false)}>X</button>
                <h2 className="text-2xl font-bold mb-4">{planetData[planetName].name}</h2>
                <ul className="space-y-2 text-sm">
                    <li><strong>Gravité :</strong> {planetData[planetName].gravity}</li>
                    <li><strong>Masse :</strong> {planetData[planetName].mass}</li>
                    <li><strong>Distance du Soleil :</strong> {planetData[planetName].distanceFromSun}</li>
                    <li><strong>Lunes :</strong> {planetData[planetName].moons}</li>
                    <li><strong>Température :</strong> {planetData[planetName].temperature}</li>
                </ul>
                <p className="mt-4 text-sm italic opacity-80">
                    {planetData[planetName].description}
                </p>
            </div>
        </div>
    )
}
