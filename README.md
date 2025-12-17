# Pong Extreme

A mobile-first multiplayer Pong game built with SvelteKit and PartyKit.

## Features

- **Real-time multiplayer** - Battle opponents in fast-paced Pong matches
- **Mobile-optimized** - Touch controls designed for phone gameplay
- **Quick matchmaking** - Create a username and find opponents instantly
- **Server-authoritative** - Fair gameplay with server-side physics
- **PWA Support** - Installable on mobile devices

## Tech Stack

- **Frontend**: SvelteKit 2, Svelte 5, TypeScript
- **Backend**: PartyKit (WebSocket server on Cloudflare's edge)
- **Hosting**: Vercel (frontend), PartyKit (backend)
- **Testing**: Vitest with 410+ tests

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Start PartyKit server** (in one terminal)
   ```bash
   npm run dev:party
   ```

4. **Start SvelteKit dev server** (in another terminal)
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 on two browser windows or devices to test multiplayer

### Running Tests

```bash
npm run test        # Watch mode
npm run test:run    # Single run
```

## Deployment

### Deploy PartyKit Backend

1. **Login to PartyKit**
   ```bash
   npx partykit login
   ```

2. **Deploy**
   ```bash
   npm run deploy:party
   ```

3. Note your deployment URL (e.g., `pong-extreme.your-username.partykit.dev`)

### Deploy Frontend to Vercel

1. **Push to GitHub** (Vercel auto-deploys from GitHub)

2. **Set environment variable** in Vercel dashboard:
   - `VITE_PARTY_HOST` = your PartyKit URL (e.g., `pong-extreme.username.partykit.dev`)

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_PARTY_HOST` | PartyKit server URL | `pong-extreme.username.partykit.dev` |

## Game Rules

- First to **7 points** wins
- **3-second countdown** before each game starts
- Ball **speeds up** on each paddle hit (up to max speed)
- If opponent **disconnects**, you win by default

## How to Play

1. Enter a unique username
2. Tap "Find Match" to join the queue
3. Once matched, the game starts after a countdown
4. **Drag left/right** on the screen to move your paddle
5. Defend your side and hit the ball past your opponent
6. First to 7 points wins!

## Project Structure

```
pong-extreme/
├── src/
│   ├── lib/
│   │   ├── game/           # Game logic (physics, types, constants)
│   │   ├── party/          # PartyKit client/server logic
│   │   ├── scenes/         # UI scenes (Title, Game, etc.)
│   │   ├── stores/         # Svelte stores
│   │   ├── components/     # Reusable UI components
│   │   └── engine/         # Game engine utilities
│   └── routes/             # SvelteKit routes
├── party/                  # PartyKit server files
│   ├── matchmaker.ts       # Matchmaking server
│   └── game.ts             # Game room server
├── tests/                  # Test files (410+ tests)
└── static/                 # Static assets
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start SvelteKit dev server |
| `npm run dev:party` | Start PartyKit dev server |
| `npm run dev:all` | Start both servers concurrently |
| `npm run build` | Build for production |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run deploy:party` | Deploy PartyKit to production |
| `npm run check` | TypeScript type checking |

## Architecture

### Multiplayer Flow

1. **Matchmaking**: Players connect to a global matchmaker room
2. **Queue**: Players wait in queue with unique usernames
3. **Match**: Two players are paired and assigned a game room
4. **Gameplay**: Server runs physics at 60fps, broadcasts state to clients
5. **Game Over**: Results shown, players can rematch or return to menu

### Server-Authoritative Design

- Server validates all paddle movements
- Server calculates ball physics and collisions
- Clients receive and render authoritative state
- Prevents cheating, ensures fair gameplay

## Credits

Built with the [SvelteGame Engine template](https://github.com/PxPerfectMike/sveltegame) and [PartyKit](https://partykit.io).

## License

MIT
