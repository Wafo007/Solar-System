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
import { useThree } from '@react-three/fiber';

type Props = {
    texture: string;
    selectedTool: string | null;
    onExplode?: () => void;
    sunExploded: boolean;
    onSelectTool: string;
};


// Un faisceau laser qui part de la caméra et va jusqu'au point "to".
// Il vit "duration" secondes et s'éteint en douceur.
// On dessine deux cylindres : un coeur fin très lumineux + un halo plus large et plus transparent.
function LaserBeam({
    to,
    startedAt,
    duration = 5,            // durée du tir en secondes
    color = new THREE.Color('#ff2222'),
    onEnd
}: {
    to: THREE.Vector3;
    startedAt: number;
    duration?: number;
    color?: THREE.Color;
    onEnd: () => void;
}) {
    const coreRef = useRef<THREE.Mesh>(null!);
    const glowRef = useRef<THREE.Mesh>(null!);
    const { camera } = useThree(); // origine du tir = caméra

    useFrame((_, delta) => {
        const now = performance.now() / 1000;
        const t = (now - startedAt) / duration; // 0 → 1

        // Fin de vie : on notifie le parent pour retirer ce tir
        if (t >= 1) {
            onEnd();
            return;
        }

        // Calcul de géométrie : point de départ (caméra) → point d'arrivée (to)
        const from = new THREE.Vector3().copy(camera.position);
        const dir = new THREE.Vector3().subVectors(to, from);
        const len = dir.length();
        const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
        dir.normalize();

        // on oriente les cylindres : axe local Y → direction du faisceau
        const quat = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            dir
        );

        // intensité/largeur/alpha en fonction du temps (fade-out)
        const alpha = 1 - t;                  // opacité décroissante
        const coreRadius = 0.4 + 0.02 * (1 - t);  // coeur plus fin
        const glowRadius = 0.5 + 0.07 * (1 - t);  // halo plus large

        // Coeur du faisceau
        if (coreRef.current) {
            coreRef.current.position.copy(mid);
            coreRef.current.quaternion.copy(quat);
            coreRef.current.scale.set(coreRadius, len / 2, coreRadius); // hauteu  len (le cylindre de base fait 2 en Y)
            const mat = coreRef.current.material as THREE.MeshBasicMaterial;
            mat.color = color;
            mat.opacity = 0.9 * alpha; // très lumineux
        }

        // Halo externe
        if (glowRef.current) {
            glowRef.current.position.copy(mid);
            glowRef.current.quaternion.copy(quat);
            glowRef.current.scale.set(glowRadius, len / 2, glowRadius);
            const mat = glowRef.current.material as THREE.MeshBasicMaterial;
            mat.color = color;
            mat.opacity = 0.35 * alpha; // halo moins opaque
        }
    });

    return (
        <group>
            {/* Coeur du rayon - très lumineux */}
            <mesh ref={coreRef} renderOrder={999}>
                <cylinderGeometry args={[1, 1, 2, 16, 1, true]} />
                <meshBasicMaterial
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false} // NE subit pas la correction tonale, donc plus lumineux
                    color={'#ff2222'}
                    opacity={0.9}
                />
            </mesh>

            {/* Halo externe */}
            <mesh ref={glowRef} renderOrder={999}>
                <cylinderGeometry args={[1, 1, 2, 16, 1, true]} />
                <meshBasicMaterial
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    color={'#ff4444'}
                />
            </mesh>
        </group>
    );
}

//Boite a outil component
interface ToolboxOverlayProps {
    onSelectTool: (tool: string | null) => void; // on accepte null = désactivé
    onResetSystem: () => void;
    activeTool: string | null; // ✅ on passe l’état courant
}

