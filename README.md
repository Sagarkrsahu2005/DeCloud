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

"Decentralized Cloud Storage with Blockchain" (DeCloud) is a secure file sharing application built with Next.js that demonstrates a zero-knowledge-inspired access model. Files are encrypted in the browser before storage, keys remain client-side, and access links can self-destruct after limited views or time.

This repository contains the frontend and client-side logic for the university project deliverable. The architecture emphasizes privacy, wallet-oriented identity, and share-by-link controls without server-side key exposure.

## Key Features

- Upload and browse files using a responsive UI
- Client-side AES-GCM encryption before file persistence
- Client-side key management (keys never sent to server)
- Share files via secure links and wallet-based sharing
- Self-destructing access links (expiry + max view count)
- File metadata and integrity hash generation for verification flow
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

The current implementation does not require mandatory environment variables for core encrypted upload and sharing flows.

If optional services are added later (analytics, external decentralized storage gateway, blockchain RPC), create a `.env.local` and configure integration keys.

Common variables you might add (example names — confirm in code before using):

- NEXT_PUBLIC_BLOCKCHAIN_RPC=
- NEXT_PUBLIC_ANALYTICS_ID=
- STORAGE_API_KEY=

## How it works (concise, professor-oriented)

- The UI is implemented with Next.js pages and server/client components under `app/`.
- File upload/list/share actions are implemented in `components/decloud/*` and orchestrated by `app/page.tsx`.
- Core logic in `lib/decloud-logic.ts` encrypts each file client-side using AES-GCM and stores only ciphertext + IV.
- File encryption keys are generated in-browser and stored client-side per wallet context.
- Download flow decrypts only on the client side using local key material.
- Self-destruct links are generated with expiry and max-view limits; on access, the link state is decremented and invalidated when exhausted.
- Integrity hash values are generated from encrypted payload metadata to support tamper-evidence and blockchain-ready verification patterns.

## Security Model

- **No server-level key access**: encryption keys are never transmitted to backend APIs in this project flow.
- **Client-side key management**: keys are generated and retained in browser storage for the active wallet context.
- **Encrypted-at-rest in app storage**: stored records contain encrypted payloads, not plain file bytes.
- **Fragment-key links**: link key material is placed in URL fragment (`#k=...`), which is not sent in HTTP requests.
- **Self-destruct policy**: links can expire by time and by access count.

Note: this is a practical zero-knowledge privacy design for a client app, not a formal zero-knowledge proof (ZKP) protocol.

## Hurdles Faced in the New Update (And How We Solved Them)

1. Crypto worked in idea, but TypeScript blocked Web Crypto inputs
- **Problem in simple words**: We generated encryption keys in the browser, but TypeScript gave strict type errors when passing those keys to Web Crypto.
- **How we solved it**: We added a clean conversion step to pass exact `ArrayBuffer` values into `crypto.subtle.importKey`. After that, encryption/decryption worked without type errors.

2. React 19 ref typing caused compile errors
- **Problem in simple words**: The service reference pattern we used earlier was valid before, but React 19 expects an explicit initial value.
- **How we solved it**: We initialized the service ref with `null` and created the service safely on first use. This removed the compile issue.

3. Download flow became async after adding encryption
- **Problem in simple words**: Earlier, files were downloaded directly. After encryption, we first needed to decrypt in memory, which made the flow asynchronous.
- **How we solved it**: We updated the download handler to await decryption, then trigger file download. User experience stayed the same, but security improved.

4. Self-destruct links needed secure key sharing without server access
- **Problem in simple words**: We wanted links that expire, but also wanted the server to never see decryption keys.
- **How we solved it**: We put the key in URL fragment (`#k=...`) and only stored link policy (expiry/views) in local app state. Fragments are not sent to servers in normal HTTP requests.

5. Link lifecycle edge cases (expired, reused, invalid token)
- **Problem in simple words**: People may open an old link, refresh multiple times, or use a broken URL.
- **How we solved it**: We added strict validation for token existence, expiry time, and remaining views. If limit is reached, link is invalidated immediately.

6. Backward compatibility with old uploaded files
- **Problem in simple words**: Some previously uploaded files were stored in old plain format, and we did not want them to break.
- **How we solved it**: We kept fallback handling for old records while using encrypted format for all new uploads.

7. Tooling mismatch during validation
- **Problem in simple words**: Lint command failed because ESLint binary was not available in this environment.
- **How we solved it**: We validated the update using TypeScript compile check (`pnpm exec tsc --noEmit`) and confirmed the code is type-safe.

### Result After Resolving These Hurdles

- Client-side encryption is active for new uploads.
- Keys remain client-side and are not exposed to server APIs.
- Self-destruct links now support both time expiry and view limits.
- The updated flow compiles cleanly and is ready for demo/presentation.

## Running & Demonstration Tips for Assessment

- Start the dev server and walk through these flows in the browser:
  1. Connect a wallet in the UI.
  2. Upload a sample file and explain that encryption happens client-side.
  3. Open Share modal, set expiry and max views, then generate secure link.
  4. Open the generated link to trigger decryption and controlled download.
  5. Re-open same link to show self-destruct behavior after view limit.
  6. Show file hash metadata for integrity/tamper-evidence discussion.

## Known Limitations & Future Work

- This is currently browser-storage based. For production:
  - Move encrypted payloads to decentralized storage (IPFS/Filecoin/Web3.Storage).
  - Replace local key sharing with recipient public-key encryption (ECIES/X25519 pattern).
  - Add signed link metadata and replay protection.
  - Add unit/integration tests for cryptographic and link-expiry logic.
  - Add audit logging and incident-safe key rotation policies.

## Contributing

This repository is the university project deliverable. For further development:

- Fork the repo, create feature branches, and open PRs.
- Keep UI primitives in `ui/` for reuse.

## Contact & Credits

For questions related to this project or the demo, please contact the team members listed at the top.

Project prepared by the Section-14 team for Galgotias University.

------

## License

This project is licensed under the MIT License — see the `LICENSE` file in the repository root for details.
