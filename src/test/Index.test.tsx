import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

const renderIndex = (tab = 'today') => {
    window.history.pushState({}, '', `/?tab=${tab}`);
    return renderWithProviders(<Index />, { includeRouter: true });
};

describe('Index Page - Dashboard Navigation', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.users.add(mockUser);
        localStorage.setItem('prolifts_active_user', '1');
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
        await db.users.put({ ...mockUser, id: 1 });
        localStorage.setItem('prolifts_active_user', '1');
    });

    it('switches to library tab when clicked', async () => {
        renderIndex();

        const libraryButton = await screen.findByText('Library');
        fireEvent.click(libraryButton);

        expect(libraryButton).toBeInTheDocument();
    });

    it('switches to progress tab when clicked', async () => {
        renderIndex();

        const progressButton = await screen.findByText('Progress');
        fireEvent.click(progressButton);

        expect(progressButton).toBeInTheDocument();
    });

    it('switches to profile tab when clicked', async () => {
        renderIndex();

        const profileButton = await screen.findByText('Profile');
        fireEvent.click(profileButton);

        expect(profileButton).toBeInTheDocument();
    });

    it('switches to routines tab when clicked', async () => {
        renderIndex();

        const routinesButton = await screen.findByText('Routines');
        fireEvent.click(routinesButton);

        expect(routinesButton).toBeInTheDocument();
    });
});

import Profile from '../components/Profile';

describe('Index Page - Profile Display', () => {
    it('displays current user profile information', () => {
        renderWithProviders(<Profile currentUser={mockUser} />);
        expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });

    it('shows logout button in profile', () => {
        renderWithProviders(<Profile currentUser={mockUser} />);
        expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    });
});

describe('Index Page - Progress Tab', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.users.put({ ...mockUser, id: 1 });
        localStorage.setItem('prolifts_active_user', '1');
    });

    it('displays progress tab component when clicked', async () => {
        renderIndex();

        const progressTab = await screen.findByText('Progress');
        fireEvent.click(progressTab);

        expect(progressTab).toBeInTheDocument();
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