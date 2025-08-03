# 🌌 Solar System 3D – Simulation Interactive

Une simulation 3D réaliste et interactive du système solaire réalisée avec React, Three.js et React Three Fiber. Vous pouvez observer les planètes en orbite autour du Soleil, zoomer, pivoter la scène, et interagir avec les planètes pour en savoir plus !

## 💫 Fonctionnalités principales

- ☀️ Soleil réaliste avec effets de flammes (solar flare)
- 🪐 Planètes en orbite avec textures et vitesses réalistes
- 🌑 Lune en orbite autour de la Terre
- 🌀 Anneaux pour Saturne et Uranus
- 🚑 Orbites visibles autour du Soleil
- 📷 Caméra interactive :
  - Cliquez sur une planète pour la suivre de près
  - Bouton Stop pour arrêter le suivi
- 📚 Panneau d'information animé :
  - Cliquez sur "En savoir plus" pour afficher des détails sur la planète (masse, taille, température, etc.)
- ⏩ Contrôle de vitesse :
  - Slider pour accélérer ou ralentir le mouvement orbital des planètes
- 🌠 Arrière-plan d’étoiles animées pour une immersion totale

## 📸 Démo

(Déploie sur Vercel, Netlify ou autre pour ajouter un lien ici si disponible)

## 🚀 Installation et exécution du projet localement

Étapes pour lancer l'application sur ta machine :

### 1. Cloner ce dépôt

```bash
git clone https://github.com/ton-utilisateur/solar-system-3d.git
cd solar-system-3d
```

### 2. Installer les dépendances

Assure-toi d’avoir Node.js (v18+ recommandé) installé. Puis :

```bash
npm install
```

Ou avec Yarn :

```bash
yarn install
```

### 3. Lancer le serveur de développement

```bash
npm run dev
```

Puis ouvre ton navigateur à l’adresse :

```
http://localhost:5173
```

## ⚙️ Stack technique

- React + Vite
- Three.js avec React Three Fiber
- Drei (helpers 3D)
- TypeScript
- HTML/CSS

## 🖼️ Structure du projet

Voici une vue simplifiée de la structure des fichiers :

```
.
├── public/
│   └── textures/         # Textures des planètes et du Soleil
├── src/
│   ├── components/
│   │   ├── SolarSystem.tsx
│   │   ├── OrbitingPlanet.tsx
│   │   ├── Moon.tsx
│   │   ├── SaturnWithRings.tsx
│   │   ├── UranusWithRings.tsx
│   │   ├── OrbitCircle.tsx
│   │   ├── PlanetInfoPanel.tsx
│   ├── data/
│   │   └── planetData.ts       # Données des planètes
│   └── App.tsx
└── vite.config.ts
```

## 🌍 Remarques

- L’ensemble des textures doivent être placées dans `/public/textures` avec les bons noms (ex. : `earth_daymap.jpg`, `saturn_ring_alpha.png`, etc.).
- Ce projet ne nécessite aucune clé API.

## 💡 Idées futures

- Ajout d’une timeline historique pour montrer la position des planètes à différentes dates
- Sonorisation dynamique
- Intégration avec l’API de la NASA pour les dernières données en temps réel

## 📄 Licence

Ce projet est open-source. Tu peux le modifier ou le réutiliser à ta convenance. Attribution appréciée.

