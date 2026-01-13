import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Onboarding from '../components/Onboarding';
import { UserProvider } from '../context/UserContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderOnboarding = (onComplete = () => { }) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <UserProvider>
                <Onboarding onComplete={onComplete} />
            </UserProvider>
        </QueryClientProvider>
    );
};

describe('Onboarding Flow', () => {
    it('navigates through the steps correctly', async () => {
        const onComplete = vi.fn();
        renderOnboarding(onComplete);

        // Step 1: Name
        expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();
        const nameInput = screen.getByPlaceholderText(/Enter your name/i);
        fireEvent.change(nameInput, { target: { value: 'Test User' } });
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

        await waitFor(() => {
            expect(onComplete).toHaveBeenCalled();
        }, { timeout: 5000 });
    });
});
