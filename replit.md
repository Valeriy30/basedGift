# basedGift

## Overview

basedGift is a web application for sending digital gifts (USDC and NFTs) on the Base blockchain network. Users can create personalized, visually-themed gift links that recipients can claim directly to their wallets. The app focuses on emotional gifting experiences with animated cards, customizable themes, and gasless claiming for recipients.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, Zustand for local wallet state
- **Styling**: Tailwind CSS with CSS variables for theming, shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and gift animations, canvas-confetti for celebration effects
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation schemas
- **Development Mode**: Vite dev server middleware with HMR support
- **Production Mode**: Static file serving from built `dist/public` directory

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains the database schema
- **Migrations**: Drizzle Kit manages migrations in `./migrations` directory
- **Connection**: Uses `DATABASE_URL` environment variable for PostgreSQL connection

### Key Data Model
The `gifts` table stores:
- Gift metadata (id, sender/receiver addresses, token info)
- Visual customization (theme, visual assets as JSONB)
- Transaction tracking (escrow and claim transaction hashes)
- Status workflow (created → claimed)

### API Structure
Three main gift endpoints:
- `POST /api/gifts` - Create a new gift
- `GET /api/gifts/:id` - Retrieve gift details
- `PATCH /api/gifts/:id/claim` - Mark gift as claimed with receiver info

### Build System
- Custom build script using esbuild for server bundling and Vite for client
- Server dependencies are bundled to reduce cold start times
- Output: `dist/index.cjs` (server) and `dist/public/` (client assets)

## External Dependencies

### Database
- PostgreSQL database (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database operations
- connect-pg-simple for session storage capability

### Blockchain (Simulated)
- Currently uses mock wallet connections (no real blockchain provider)
- Designed for Base network (Coinbase L2)
- Supports USDC, NFT, and ETH token types

### UI Framework
- Radix UI primitives for accessible components
- Lucide React for icons
- Google Fonts (Fredoka, Nunito, Patrick Hand)

### Development Tools
- Replit-specific Vite plugins for dev experience (cartographer, dev-banner, runtime-error-modal)
- TypeScript with strict mode enabled