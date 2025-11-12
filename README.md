# Decentralized Cloud Storage with Blockchain

University Project — Galgotias University

Section-14 | BCA-AIML

Project Code: GUSCSE2025347

Supervisor: Mr. Rupesh Kumar Dubey

Team Members
- Section-14-23SCSE1430070 — Mohammad Arshad Alam
  - Email: arshadaalam481@gmail.com
- Section-14-23SCSE1430071 — Sagar Kumar Sahu
  - Email: sagarcoding2005@gmail.com
- Section-14-23SCSE1430049 — Satyam Yadav
  - Email: satyam.04062004@gmail.com
  

Version: 0.1.0

------

## Project Overview

"Decentralized Cloud Storage with Blockchain" (a.k.a. Decloud) is a web application built with Next.js that demonstrates a decentralized approach to file storage and sharing augmented with blockchain-based integrity and verification features. The goal of the project is to explore how decentralized storage can be combined with blockchain primitives to provide provable ownership, tamper-evidence, and secure sharing for user files.

This repository contains the frontend and application logic used for the university project deliverable. It is implemented as a modern React/Next.js app with an emphasis on modular UI components, a clear separation of concerns, and simple integration points for decentralized storage and blockchain services.

## Key Features

- Upload and browse files using a responsive UI
- Share files via secure links / modal interfaces
- File metadata and integrity tied to a blockchain layer (concept & wiring in code)
- Lightweight wallet / modal UI for blockchain interactions
- Responsive UI built with Tailwind CSS and Radix UI primitives

## Tech Stack

- Next.js 16 (React 19)
- React
- Tailwind CSS
- pnpm (lockfile provided)
- TypeScript
- Various UI libraries: Radix UI, lucide-react, sonner (toasts)

## Project Structure (high level)

- `app/` — Next.js app routes and pages
- `components/` — Application-specific components (decloud folder contains core features)
- `ui/` — Reusable UI primitives and design system components
- `lib/` — Application logic and helpers (e.g., `decloud-logic.ts`)
- `public/` — Static assets
- `styles/` — Global styles and Tailwind config

## Prerequisites

- Node.js (recommended: 18.x or 20.x LTS)
- pnpm (recommended; repo contains `pnpm-lock.yaml`) or npm/yarn as alternatives

If you use nvm, an example to install and use Node 20:

```bash
nvm install 20
nvm use 20
```

Install pnpm (if not installed):

```bash
# using npm
npm install -g pnpm
```

Or via Corepack (macOS/Linux):

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## Getting Started — Run the app locally

Open a terminal in the project root (where this `README.md` and `package.json` live) and run:

1. Install dependencies

```bash
pnpm install
```

2. Run development server

```bash
pnpm dev
```

The app will start on http://localhost:3000 by default. If the port is in use you can specify another port like:

```bash
PORT=4000 pnpm dev
```

3. Build and run production

```bash
pnpm build
pnpm start
```

Run production on a different port:

```bash
PORT=4000 pnpm start
```

4. Linting

```bash
pnpm lint
```

Notes:
- This repository includes a `pnpm-lock.yaml` so `pnpm` is the recommended package manager. If you prefer `npm` or `yarn`, you may use them, but behavior could differ slightly.

## Environment Variables

I scanned the codebase for direct `process.env` usage and didn't find mandatory runtime environment variables. However, optional integrations (analytics, external storage providers, blockchain RPC endpoints, or custody services) may require environment variables. If you encounter runtime errors about missing keys, create a `.env.local` in the project root with the appropriate values.

Common variables you might add (example names — confirm in code before using):

- NEXT_PUBLIC_BLOCKCHAIN_RPC=
- NEXT_PUBLIC_ANALYTICS_ID=
- STORAGE_API_KEY=

## How it works (concise, professor-oriented)

- The UI is implemented with Next.js pages and server/client components under `app/`.
- File upload and listing UI is implemented in `components/decloud/*`, which interacts with helper functions in `lib/decloud-logic.ts`.
- Blockchain-related interactions are exposed via wallet modal components and helper methods; hashes or transaction records can be created to prove file integrity and ownership.
- The project is primarily a proof-of-concept: it demonstrates UI flows and the integration points necessary for a decentralized storage + blockchain verification system. The architecture separates UI, client logic, and any external service integrations so the code can be extended to plug in a real decentralized storage backend (IPFS/Filestorage) and a blockchain provider.

## Running & Demonstration Tips for Assessment

- Start the dev server and walk through these flows in the browser:
  1. Upload a sample file using the Upload card.
  2. Open the file grid and inspect metadata.
  3. Use the Share modal to generate a share preview.
  4. Open the Wallet modal to demonstrate signing or verification flows (if connected).
- If a network or RPC is required and not configured, explain this is a configurable integration and show where to add the RPC in `lib/decloud-logic.ts` or environment variables.

## Known Limitations & Future Work

- Proof-of-concept: storage backend and blockchain integrations may be stubbed or minimal. To make this production-ready:
  - Integrate a decentralized storage provider (IPFS, Web3.Storage, or similar).
  - Add a backend signing service or client-side wallet integration for on-chain transactions.
  - Add unit and integration tests for critical flows.

## Contributing

This repository is the university project deliverable. For further development:

- Fork the repo, create feature branches, and open PRs.
- Keep UI primitives in `ui/` for reuse.

## Contact & Credits

For questions related to this project or the demo, please contact the team members listed at the top.

Project prepared by the Section-14 team for Galgotias University.

------

License: MIT (add a LICENSE file if desired)
# DeCloud
