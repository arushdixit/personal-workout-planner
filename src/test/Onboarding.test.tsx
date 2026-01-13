import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Onboarding from '../components/Onboarding';
import { UserProvider } from '../context/UserContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { db } from '../lib/db';

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const renderOnboarding = (onComplete = vi.fn()) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <UserProvider>
                <Onboarding onComplete={onComplete} />
            </UserProvider>
        </QueryClientProvider>
    );
};

describe('Onboarding Flow', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.exercises.clear();
    });

    it('navigates through all 5 steps and creates a user', async () => {
        const onComplete = vi.fn();
        renderOnboarding(onComplete);

        // Step 1: Name
        expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();
        fireEvent.change(screen.getByPlaceholderText(/Enter your name/i), {
            target: { value: 'Test Athlete' },
        });
        fireEvent.click(screen.getAllByText(/Next/i)[0]);

        // Step 2: Gender/Age
        await waitFor(() => expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument());
        fireEvent.click(screen.getAllByText(/Male/i)[0]);
        fireEvent.click(screen.getAllByText(/Next/i)[0]);

        // Step 3: Height/Weight
        await waitFor(() => expect(screen.getByText(/Step 3 of 5/i)).toBeInTheDocument());
        fireEvent.click(screen.getAllByText(/Next/i)[0]);

        // Step 4: Training Split
        await waitFor(() => expect(screen.getByText(/Step 4 of 5/i)).toBeInTheDocument());
        fireEvent.click(screen.getAllByText(/Push-Pull-Legs/i)[0]);
        fireEvent.click(screen.getAllByText(/Next/i)[0]);

        // Step 5: Ready
        await waitFor(() => expect(screen.getByText(/Step 5 of 5/i)).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Get Started/i));

        await waitFor(() => expect(onComplete).toHaveBeenCalled(), { timeout: 5000 });

        // Verify user was created in Dexie
        const users = await db.users.toArray();
        expect(users.length).toBe(1);
        expect(users[0].name).toBe('Test Athlete');

        // Verify exercises were seeded
        const exercises = await db.exercises.count();
        expect(exercises).toBeGreaterThan(0);
    });
});
