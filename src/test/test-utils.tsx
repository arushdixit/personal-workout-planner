import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider } from '@/context/UserContext';
import { UserProfile, db } from '@/lib/db';

export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

const queryClient = createTestQueryClient();

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  includeUserProvider?: boolean;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { includeUserProvider = true, ...renderOptions } = options;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {includeUserProvider ? <UserProvider>{children}</UserProvider> : children}
    </QueryClientProvider>
  );

  return render(ui, { wrapper, ...renderOptions });
};

export const renderWithQueryClient = (ui: ReactElement) => {
  return renderWithProviders(ui, { includeUserProvider: false });
};

export const mockUser: UserProfile = {
  id: 1,
  name: 'Test Athlete',
  gender: 'male',
  age: 30,
  height: 180,
  weight: 80,
  bodyFat: 15,
  onboarded: true,
  activeSplit: 'PPL',
  createdAt: new Date().toISOString(),
};

export const createMockUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  ...mockUser,
  ...overrides,
});

export const createMockExercise = (overrides = {}) => ({
  id: '1',
  name: 'Bench Press',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  equipment: 'Barbell',
  sets: [
    { id: 1, weight: 100, reps: 8, completed: false },
    { id: 2, weight: 100, reps: 8, completed: false },
    { id: 3, weight: 100, reps: 8, completed: false },
  ],
  ...overrides,
});

export const createMockSet = (overrides = {}) => ({
  id: 1,
  weight: 100,
  reps: 8,
  completed: false,
  ...overrides,
});

export const setupTestDB = async () => {
  await db.users.clear();
  await db.exercises.clear();
};

export const seedTestUser = async (user: UserProfile) => {
  return await db.users.add(user);
};

export const seedTestExercise = async (exercise: any) => {
  return await db.exercises.add(exercise);
};
