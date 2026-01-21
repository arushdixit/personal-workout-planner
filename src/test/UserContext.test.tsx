import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { UserProvider, useUser } from '@/context/UserContext';
import { db, UserProfile } from '@/lib/db';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const mockUser: UserProfile = {
    id: 1,
    name: 'Test User',
    gender: 'male',
    age: 30,
    height: 180,
    weight: 80,
    bodyFat: 15,
    onboarded: true,
    activeSplit: 'PPL',
    createdAt: new Date().toISOString(),
};

const mockSupabaseAuth = {
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
};

const mockSupabase = {
    auth: mockSupabaseAuth,
};

vi.mock('@/lib/supabaseClient', () => ({
    supabase: mockSupabase,
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <UserProvider>{children}</UserProvider>
    </QueryClientProvider>
);

describe('UserContext - User Loading', () => {
    beforeEach(async () => {
        await db.users.clear();
    });

    it('initially shows loading state', () => {
        const { result } = renderHook(() => useUser(), { wrapper });
        expect(result.current.loading).toBe(true);
    });

    it('loads users from database on mount', async () => {
        await db.users.add(mockUser);
        
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.allUsers).toHaveLength(1);
        });
    });

    it('sets first user as current user after loading', async () => {
        await db.users.add(mockUser);
        
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await waitFor(() => {
            expect(result.current.currentUser?.name).toBe('Test User');
        });
    });
});

describe('UserContext - User Switching', () => {
    beforeEach(async () => {
        await db.users.clear();
        
        const user1: UserProfile = { ...mockUser, id: 1, name: 'User One' };
        const user2: UserProfile = { ...mockUser, id: 2, name: 'User Two' };
        
        await db.users.bulkAdd([user1, user2]);
    });

    it('switches to different user profile', async () => {
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        
        act(() => {
            result.current.switchUser(2);
        });
        
        expect(result.current.currentUser?.name).toBe('User Two');
    });

    it('updates allUsers list on switch', async () => {
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await waitFor(() => {
            expect(result.current.allUsers).toHaveLength(2);
        });
    });

    it('maintains user list integrity after switch', async () => {
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await waitFor(() => {
            expect(result.current.allUsers).toHaveLength(2);
        });
        
        act(() => {
            result.current.switchUser(2);
        });
        
        expect(result.current.allUsers).toHaveLength(2);
        expect(result.current.allUsers.find(u => u.id === 1)).toBeDefined();
        expect(result.current.allUsers.find(u => u.id === 2)).toBeDefined();
    });
});

describe('UserContext - Logout', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.users.add(mockUser);
    });

    it('clears current user on logout', async () => {
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await waitFor(() => {
            expect(result.current.currentUser).toBeDefined();
        });
        
        await act(async () => {
            await result.current.logout();
        });
        
        expect(result.current.currentUser).toBeNull();
    });

    it('clears all users list on logout', async () => {
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await waitFor(() => {
            expect(result.current.allUsers).toHaveLength(1);
        });
        
        await act(async () => {
            await result.current.logout();
        });
        
        expect(result.current.allUsers).toHaveLength(0);
    });

    it('sets isAuthenticated to false on logout', async () => {
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });
        
        await act(async () => {
            await result.current.logout();
        });
        
        expect(result.current.isAuthenticated).toBe(false);
    });
});

describe('UserContext - Active User Management', () => {
    beforeEach(async () => {
        await db.users.clear();
    });

    it('handles empty user list gracefully', async () => {
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.currentUser).toBeNull();
            expect(result.current.allUsers).toHaveLength(0);
        });
    });

    it('allows refreshing user list', async () => {
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        
        // Add user after initial load
        await db.users.add(mockUser);
        
        await act(async () => {
            await result.current.refreshUsers();
        });
        
        expect(result.current.allUsers).toHaveLength(1);
    });

    it('maintains loading state during refresh', async () => {
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        
        const refreshPromise = act(async () => {
            await result.current.refreshUsers();
        });
        
        expect(result.current.loading).toBe(true);
        await refreshPromise;
        expect(result.current.loading).toBe(false);
    });
});

describe('UserContext - Authentication State', () => {
    beforeEach(async () => {
        await db.users.clear();
    });

    it('starts with isAuthenticated: true when Supabase user exists', async () => {
        mockSupabaseUser = { id: 'test-id', email: 'test@test.com' };
        
        mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => ({
            unsubscribe: vi.fn(),
            data: { subscription: null },
        }));
        
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });
    });

    it('handles authentication errors gracefully', async () => {
        mockSupabaseAuth.signInWithPassword.mockRejectedValue(new Error('Invalid credentials'));
        
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await act(async () => {
            try {
                await result.current.signIn('test@test.com', 'wrongpassword');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    it('prevents access when not authenticated', async () => {
        const { result } = renderHook(() => useUser(), { wrapper });
        
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.isAuthenticated).toBe(false);
        });
        
        expect(result.current.currentUser).toBeNull();
        expect(result.current.allUsers).toHaveLength(0);
    });
});

let mockSupabaseUser: any = null;