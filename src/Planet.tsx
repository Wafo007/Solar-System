import { Vector3 } from "three";

type PlanetProps = {
   name : string;
   position : [number, number, number];
   color : string;
   size : number;
   onClick : (name: string) => void; 
};

export default function Planet({ name, position, color, size, onClick} : PlanetProps) {
    return (
        <mesh position={position as Vector3} onClick={() => onClick(name)} castShadow receiveShadow>
            <sphereGeometry args={[size, 32, 32]}/>
            <meshStandardMaterial color={color}/>
        </mesh>
    );
}