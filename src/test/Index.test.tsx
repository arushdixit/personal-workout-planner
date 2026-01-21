import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Index from '../pages/Index';
import { db, UserProfile } from '@/lib/db';
import { UserProvider } from '@/context/UserContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockUser: UserProfile = {
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

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const renderIndex = () => {
    return render(
        <QueryClientProvider client={queryClient}>
            <UserProvider>
                <Index />
            </UserProvider>
        </QueryClientProvider>
    );
};

describe('Index Page - Dashboard Navigation', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.users.add(mockUser);
    });

    it('renders greeting based on time of day', () => {
        // Mock time to morning
        const hoursBefore8AM = new Date().setHours(8, 0, 0, 0);
        vi.spyOn(Date.prototype, 'getHours').mockReturnValue(8);
        
        renderIndex();
        expect(screen.getByText(/Good morning/i)).toBeInTheDocument();
    });

    it('shows afternoon greeting after 12pm', () => {
        vi.spyOn(Date.prototype, 'getHours').mockReturnValue(14);
        
        renderIndex();
        expect(screen.getByText(/Good afternoon/i)).toBeInTheDocument();
    });

    it('shows evening greeting after 6pm', () => {
        vi.spyOn(Date.prototype, 'getHours').mockReturnValue(19);
        
        renderIndex();
        expect(screen.getByText(/Good evening/i)).toBeInTheDocument();
    });

    it('displays correct split day type based on day of week', () => {
        // Monday (day 0) for PPL split should show Push
        const mockDate = new Date('2024-01-01'); // Monday
        vi.spyOn(global.Date, 'now').mockImplementation(() => mockDate.getTime());
        vi.spyOn(Date.prototype, 'getDay').mockReturnValue(1);
        
        renderIndex();
        expect(screen.getByText(/Push Day/i)).toBeInTheDocument();
    });
});

describe('Index Page - Empty States', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.users.add(mockUser);
    });

    it('shows empty state when no exercises added', async () => {
        renderIndex();
        
        await waitFor(() => {
            expect(screen.getByText(/No exercises yet/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/Go to Library/i)).toBeInTheDocument();
    });

    it('navigates to library when clicking "Go to Library"', async () => {
        renderIndex();
        
        fireEvent.click(await screen.findByText(/Go to Library/i));
        
        await waitFor(() => {
            expect(screen.queryByText(/Library/i)).toBeInTheDocument();
        });
    });
});

describe('Index Page - Tab Navigation', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.users.add(mockUser);
    });

    it('switches between tabs correctly', async () => {
        renderIndex();
        
        // Initially on 'today' tab
        expect(screen.getByText(/No exercises yet/i)).toBeInTheDocument();
        
        // Click library tab
        const libraryButton = screen.getByRole('button', { name: /library/i });
        fireEvent.click(libraryButton);
        
        await waitFor(() => {
            expect(screen.getByText(/Library/i)).toBeInTheDocument();
        });
    });

    it('maintains active tab state properly', async () => {
        renderIndex();
        
        const progressButton = screen.getByRole('button', { name: /progress/i });
        fireEvent.click(progressButton);
        
        await waitFor(() => {
            expect(screen.getByText(/Progress & Insights/i)).toBeInTheDocument();
        });
        
        const profileButton = screen.getByRole('button', { name: /profile/i });
        fireEvent.click(profileButton);
        
        await waitFor(() => {
            expect(screen.getByText(mockUser.name)).toBeInTheDocument();
        });
    });
});

describe('Index Page - Profile Display', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.users.add(mockUser);
    });

    it('displays current user profile information', async () => {
        renderIndex();
        
        // Navigate to profile tab
        const profileButton = screen.getByRole('button', { name: /profile/i });
        fireEvent.click(profileButton);
        
        await waitFor(() => {
            expect(screen.getByText(mockUser.name)).toBeInTheDocument();
            expect(screen.getByText(/PPL Athlete/i)).toBeInTheDocument();
        });
    });

    it('shows user avatar and logout button in profile', async () => {
        renderIndex();
        
        const profileButton = screen.getByRole('button', { name: /profile/i });
        fireEvent.click(profileButton);
        
        await waitFor(() => {
            expect(screen.getByLabelText(/User Circle/i)).toBeInTheDocument();
            expect(screen.getByText(/Logout Session/i)).toBeInTheDocument();
        });
    });
});

describe('Index Page - Progress Tab', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.users.add(mockUser);
    });

    it('displays progress chart component', async () => {
        renderIndex();
        
        const progressButton = screen.getByRole('button', { name: /progress/i });
        fireEvent.click(progressButton);
        
        await waitFor(() => {
            expect(screen.getByText(/Progress & Insights/i)).toBeInTheDocument();
            // ProgressChart should be rendered
            expect(screen.queryByText(/Recent Performance/i)).toBeInTheDocument();
        });
    });

    it('shows empty progress metrics initially', async () => {
        renderIndex();
        
        const progressButton = screen.getByRole('button', { name: /progress/i });
        fireEvent.click(progressButton);
        
        await waitFor(() => {
            expect(screen.getByText(/--/)).toBeInTheDocument(); // No PB
            expect(screen.getByText(/0/)).toBeInTheDocument(); // 0 workouts
        });
    });
});

describe('Index Page - Routines Tab', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.users.add(mockUser);
    });

    it('renders routines page component', async () => {
        renderIndex();
        
        const routinesButton = screen.getByRole('button', { name: /routines/i });
        fireEvent.click(routinesButton);
        
        await waitFor(() => {
            expect(screen.getByText(/Routines/i)).toBeInTheDocument();
        });
    });
});