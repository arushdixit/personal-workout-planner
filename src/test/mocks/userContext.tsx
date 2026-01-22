import { vi } from 'vitest';

export const mockSupabaseAuth = {
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};

export const mockSupabase = {
  auth: mockSupabaseAuth,
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

export const mockUseUser = (overrides = {}) => ({
  currentUser: null,
  allUsers: [],
  loading: false,
  isAuthenticated: false,
  switchUser: vi.fn(),
  logout: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  refreshUsers: vi.fn(),
  ...overrides,
});
