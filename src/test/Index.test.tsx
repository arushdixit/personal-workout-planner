import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Index from '../pages/Index';
import { db, UserProfile } from '@/lib/db';
import { renderWithProviders } from './test-utils';

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

const renderIndex = () => {
    return renderWithProviders(<Index />, { includeRouter: true });
};

describe('Index Page - Dashboard Navigation', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.users.add(mockUser);
    });

    it('renders the main page', async () => {
        renderIndex();

        await waitFor(() => {
            // Check for bottom navigation
            const todayTab = screen.getByRole('button', { name: /today/i });
            expect(todayTab).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('shows today tab by default', async () => {
        renderIndex();

        await waitFor(() => {
            const todayTab = screen.getByRole('button', { name: /today/i });
            expect(todayTab).toBeInTheDocument();
        }, { timeout: 3000 });
    });
});

describe('Index Page - Tab Navigation', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.users.add(mockUser);
    });

    it('switches to library tab when clicked', async () => {
        renderIndex();

        await waitFor(() => {
            const libraryButton = screen.getByRole('button', { name: /library/i });
            fireEvent.click(libraryButton);
        }, { timeout: 3000 });

        await waitFor(() => {
            expect(screen.getByText(/Library/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('switches to progress tab when clicked', async () => {
        renderIndex();

        await waitFor(() => {
            const progressButton = screen.getByRole('button', { name: /progress/i });
            fireEvent.click(progressButton);
        }, { timeout: 3000 });

        await waitFor(() => {
            expect(screen.getByText(/Progress & Insights/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('switches to profile tab when clicked', async () => {
        renderIndex();

        await waitFor(() => {
            const profileButton = screen.getByRole('button', { name: /profile/i });
            fireEvent.click(profileButton);
        }, { timeout: 3000 });

        await waitFor(() => {
            expect(screen.getByText(mockUser.name)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('switches to routines tab when clicked', async () => {
        renderIndex();

        await waitFor(() => {
            const routinesButton = screen.getByRole('button', { name: /routines/i });
            fireEvent.click(routinesButton);
        }, { timeout: 3000 });

        await waitFor(() => {
            expect(screen.getByText(/Routines/i)).toBeInTheDocument();
        }, { timeout: 3000 });
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
        await waitFor(() => {
            const profileButton = screen.getByRole('button', { name: /profile/i });
            fireEvent.click(profileButton);
        }, { timeout: 3000 });

        await waitFor(() => {
            expect(screen.getByText(mockUser.name)).toBeInTheDocument();
            expect(screen.getByText(/PPL Athlete/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('shows logout button in profile', async () => {
        renderIndex();

        await waitFor(() => {
            const profileButton = screen.getByRole('button', { name: /profile/i });
            fireEvent.click(profileButton);
        }, { timeout: 3000 });

        await waitFor(() => {
            expect(screen.getByText(/Logout Session/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });
});

describe('Index Page - Progress Tab', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.users.add(mockUser);
    });

    it('displays progress chart component', async () => {
        renderIndex();

        await waitFor(() => {
            const progressButton = screen.getByRole('button', { name: /progress/i });
            fireEvent.click(progressButton);
        }, { timeout: 3000 });

        await waitFor(() => {
            expect(screen.getByText(/Progress & Insights/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('shows empty progress metrics initially', async () => {
        renderIndex();

        await waitFor(() => {
            const progressButton = screen.getByRole('button', { name: /progress/i });
            fireEvent.click(progressButton);
        }, { timeout: 3000 });

        await waitFor(() => {
            expect(screen.getByText(/--/)).toBeInTheDocument(); // No PB
            expect(screen.getByText(/0/)).toBeInTheDocument(); // 0 workouts
        }, { timeout: 3000 });
    });
});

describe('Index Page - Routines Tab', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.users.add(mockUser);
    });

    it('renders routines page component', async () => {
        renderIndex();

        await waitFor(() => {
            const routinesButton = screen.getByRole('button', { name: /routines/i });
            fireEvent.click(routinesButton);
        }, { timeout: 3000 });

        await waitFor(() => {
            expect(screen.getByText(/Routines/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });
});