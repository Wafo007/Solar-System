// PlanetData.ts
export type PlanetInfo = {
    name: string;
    diameter: string;
    mass: string;
    temperature: string;
    moons: number;
    funFact: string;
    wikiLink: string;
  };
  
  const PlanetData: Record<string, PlanetInfo> = {
    mercury: {
      name: "Mercury",
      diameter: "4,879 km",
      mass: "3.30 × 10^23 kg",
      temperature: "-173 to 427 °C",
      moons: 0,
      funFact: "Mercury has the shortest orbit around the Sun.",
      wikiLink: "https://en.wikipedia.org/wiki/Mercury_(planet)",
    },
    venus: {
      name: "Venus",
      diameter: "12,104 km",
      mass: "4.87 × 10^24 kg",
      temperature: "462 °C",
      moons: 0,
      funFact: "Venus rotates backwards compared to most planets.",
      wikiLink: "https://en.wikipedia.org/wiki/Venus",
    },
    earth: {
      name: "Earth",
      diameter: "12,742 km",
      mass: "5.97 × 10^24 kg",
      temperature: "-88 to 58 °C",
      moons: 1,
      funFact: "Earth is the only planet known to support life.",
      wikiLink: "https://en.wikipedia.org/wiki/Earth",
    },
    // Ajoute d'autres planètes comme Mars, Jupiter, etc.
  };
  
  export default PlanetData;
  