function ToolboxOverlay({ onSelectTool, onResetSystem, activeTool }: ToolboxOverlayProps) {
    const [open, setOpen] = useState(false);

    const isLaserActive = activeTool === "laser"; // ✅ détection de l’état

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

                    {/* 🔴 Bouton Laser toggle */}
                    <button
                        onClick={() => onSelectTool(isLaserActive ? null : "laser")}
                        style={{
                            background: isLaserActive ? "#cc0000" : "#0078ff", // rouge si actif, bleu si inactif
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 10px',
                            marginTop: 4,
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {isLaserActive ? "🔴 Laser Activé" : "🔫 Activer le Laser"}
                    </button>

                    <button
                        onClick={onResetSystem}
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
type PlanetHandle = {
    name: string;
    ref: THREE.Group | undefined;
    radius: number;
};

function RealisticSun({
    texture,
    selectedTool,
    onExplode,
    sunExploded,
    // nouvelles props :
    isLaserArmed,
    onLaserHit, // (to: THREE.Vector3) => void
    planetsToCheck = [],
    onPlanetTouched
}: Props & { isLaserArmed: boolean; onLaserHit: (to: THREE.Vector3) => void; planetsToCheck?: PlanetHandle[]; onPlanetTouched: (name: string) => void }) {
    const sunRef = useRef<THREE.Mesh>(null!);
    const flareRef = useRef<THREE.Sprite>(null!);
    const [color, setColor] = useState(new THREE.Color('orange'));

    const map = useTexture(`/textures/${texture}`);
    const flareTexture = useLoader(TextureLoader, '/textures/solarflare.jpg');

    // <<< NOUVEAU : énergie accumulée par impacts laser
    const [heat, setHeat] = useState(0); // 0 → pas de chauffe, > seuil → explosion

    // Explosion particules : (on garde ton bloc d'avant si tu l'as déjà)
    const NUM_PARTICLES = 600;
    const positions = useRef<Float32Array>(new Float32Array(NUM_PARTICLES * 3));
    const velocities = useRef<THREE.Vector3[]>([]);
    const ages = useRef<number[]>([]);
    const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
    const [uniforms, setUniforms] = useState<any>(null);

    const SUN_BASE_RADIUS = 41; // DOIT correspondre à sphereGeometry du soleil
    const touchedPlanets = useRef<Set<string>>(new Set());

    const triggerExplosion = () => {
        const vel: THREE.Vector3[] = [];
        const ageArr: number[] = [];
        for (let i = 0; i < NUM_PARTICLES; i++) {
            const dir = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
            const speed = 2 + Math.random() * 120; // vitesse plus raisonnable
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

        setUniforms({
            time: { value: 0 },
            lifespan: { value: 5 }
        });
    };

    useEffect(() => {
        if (sunExploded) triggerExplosion();
    }, [sunExploded]);

    useFrame((state, delta) => {
        // rotation lente du soleil (si pas explosé)
        if (!sunExploded && sunRef.current) {
            sunRef.current.rotation.y += 0.001;

            // <<< Ici, plus d'auto-chauffe via selectedTool.
            // On chauffe UNIQUEMENT si l'utilisateur a cliqué le soleil avec le laser (voir onClick ci-dessous).

            // Décroissance de la chaleur (refroidissement lent)
            if (heat > 0) {
                setHeat((h) => Math.max(0, h - delta * 0.4)); // cool down
            }

            // Taille en fonction de la chaleur
            const baseScale = 1;
            const scale = baseScale + heat * 0.15; // +15% par unité de chaleur
            sunRef.current.scale.set(scale, scale, scale);

            // Couleur : orange → blanc selon heat
            const heatRatio = Math.min(heat / 10, 3); // clamp [0..1]
            const newColor = new THREE.Color().lerpColors(
                new THREE.Color('#ffff00'), // orange
                new THREE.Color('#0000ff'), // bleu
                heatRatio
            );
            setColor(newColor);

            // Collision : UNIQUEMENT tant que le soleil n'est pas explosé et qu'il est en phase de chauffe
            if (!sunExploded && sunRef.current) {
                // rayon effectif du soleil = rayon de base * son scale actuel
                const currentScale = sunRef.current.scale.x; // (x=y=z)
                const sunRadius = SUN_BASE_RADIUS * currentScale;
                const sunPos = new THREE.Vector3(0, 0, 0); // ton soleil est au centre

                planetsToCheck.forEach(({ name, ref, radius }) => {
                    if (!ref || !ref.position) return;
                    if (touchedPlanets.current.has(name)) return; // déjà détruite

                    const planetPos = ref.position.clone();
                    const dist = planetPos.distanceTo(sunPos);

                    // contact ?
                    if (dist <= sunRadius + radius) {
                        touchedPlanets.current.add(name);
                        onPlanetTouched(name); // -> SolarSystem => isExploding = true
                    }
                });
            }

            // Seuil d'explosion (ex : 6 clics laser rapides)
            if (heat > 6 && onExplode) {
                onExplode();
            }
        }

        // animation du flare
        if (!sunExploded && flareRef.current) {
            const time = state.clock.getElapsedTime();
            const flareScale = 6 + Math.sin(time * 3) * 0.8;
            flareRef.current.scale.set(flareScale, flareScale, 1);
        }

        // particules d'explosion du soleil
        if (sunExploded && geometry && uniforms) {
            for (let i = 0; i < NUM_PARTICLES; i++) {
                ages.current[i] += delta;
                if (ages.current[i] < 5) {
                    positions.current[i * 3] += velocities.current[i].x * delta;
                    positions.current[i * 3 + 1] += velocities.current[i].y * delta;
                    positions.current[i * 3 + 2] += velocities.current[i].z * delta;
                    velocities.current[i].multiplyScalar(0.985);
                }
            }
            geometry.attributes.position.needsUpdate = true;
            uniforms.time.value += delta;
        }
    });

    // Shader rond/blanc → transparent (comme on t’avait mis). Tu peux garder ton ShaderMaterial si tu l’as.
    const particleShader = uniforms
        ? new THREE.ShaderMaterial({
            uniforms,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexShader: `
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 6.0 * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
            fragmentShader: `
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
            {/* Soleil (clic = chauffe SI laser armé) */}
            {!sunExploded && (
                <mesh
                    ref={sunRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isLaserArmed) return; // on ignore si le laser n'est pas armé

                        // 1) On "chauffe" le soleil par un clic
                        setHeat((h) => Math.min(10, h + 1.2)); // ajout de chaleur
                        // 2) On dessine un tir laser depuis la caméra jusqu'au centre du soleil
                        const worldPos = new THREE.Vector3();
                        e.object.getWorldPosition(worldPos);
                        onLaserHit(worldPos);
                    }}
                >
                    <sphereGeometry args={[SUN_BASE_RADIUS, 64, 64]} />
                    <meshStandardMaterial map={map} color={color} emissive={color} emissiveIntensity={0} />
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
    const [laserTarget, setLaserTarget] = useState<string | null>(null);
    const [shots, setShots] = useState<{ id: number; to: THREE.Vector3; startedAt: number; duration: number }[]>([]);//Liste des tirs laser à afficher

    // Références des planètes (remplies par onRegister)
    const planetRefs = useRef<Record<string, THREE.Group>>({});

    // Rayons des planètes (pour collision)
    const planetRadii = useRef<Record<string, number>>({});

    // Planètes en explosion
    const [explodingPlanets, setExplodingPlanets] = useState<Record<string, boolean>>({});

    // utilitaire pour marquer une planète en explosion
    const triggerPlanetExplosion = (name: string) => {
        setExplodingPlanets((prev) => {
            if (prev[name]) return prev; // déjà en explosion
            return { ...prev, [name]: true };
        });
    };

    //Fonction d'enregistrement 
    const handleRegisterPlanet = (name: string, ref: THREE.Group, radius: number) => {
        planetRefs.current[name] = ref;
        planetRadii.current[name] = radius;
    };

    // Construire la liste des planètes à surveiller par le Soleil
    const planetsToCheck = [
        // Ajoute ici celles construites avec OrbitingPlanet:
        { name: 'mercury', ref: planetRefs.current['mercury'], radius: planetRadii.current['mercury'] ?? 0 },
        { name: 'venus', ref: planetRefs.current['venus'], radius: planetRadii.current['venus'] ?? 0 },
        { name: 'earth', ref: planetRefs.current['earth'], radius: planetRadii.current['earth'] ?? 0 },
        { name: 'mars', ref: planetRefs.current['mars'], radius: planetRadii.current['mars'] ?? 0 },
        { name: 'jupiter', ref: planetRefs.current['jupiter'], radius: planetRadii.current['jupiter'] ?? 0 },
        { name: 'neptune', ref: planetRefs.current['neptune'], radius: planetRadii.current['neptune'] ?? 0 },
        // NOTE : Pour Saturn/Uranus (composants spéciaux), on le fera après si tu veux, en ajoutant onRegister aussi
    ].filter(p => !!p.ref); // on filtre celles déjà enregistrées


    //Ajouter un tir
    const fireLaser = (to: THREE.Vector3, duration = 0.6) => {
        setShots((prev) => [
            ...prev,
            {
                id: Math.random(),
                to: to.clone(),
                startedAt: performance.now() / 1000, duration
            }
        ]);
    };

    //Retirer un tir (quand utilisateur a fini)
    const removeShot = (id: number) => {
        setShots((prev) => prev.filter((s) => s.id !== id));
    };

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
                    activeTool={selectedTool} // on transmet l'état courant 
                    onSelectTool={(tool) => {
                        setSelectedTool(tool);
                        if (tool === 'laser') {
                            setLaserTarget(null); //On remet à zéro la cible
                        }
                    }}
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
                        setLaserTarget(null); //Rset le larserTarget aussi
                        setShots([]); //On retire tous les tirs en cours
                        setExplodingPlanets({}); //Tout redevient intact
                        planetRefs.current = {};
                        planetRadii.current = {};
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
                        isLaserArmed={selectedTool === 'laser'}
                        onLaserHit={(to) => fireLaser(to)} //Dessine le rayon vers le soleil
                        planetsToCheck={planetsToCheck}
                        onPlanetTouched={(name) => triggerPlanetExplosion(name)}
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
                            targetPosition={alignPlanets ? new THREE.Vector3(44, 0, 0) : null} //Positionnement des planettes 
                        />
                    ) : (
                        <>
                            <OrbitCircle radius={45.51} color="white" />
                            <OrbitingPlanet
                                name="mercury"
                                texture="mercury.jpg"
                                radius={0.9}
                                orbitRadius={45.51}
                                orbitSpeed={2.5}
                                onRegister={handleRegisterPlanet}
                                onClick={(ref) => {
                                    setFollowedPlanet(ref);
                                    setSelectedPlanetName("mercury");
                                }}
                                sunPosition={new THREE.Vector3(0, 0, 0)} // ou position réelle du Soleil
                                speedFactor={orbitSpeedFactor}
                                isExploding={!!explodingPlanets['mercury']}

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
                            targetPosition={alignPlanets ? new THREE.Vector3(55, 0, 0) : null} //Positionnement des planettes 
                        />

                    ) : (
                        <>
                            <OrbitCircle radius={55.60} color="lightyellow" />
                            <OrbitingPlanet
                                texture="venus_surface.jpg"
                                radius={1.9}
                                orbitRadius={55.60}
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
                            radius={2.5}
                            orbitRadius={36.05}
                            orbitSpeed={0}
                            //position={[-50, 0, 0]}
                            onClick={(ref) => {
                                setFollowedPlanet(ref);
                                setSelectedPlanetName("earth")
                            }}
                            speedFactor={0}
                            targetPosition={alignPlanets ? new THREE.Vector3(65, 0, 0) : null} //Positionnement des planettes 
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
                                    <sphereGeometry args={[2.5 + 0.01, 64, 64]} />
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
                            <OrbitCircle radius={68.05} color="lightblue" />
                            <OrbitingPlanet
                                texture="earth_daymap.jpg"
                                radius={2}
                                orbitRadius={68.05}
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
                            targetPosition={alignPlanets ? new THREE.Vector3(75, 0, 0) : null} //Positionnement des planettes 
                        />
                    ) : (
                        <>
                            <OrbitCircle radius={78.40} color="lightorange" />
                            <OrbitingPlanet
                                texture="mars.jpg"
                                radius={1.6}
                                orbitRadius={78.40}
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
                            targetPosition={alignPlanets ? new THREE.Vector3(102, 0, 0) : null} //Positionnement des planettes 
                        />
                    ) : (
                        <>
                            <OrbitCircle radius={100.65} color="lightgreen" />
                            <OrbitingPlanet
                                texture="jupiter.jpg"
                                radius={10.94}
                                orbitRadius={100.65}
                                orbitSpeed={0.051}
                                onClick={(ref) => {
                                    setFollowedPlanet(ref);           // on stocke le ref pour que la caméra suive
                                    setSelectedPlanetName("jupiter");   // on stocke le nom pour afficher la description
                                    if (selectedTool === 'laser') {
                                        setLaserTarget('jupiter');
                                        setTimeout(() => setLaserTarget(null), 4000); //(optionnel) reset automatique
                                    }
                                }}
                                speedFactor={orbitSpeedFactor}
                                isExploding={selectedTool === "laser" && laserTarget === "jupiter"}
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
                            targetPosition={alignPlanets ? new THREE.Vector3(135, 0, 0) : null} //Positionnement des planettes 
                        />
                    ) : (
                        <>
                            <OrbitCircle radius={140.45} color="wheat" />
                            <SaturnWithRings
                                texture="saturn.jpg"
                                ringTexture="saturn_ring_alpha.png"
                                radius={7.8}
                                orbitRadius={140.45}
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
                            targetPosition={alignPlanets ? new THREE.Vector3(160, 0, 0) : null} //Positionnement des planettes 
                        />
                    ) : (
                        <>
                            <OrbitCircle radius={175} color="lightpink" />
                            <UranusWithRings
                                texture="uranus.jpg"
                                ringTexture="saturn_ring_alpha.png"
                                radius={3.8}
                                orbitRadius={175}
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
                            targetPosition={alignPlanets ? new THREE.Vector3(175, 0, 0) : null} //Positionnement des planettes 
                        />
                    ) : (
                        <>
                            <OrbitCircle radius={200.35} color="lightblue" />
                            <OrbitingPlanet
                                texture="neptune.jpg"
                                radius={8.74}
                                orbitRadius={200.35}
                                orbitSpeed={0.015}
                                onClick={(ref) => {
                                    setFollowedPlanet(ref);           // on stocke le ref pour que la caméra suive
                                    setSelectedPlanetName("neptune");   // on stocke le nom pour afficher la description
                                }}
                                speedFactor={orbitSpeedFactor}
                            />
                        </>
                    )}

                    {/* Rendu des tirs laser */}
                    {shots.map((s) => (
                        <LaserBeam
                            key={s.id}
                            to={s.to}
                            startedAt={s.startedAt}
                            duration={s.duration}
                            onEnd={() => removeShot(s.id)}
                        />
                    ))}

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
