# Pro-Lifts Fitness PWA 

A premium, offline-first progressive web app for elite-level workout tracking. Built for users who demand high performance, data ownership, and science-based progression.

## Key Features

- **Pro-Athlete Aesthetic:** Sleek dark mode with "Racing Red" glassmorphic UI.
- **Offline-First:** Track your workouts with zero internet. Powered by **Dexie.js** (IndexedDB).
- **Cloud Sync:** Securely sync your data across devices using **Supabase**.
- **Dual Profile System:** Seamlessly toggle between independent user profiles.
- **Science-Based Progression:** Automated weight suggestions based on the "2-Week Consistency" rule.
- **Interactive Anatomy:** High-fidelity SVG muscle highlighting for every exercise.
- **Exercise Library:** 800+ professional exercises with tutorial videos and form cues.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS + Vanilla CSS (Glassmorphism)
- **Database:** Dexie.js (Local) & Supabase (Sync)
- **PWA:** Vite PWA Plugin
- **Deployment:** Vercel

## 🏃 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or bun

### Local Development
```bash
# 1. Clone the repo
# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

### Running Tests
```bash
# Run the automated test suite
npm run test

# Run tests in watch mode
npm run test:watch
```

## Documentation
- [Product Requirements Document (PRD v2.1)](./PRD.md)
- [Frontend UI/UX Specification](./lovable_frontend_spec.md)

## 🐳 Self-Hosting (Optional Sync)
Detailed setup instructions for Docker-based CouchDB synchronization will be available in Phase 2 of the roadmap.

## Acknowledgments

- **Exercise Data:** Massive thanks to [Exercemus](https://github.com/exercemus/exercises) for their open-source exercise library.
- **Anatomy Diagrams:** Anatomical SVG path data adapted from [react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter).
