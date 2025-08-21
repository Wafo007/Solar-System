import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import OrbitingPlanet from './OrbitingPlanet';
import { useTexture } from '@react-three/drei';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, AdditiveBlending } from 'three';
import Moon from './Moon';
import SaturnWithRings from './SaturnWithRings';
import UranusWithRings from './UranusWithRings';
import OrbitCircle from './OrbitCircle';
import { useState } from 'react';
import FollowCamera from './FollowCamera';
import AsteroidBelt from './AsteroidBelt';
import BlackHole from './BlackHole';
import HamburgerMenu from './HamburgerMenu';
import PlanetFocusView from './PlanetFocusView';


type Props = {
    texture: string;
    selectedTool: string | null;
    onExplode?: () => void;
    sunExploded: boolean;
    onSelectTool: string;
};

//Boite a outil component
interface ToolboxOverlayProps {
    onSelectTool: (tool: string) => void;
    onResetSystem: () => void; // <-- nouveau prop
}

function ToolboxOverlay({ onSelectTool, onResetSystem }: ToolboxOverlayProps) {
    const [open, setOpen] = useState(false);

    return (
        <div style={{
            position: 'absolute',
            top: 120,
            right: 20,
            zIndex: 10,
            background: '#222',
            borderRadius: 8,
            padding: 10,
            color: 'white',
            fontFamily: 'sans-serif',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
        }}>
            <button onClick={() => setOpen(!open)} style={{
                background: '#444',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                padding: '6px 10px',
                cursor: 'pointer'
            }}>
                🧰 {open ? "Fermer" : "Ouvrir"} Outils
            </button>

            {open && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' }}>
                    <button
                        onClick={() => onSelectTool('laser')}
                        style={{
                            background: '#0078ff',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 10px',
                            marginTop: 4,
                            cursor: 'pointer'
                        }}
                    >
                        🔫 Activer le Laser
                    </button>

                    <button
                        onClick={onResetSystem} // <-- nouveau bouton
                        style={{
                            background: '#ff6600',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 10px',
                            marginTop: 8,
                            cursor: 'pointer'
                        }}
                    >
                        ♻️ Réinitialiser le système
                    </button>
                </div>
            )}
        </div>
    );
}

//Composant du soleil
const NUM_PARTICLES = 500;

