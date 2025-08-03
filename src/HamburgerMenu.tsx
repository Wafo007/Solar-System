import { useState } from 'react';
import './HamburgerMenu.css';

const planets = [
  'Mercury',
  'Venus',
  'Earth',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune'
];

type Props = {
  onSelectPlanet: (planetName: string) => void;
};

export default function HamburgerMenu({ onSelectPlanet }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Bouton hamburger */}
      <button className="hamburger-button" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>
      {/* Menu latéral */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`} style={{ paddingTop: '100px'}}>
        <h2>Planètes</h2>
        <ul className="planet-list">
          {planets.map((name) => (
            <li
              key={name}
              onClick={() => {
                onSelectPlanet(name);
                setIsOpen(false);
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}