# AGENTS.md

This file provides guidance for AI agents working on this fitness tracker PWA codebase.

## Build Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run test         # Run all tests once (Vitest)
npm run test:watch   # Run tests in watch mode
npm run preview      # Preview production build
```

## Running Single Tests

To run a specific test file:
```bash
npx vitest run src/test/Library.test.tsx
```

To run tests matching a pattern:
```bash
npx vitest run --grep "Library"
```

## Project Overview

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS with custom glassmorphism theme (dark mode only)
- **Database:** Dexie (IndexedDB wrapper) for local storage
- **Auth:** Supabase for authentication and cloud sync
- **State:** React Context for user state, TanStack Query for data fetching
- **UI:** shadcn/ui components built on Radix UI primitives
- **Testing:** Vitest + React Testing Library with jsdom environment
- **Icons:** Lucide React

## Import Conventions

- Use `@/` alias for imports from src directory
- Absolute imports preferred over relative where possible
```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { db, Exercise } from '@/lib/db';
import { useUser } from '@/context/UserContext';
```

## Code Style Guidelines

### TypeScript Configuration
- Strict mode is **disabled** (`noImplicitAny: false`, `strictNullChecks: false`)
- Type inference preferred where types are obvious
- Use interfaces for object shapes, types for unions/aliases

### Naming Conventions
- **Components:** PascalCase (e.g., `ExerciseWizard`, `BottomNav`)
- **Functions:** camelCase (e.g., `useUser`, `refreshUsers`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `SPLITS`, `MUSCLE_GROUPS`)
- **Types/Interfaces:** PascalCase with descriptive names
- **Database tables:** lowercase plural (e.g., `users`, `exercises`, `workouts`)

### Component Patterns
- Use function components with hooks exclusively
- Prefer `cn()` utility for conditional Tailwind classes
- Use shadcn/ui Button with variant/size props
- Glass morphism: `glass`, `gradient-red`, `gradient-radial` classes
- Loading states: Show spinner/skeleton, avoid blank screens
- Mobile-first: `min-h-[100dvh]` for full height on mobile

### State Management
- **Local component state:** `useState` for UI state
- **Global state:** React Context for user authentication
- **Server state:** TanStack Query for Supabase data
- **Database state:** Direct Dexie queries (no wrapper needed)

### Error Handling
- Always wrap async operations in try-catch
- Use toast notifications (sonner) for user-facing errors
- Console.error for debugging, but don't expose to users
- Validate user input with Zod schemas before API calls

### Database Patterns (Dexie)
```typescript
// Query with filtering
await db.exercises.where('inLibrary').equals(true).toArray()

// Add new record
const id = await db.users.add(profile)

// Update existing record
await db.workouts.update(workoutId, { completed: true })

// Get single record
const exercise = await db.exercises.get(exerciseId)
```

### Authentication Patterns
- Use `useUser()` hook to access current user context
- Check `isAuthenticated` before accessing protected features
- User profiles stored in Dexie with `supabaseUserId` for linking
- Multiple local profiles can share same Supabase account (family sharing)

### UI Component Guidelines
- **Buttons:** Use shadcn Button with `variant` prop (default, ghost, gradient, glass)
- **Forms:** Use react-hook-form with Zod validation
- **Modals:** Use Radix Dialog or Drawer (mobile-first preference)
- **Navigation:** BottomNav component with tab state in parent
- **Icons:** Lucide icons, typically 4-6 size (e.g., `w-6 h-6`)
- **Spacing:** Use Tailwind spacing scale, generous padding for touch targets

### Testing Patterns
- Use `describe`, `it`, `expect` from vitest
- Use `render`, `screen`, `fireEvent`, `waitFor` from @testing-library/react
- Mock external dependencies (Dexie, Supabase, OpenRouter)
- Test user flows, not implementation details
- Seed test database in `beforeEach` for isolated tests

### File Organization
```
src/
  components/     # Reusable components and UI library
  context/        # React Context providers
  hooks/          # Custom hooks
  lib/            # Utilities, database, API clients
  pages/          # Route-level components
  test/           # Test files and setup
  types/          # Shared TypeScript types
```

## Common Patterns to Follow

### Fetching Data with TanStack Query
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['routines', userId],
  queryFn: () => fetchUserRoutines(userId),
});
```

### Form Handling with react-hook-form
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues,
});
```

### Toast Notifications
```typescript
import { toast } from 'sonner';
toast.success('Workout saved!');
toast.error('Failed to save workout');
```

## Environment Variables
Required in `.env`:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Linting
- ESLint configured with TypeScript support
- React Hooks and React Refresh rules enabled
- `@typescript-eslint/no-unused-vars` disabled
- Always run `npm run lint` before committing