function RealisticSun({ texture, selectedTool, onExplode, sunExploded }: Props) {
    const sunRef = useRef<THREE.Mesh>(null!);
    const flareRef = useRef<THREE.Sprite>(null!);
    const [scale, setScale] = useState(1);
    const [color, setColor] = useState(new THREE.Color('orange'));

    const map = useTexture(`/textures/${texture}`);
    const flareTexture = useLoader(TextureLoader, '/textures/solarflare.jpg');

    const positions = useRef<Float32Array>(new Float32Array(NUM_PARTICLES * 3));
    const velocities = useRef<THREE.Vector3[]>([]);
    const ages = useRef<number[]>([]);

    const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
    const [uniforms, setUniforms] = useState<any>(null);

    // Trigger explosion
    const triggerExplosion = () => {
        const vel: THREE.Vector3[] = [];
        const ageArr: number[] = [];
        for (let i = 0; i < NUM_PARTICLES; i++) {
            const dir = new THREE.Vector3(
                (Math.random() - 0.5),
                (Math.random() - 0.5),
                (Math.random() - 0.5)
            ).normalize();
            const speed = 2 + Math.random() * 200;
            vel.push(dir.multiplyScalar(speed));
            ageArr.push(0);

            positions.current[i * 3] = 0;
            positions.current[i * 3 + 1] = 0;
            positions.current[i * 3 + 2] = 0;
        }
        velocities.current = vel;
        ages.current = ageArr;

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions.current, 3));
        setGeometry(geo);

        // Uniforms pour le shader
        setUniforms({
            time: { value: 0 },
            lifespan: { value: 5 } // durée de vie particules
        });
    };

    useEffect(() => {
        if (sunExploded) triggerExplosion()
    }, [sunExploded]);

    useFrame((state, delta) => {
        // Soleil + flare
        if (!sunExploded && sunRef.current) {
            sunRef.current.rotation.y += 0.001;
            if (selectedTool === 'laser') {
                const newScale = scale + 0.02;
                setScale(newScale);
                sunRef.current.scale.set(newScale, newScale, newScale);
                const ratio = Math.min((newScale - 1) / 4, 1);
                setColor(new THREE.Color().lerpColors(new THREE.Color('orange'), new THREE.Color('blue'), ratio));
                if (newScale >= 5 && onExplode) onExplode();
            }
        }

        if (flareRef.current) {
            const time = state.clock.getElapsedTime();
            const flareScale = 6 + Math.sin(time * 3) * 0.8;
            flareRef.current.scale.set(flareScale, flareScale, 1);
        }

        // Explosion anim
        if (sunExploded && geometry && uniforms) {
            let allGone = true;
            for (let i = 0; i < NUM_PARTICLES; i++) {
                ages.current[i] += delta;
                const ageRatio = ages.current[i] / 5; // 5 sec lifespan

                if (ageRatio < 1) {
                    allGone = false;
                    positions.current[i * 3] += velocities.current[i].x * delta;
                    positions.current[i * 3 + 1] += velocities.current[i].y * delta;
                    positions.current[i * 3 + 2] += velocities.current[i].z * delta;
                    velocities.current[i].multiplyScalar(0.98); // friction
                }
            }

            geometry.attributes.position.needsUpdate = true;
            uniforms.time.value += delta;
        }
    });

    // Shader pour particules rondes et brillantes
    const particleShader = uniforms
        ? new THREE.ShaderMaterial({
            uniforms,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexShader: `
          attribute float size;
          varying float vAge;
          void main() {
            vAge = 0.0;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 10.0 * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
            fragmentShader: `
          varying float vAge;
          uniform float time;
          uniform float lifespan;
          void main() {
            float alpha = 1.0 - (time / lifespan);
            vec3 color = mix(vec3(1.0,0.5,0.0), vec3(1.0,1.0,1.0), time / lifespan);
            vec2 coord = gl_PointCoord - vec2(0.5);
            float dist = length(coord);
            if (dist > 0.5) discard;
            gl_FragColor = vec4(color, alpha);
          }
        `
        })
        : null;

    return (
        <group>
            {!sunExploded && (
                <mesh ref={sunRef}>
                    <sphereGeometry args={[22, 64, 64]} />
                    <meshStandardMaterial map={map} emissive={color} emissiveIntensity={2} />
                </mesh>
            )}
            {!sunExploded && (
                <sprite ref={flareRef}>
                    <spriteMaterial
                        map={flareTexture}
                        color="#ff5500"
                        transparent
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </sprite>
            )}

            {sunExploded && geometry && particleShader && (
                <points geometry={geometry} material={particleShader} />
            )}
        </group>
    );
}

const planetDescriptions: Record<string, string> = {
    mercury: "Mercure est la planète la plus proche du Soleil.",
    venus: "Vénus a une atmosphère très dense et chaude.",
    earth: "La Terre est la seule planète connue pour abriter la vie.",
    mars: "Mars est connue comme la planète rouge.",
    jupiter: "Jupiter est la plus grande planète du système solaire.",
    saturn: "Saturne est célèbre pour ses magnifiques anneaux.",
    uranus: "Uranus est inclinée sur le côté et a des anneaux fins.",
    neptune: "Neptune est une planète glacée et venteuse.",
};

export default function SolarSystem() {

    const [systemKey, setSystemKey] = useState(0); //Clé pour réinitialiser 
    const cityLightsMap = useLoader(TextureLoader, '/textures/earth_nightmap.jpg');
    const [followedPlanet, setFollowedPlanet] = useState<THREE.Object3D | null>(null);
    const [selectedPlanetName, setSelectedPlanetName] = useState<string | null>(null);
    const orbitControlsRef = useRef<any>(null); // pour accéder à OrbitControls
    const cloudMap = useLoader(TextureLoader, '/textures/earth_cloud.jpg'); // Ajoute cette image dans public/textures
    const [orbitSpeedFactor, setOrbitSpeedFactor] = useState(1);//Vitesse orbit des planettes
    const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null); //Pour le focus isolser de chaue planette en ajoutant un state global
    const [alignPlanets, setAlignPlanets] = useState(false); //un state pour dire que par defaut les planette ne sont pas alligner elle bouge normalement
    const [selectedTool, setSelectedTool] = useState<string | null>(null); //Boite a outil
    const [sunExploded, setSunExploded] = useState(false);

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

        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <>
                {/* Boîte à outils flottante */}
                <ToolboxOverlay
                    onSelectTool={(tool) => setSelectedTool(tool)}
                    onResetSystem={() => {
                        // réinitialisation complète
                        setSunExploded(false);
                        setSelectedPlanet(null);
                        setFollowedPlanet(null);
                        setSelectedPlanetName(null);
                        setAlignPlanets(false);
                        setOrbitSpeedFactor(1);
                        setSystemKey(prev => prev + 1); // force reconstruction du Canvas
                        setSelectedTool(null);
                    }}
                />
            </>
            {followedPlanet && (
                <button
                    onClick={() => {
                        if (selectedPlanetName) {
                            alert(planetDescriptions[selectedPlanetName]);
                        }
                    }}
                    style={{
                        position: 'absolute',
                        top: 20,
                        left: 120,
                        zIndex: 1,
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: '#3377ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                    }}>
                    En savoir plus
                </button>)
            } {/* Bouton Stop */} {followedPlanet && (<button onClick={() => setFollowedPlanet(null)} style={{ position: 'absolute', top: 20, left: 20, zIndex: 1, padding: '10px 20px', fontSize: '16px', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', }} > Stop </button>)}

            {/* boutons pour coontroller la vitesse de navigation */}
            <div style={{ position: 'absolute', top: 10, right: '10px', zIndex: 10, background: 'white', padding: '10px', borderRadius: '10px' }}>
                <label>Vitesse d’orbite: {orbitSpeedFactor.toFixed(1)}x</label>
                <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={orbitSpeedFactor}
                    onChange={(e) => setOrbitSpeedFactor(parseFloat(e.target.value))}
                />
            </div>

            {/* Boutons pour aliigner les Planete */}
            <div style={{ position: 'absolute', right: '10px', top: '60px', zIndex: 1000 }}>
                <button
                    onClick={() => setAlignPlanets(!alignPlanets)}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: alignPlanets ? '#666' : '#00cc88',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    {alignPlanets ? 'Revenir à l’orbite' : 'Aligner les planètes'}
                </button>
            </div>

            {/* Menu Hamburger */}
            <div>
                <HamburgerMenu onSelectPlanet={setSelectedPlanet} />
            </div>

            <Canvas
                key={systemKey} //Clé pour reccreer Canvas et reintailiser tout
                shadows
                camera={{ position: [0, 20, 50], fov: 60 }}
                gl={{ physicallyCorrectLights: true }}
            >

                <Suspense fallback={null}>
                    {/* Lumière du Soleil */}

                    <directionalLight
                        castShadow
                        position={[0, 0, 0]} // position du Soleil
                        intensity={2}
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                        shadow-camera-near={0.5}
                        shadow-camera-far={500}
                        shadow-camera-left={-50}
                        shadow-camera-right={50}
                        shadow-camera-top={50}
                        shadow-camera-bottom={-50}
                    />
                    <ambientLight intensity={1.9} />

                    {/* Soleil */}
                    <RealisticSun
                        texture="sun.jpg"
                        selectedTool={selectedTool}
                        sunExploded={sunExploded}
                        onExplode={() => setSunExploded(true)}
                    />

                    {/* planetee en orbite */}
                    {/* Mercury */}
                    {alignPlanets ? (
                        <OrbitingPlanet
                            texture="mercury.jpg"
                            radius={0.9}
                            orbitRadius={22.51} // plus d'orbite
                            orbitSpeed={0} // stop rotation
                            //position={[-50, 0, 0]} // position fixe
                            onClick={(ref) => {
                                setFollowedPlanet(ref);
                                setSelectedPlanetName("mercury");
                            }}
                            speedFactor={0}
                            targetPosition={alignPlanets ? new THREE.Vector3(25, 0, 0) : null} //Positionnement des planettes 
                        />
                    ) : (
                        <>
                            <OrbitCircle radius={23.51} color="white" />
                            <OrbitingPlanet
                                texture="mercury.jpg"
                                radius={0.9}
                                orbitRadius={23.51}
                                orbitSpeed={2.5}
                                onClick={(ref) => {
                                    setFollowedPlanet(ref);
                                    setSelectedPlanetName("mercury");
                                }}
                                sunPosition={new THREE.Vector3(0, 0, 0)} // ou position réelle du Soleil
                                sunExploded={sunExploded}
                                speedFactor={orbitSpeedFactor}

                            />
                        </>
                    )}


                    {/* Venus */}
                    {alignPlanets ? (
                        <OrbitingPlanet
                            texture="venus_surface.jpg"
                            radius={1.9}
                            orbitRadius={30.60}
                            orbitSpeed={0}
                            //position={[-50, 0, 0]}
                            onClick={(ref) => {
                                setFollowedPlanet(ref);
                                setSelectedPlanetName("venus");
                            }}
                            speedFactor={0}
                            targetPosition={alignPlanets ? new THREE.Vector3(32, 0, 0) : null} //Positionnement des planettes 
                        />

                    ) : (
                        <>
                            <OrbitCircle radius={30} color="lightyellow" />
                            <OrbitingPlanet
                                texture="venus_surface.jpg"
                                radius={1.9}
                                orbitRadius={30.60}
                                orbitSpeed={0.97}
                                onClick={(ref) => {
                                    setFollowedPlanet(ref);           // on stocke le ref pour que la caméra suive
                                    setSelectedPlanetName("venus");   // on stocke le nom pour afficher la description
                                }}
                                speedFactor={orbitSpeedFactor}
                            />
                        </>
                    )}


                    {/* Earth */}
                    {alignPlanets ? (
                        <OrbitingPlanet
                            texture="earth_daymap.jpg"
                            radius={2}
                            orbitRadius={36.05}
                            orbitSpeed={0}
                            //position={[-50, 0, 0]}
                            onClick={(ref) => {
                                setFollowedPlanet(ref);
                                setSelectedPlanetName("earth")
                            }}
                            speedFactor={0}
                            targetPosition={alignPlanets ? new THREE.Vector3(40, 0, 0) : null} //Positionnement des planettes 
                        >
                            {/* Lueur nocturnes */}
                            <group>
                                <mesh>
                                    <sphereGeometry args={[1 + 0.005, 64, 64]} />
                                    <meshStandardMaterial
                                        map={cityLightsMap}
                                        emissiveMap={cityLightsMap}
                                        emissiveIntensity={1.5}
                                        transparent
                                        opacity={0.5}
                                        depthWrite={false}
                                    />
                                </mesh>
                                <mesh>
                                    <sphereGeometry args={[2 + 0.01, 64, 64]} />
                                    <meshStandardMaterial
                                        map={cloudMap}
                                        transparent
                                        opacity={0.4}
                                        depthWrite={false}
                                    />
                                </mesh>
                            </group>

                            <Moon
                                texture="moon.jpg"
                                radius={0.6}
                                orbitRadius={3}
                                orbitSpeed={0.4}
                            />

                        </OrbitingPlanet>
                    ) : (

                        <>
                            {/* Orbites visibles */}
                            <OrbitCircle radius={36.05} color="lightblue" />
                            <OrbitingPlanet
                                texture="earth_daymap.jpg"
                                radius={2}
                                orbitRadius={36.05}
                                orbitSpeed={0.60}
                                onClick={(ref) => {
                                    setFollowedPlanet(ref);           // on stocke le ref pour que la caméra suive
                                    setSelectedPlanetName("earth");   // on stocke le nom pour afficher la description
                                }}
                                speedFactor={orbitSpeedFactor}
                            >
                                {/* Lueurs nocturnes */}
                                <group>
                                    <mesh>
                                        <sphereGeometry args={[1 + 0.005, 64, 64]} />
                                        <meshStandardMaterial
                                            map={cityLightsMap}
                                            emissiveMap={cityLightsMap}
                                            emissiveIntensity={1.5}
                                            transparent
                                            opacity={0.5}
                                            depthWrite={false}
                                        />
                                    </mesh>
                                    <mesh>
                                        <sphereGeometry args={[2 + 0.01, 64, 64]} />
                                        <meshStandardMaterial
                                            map={cloudMap}
                                            transparent
                                            opacity={0.4}
                                            depthWrite={false}
                                        />
                                    </mesh>
                                </group>

                                <Moon
                                    texture="moon.jpg"
                                    radius={0.6}
                                    orbitRadius={3}
                                    orbitSpeed={0.4}
                                />
                            </OrbitingPlanet>
                        </>
                    )}


                    {/* Mars */}
                    {alignPlanets ? (
                        <OrbitingPlanet
                            texture="mars.jpg"
                            radius={1.6}
                            orbitRadius={44.40}
                            orbitSpeed={0}
                            //position={[-50, 0, 0]}
                            onClick={(ref) => {
                                setFollowedPlanet(ref);
                                setSelectedPlanetName("mars");
                            }}
                            speedFactor={0}
                            targetPosition={alignPlanets ? new THREE.Vector3(50, 0, 0) : null} //Positionnement des planettes 
                        />
                    ) : (
                        <>
                            <OrbitCircle radius={44.40} color="lightorange" />
                            <OrbitingPlanet
                                texture="mars.jpg"
                                radius={1.6}
                                orbitRadius={44.40}
                                orbitSpeed={0.32}
                                onClick={(ref) => {
                                    setFollowedPlanet(ref);           // on stocke le ref pour que la caméra suive
                                    setSelectedPlanetName("mars");   // on stocke le nom pour afficher la description
                                }}
                                speedFactor={orbitSpeedFactor}
                            />
                        </>
                    )}

                    {/* Ceinture Asteroid */}
                    <AsteroidBelt />

                    {/* Jupiter */}
                    {alignPlanets ? (
                        <OrbitingPlanet
                            texture="jupiter.jpg"
                            radius={10.94}
                            orbitRadius={70.65}
                            orbitSpeed={0}
                            //position={[-50, 0, 0]}
                            onClick={(ref) => {
                                setFollowedPlanet(ref);
                                setSelectedPlanetName("jupiter")
                            }}
                            speedFactor={0}
                            targetPosition={alignPlanets ? new THREE.Vector3(80, 0, 0) : null} //Positionnement des planettes 
                        />
                    ) : (
                        <>
                            <OrbitCircle radius={70.65} color="lightgreen" />
                            <OrbitingPlanet
                                texture="jupiter.jpg"
                                radius={8.94}
                                orbitRadius={70.65}
                                orbitSpeed={0.051}
                                onClick={(ref) => {
                                    setFollowedPlanet(ref);           // on stocke le ref pour que la caméra suive
                                    setSelectedPlanetName("jupiter");   // on stocke le nom pour afficher la description
                                }}
                                speedFactor={orbitSpeedFactor}

                            />
                        </>
                    )}

                    {/* Saturne */}
                    {alignPlanets ? (
                        <SaturnWithRings
                            texture="saturn.jpg"
                            ringTexture="saturn_ring_alpha.png"
                            radius={6.28}
                            orbitRadius={100.45}
                            orbitSpeed={0}
                            //position={[50, 0, 0]}
                            onClick={(ref) => {
                                setFollowedPlanet(ref);
                                setSelectedPlanetName("saturn");
                            }}
                            speedFactor={0}
                            targetPosition={alignPlanets ? new THREE.Vector3(110, 0, 0) : null} //Positionnement des planettes 
                        />
                    ) : (
                        <>
                            <OrbitCircle radius={100.45} color="wheat" />
                            <SaturnWithRings
                                texture="saturn.jpg"
                                ringTexture="saturn_ring_alpha.png"
                                radius={6.28}
                                orbitRadius={100.45}
                                orbitSpeed={0.025}
                                onClick={(ref) => {
                                    setFollowedPlanet(ref);           // on stocke le ref pour que la caméra suive
                                    setSelectedPlanetName("saturn");   // on stocke le nom pour afficher la description
                                }}
                                speedFactor={orbitSpeedFactor}
                            />
                        </>
                    )}

                    {/* Uranus */}
                    {alignPlanets ? (
                        <UranusWithRings
                            texture="uranus.jpg"
                            ringTexture="saturn_ring_alpha.png"
                            radius={3}
                            orbitRadius={120}
                            orbitSpeed={0}
                            //position={[-50, 0, 0]}
                            onClick={(ref) => {
                                setFollowedPlanet(ref);
                                setSelectedPlanet("uranus");
                            }}
                            speedFactor={0}
                            targetPosition={alignPlanets ? new THREE.Vector3(135, 0, 0) : null} //Positionnement des planettes 
                        />
                    ) : (
                        <>
                            <OrbitCircle radius={120} color="lightpink" />
                            <UranusWithRings
                                texture="uranus.jpg"
                                ringTexture="saturn_ring_alpha.png"
                                radius={3}
                                orbitRadius={120}
                                orbitSpeed={0.08}
                                onClick={(ref) => {
                                    setFollowedPlanet(ref);           // on stocke le ref pour que la caméra suive
                                    setSelectedPlanetName("uranus");   // on stocke le nom pour afficher la description
                                }}
                                speedFactor={orbitSpeedFactor}
                            />
                        </>
                    )}

                    {/* Neptune */}
                    {alignPlanets ? (
                        <OrbitingPlanet
                            texture="neptune.jpg"
                            radius={6.74}
                            orbitRadius={130.35}
                            orbitSpeed={0}
                            //position={[-50, 0, 0]}
                            onClick={(ref) => {
                                setSelectedPlanet(ref);
                                setSelectedPlanetName("neptune");
                            }}
                            speedFactor={0}
                            targetPosition={alignPlanets ? new THREE.Vector3(155, 0, 0) : null} //Positionnement des planettes 
                        />
                    ) : (
                        <>
                            <OrbitCircle radius={130.35} color="lightblue" />
                            <OrbitingPlanet
                                texture="neptune.jpg"
                                radius={6.74}
                                orbitRadius={130.35}
                                orbitSpeed={0.015}
                                onClick={(ref) => {
                                    setFollowedPlanet(ref);           // on stocke le ref pour que la caméra suive
                                    setSelectedPlanetName("neptune");   // on stocke le nom pour afficher la description
                                }}
                                speedFactor={orbitSpeedFactor}
                            />
                        </>
                    )}



                    {/* Planètes */}
                    {/*
                        <PlanetWithTexture name="Terre" texture="earth_daymap.jpg" position={[10, 0, 0]} radius={1.5} rotationSpeed={0.01} />
                        <PlanetWithTexture name="Jupiter" texture="jupiter.jpg" position={[22, 0, 0]} radius={3} rotationSpeed={0.005} />
                    */}

                    {/* Etoiles de fond */}
                    <Stars radius={150} depth={60} count={10000} factor={4} saturation={0} fade />

                    <OrbitControls ref={orbitControlsRef} enablePan={!followedPlanet} />
                    {followedPlanet && (
                        <FollowCamera target={followedPlanet} controls={orbitControlsRef} />
                    )}
                </Suspense>
                <BlackHole />
            </Canvas>
        </div>);

}
