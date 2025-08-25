# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting
- `npm run test` - Run tests (compiles TypeScript first, then runs Node.js tests)

### Test Commands
- `npm run test:build` - Compile TypeScript test files to `dist_test/` directory
- `npm run test` - Full test suite (build + run tests)
- Run single test: `node --test dist_test/tests/[filename].test.js` (after test:build)
- Test configuration: `tsconfig.test.json` compiles to CommonJS for Node.js testing

## Project Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL with realtime subscriptions)
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4 with PostCSS
- **Animations**: Framer Motion
- **Data Fetching**: TanStack Query (React Query v5)
- **Icons**: Heroicons, React Icons
- **Excel Export**: xlsx library

### Core Application Structure

This is a **multi-screen roulette game system** with three main interfaces:

1. **Admin Panel** (`/admin`) - Game management and session control
2. **Tablet Interface** (`/game/[sessionId]`) - Player interaction with roulette wheel
3. **TV Display** (`/tv`) - Real-time game visualization for audience

### Key Components Architecture

#### State Management (Zustand Stores)
- `src/store/gameStore.ts` - Main game state, participants, questions, admin operations
- `src/store/sessionStore.ts` - Authentication and session management
- `src/store/navigationStore.ts` - Navigation and UI state

#### Database Schema (Supabase)
- `participants` - Player registration and status (indexed on session_id, status, created_at)
- `game_sessions` (PlaySession) - Individual game sessions (indexed on status, admin_id)
- `plays` - Game plays and results
- **Setup Scripts**: `scripts/setup-production-db.sql` (indexes & RLS policies)
- **Test Data**: `scripts/generate-test-participants.sql`

#### Realtime System
- TV screen uses **dual realtime subscriptions** to prevent race conditions:
  - `game_sessions` table for session updates
  - `participants` table for immediate participant detection
- Optimized logging system with different levels for development vs production

#### API Routes Structure
- `src/app/api/admin/` - Admin management endpoints
  - `sessions/` - Session CRUD operations (create, list, active, close, finish)
  - `sessions/queue/` - Queue management for participants
  - `sessions/register-player/` - Admin-initiated player registration
- `src/app/api/participants/` - Player registration and stats
- `src/app/api/plays/` - Game play submission
- `src/app/api/questions/` - Question management
- `src/app/api/export-participants/` - Excel export functionality

### Critical Implementation Details

#### Supabase Client Configuration
- **Client-side**: `supabaseClient` (anonymous access)
- **Server-side**: `supabaseAdmin` (service role, API routes only)
- Singleton pattern to prevent multiple instances
- SSR protection for client initialization

#### Game Flow
1. Admin creates session via `/admin`
2. Players register via `/register/[sessionId]`
3. Game plays on `/game/[sessionId]` with roulette wheel
4. TV displays live updates via `/tv`

#### TV Optimization
- Implements intelligent retry logic with exponential backoff
- Dual realtime subscriptions eliminate race conditions
- Smart logging system (`tvLogger` for dev, `tvProdLogger` for production)
- Performance monitoring with sub-200ms response times

### Common Patterns

#### Error Handling
- Use `tvLogger` for development debugging
- Use `tvProdLogger` for production-critical errors only
- Consistent error interfaces with `SupabaseError`

#### Component Organization
- `components/admin/` - Admin panel components
- `components/game/` - Game interaction components
- `components/tv/` - TV display components
- `components/ui/` - Reusable UI components

#### Data Flow
- Zustand stores manage global state
- API routes handle database operations
- Realtime subscriptions provide live updates
- TypeScript interfaces in `src/types/index.ts` define all data structures

### Performance Considerations

#### Production Optimizations
- Logging level set to 'error' in production
- Realtime subscriptions optimized for high concurrency
- Database indexes on `session_id` and `status` fields
- Minimal polling, maximum realtime event usage

#### Development Features
- Comprehensive debug logging
- Hot reload with Next.js dev server
- TypeScript strict mode enabled
- Path aliases configured (`@/*` maps to `src/*`)

## Important Notes

- This is a **Spanish-language application** for DarSalud events
- Uses Progressive Web App (PWA) configuration for tablet use
- Implements Row Level Security (RLS) on Supabase tables
- TV display optimized for large screens and audience viewing
- Game supports both individual and session-based play modes
- Questions loaded from `src/data/questions.json` with medical specialties
- Queue system manages participant flow with "waiting", "playing", "completed" states

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NODE_ENV=production
NEXT_PUBLIC_ENABLE_TV_DEBUG=false
NEXT_PUBLIC_TV_LOG_LEVEL=error
```