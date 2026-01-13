import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProvider, useUser } from '../context/UserContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePicker from '../components/ProfilePicker';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
    },
});

const mockUsers = [
    {
        _id: 'user_1',
        name: 'User 1',
        gender: 'male' as const,
        age: 30,
        height: 180,
        weight: 80,
        onboarded: true,
        activeSplit: 'PPL' as const,
        createdAt: new Date().toISOString(),
    },
    {
        _id: 'user_2',
        name: 'User 2',
        gender: 'female' as const,
        age: 28,
        height: 165,
        weight: 60,
        onboarded: true,
        activeSplit: 'UpperLower' as const,
        createdAt: new Date().toISOString(),
    }
];

describe('Profile Selection Flow', () => {
    it('renders all users and allows selection', async () => {
        const onSelect = vi.fn();
        const onNew = vi.fn();

        render(
            <QueryClientProvider client={queryClient}>
                <ProfilePicker users={mockUsers} onSelect={onSelect} onNew={onNew} />
            </QueryClientProvider>
        );

        expect(screen.getByText('User 1')).toBeInTheDocument();
        expect(screen.getByText('User 2')).toBeInTheDocument();

        fireEvent.click(screen.getByText('User 1'));
        expect(onSelect).toHaveBeenCalledWith('user_1');
    });

    it('shows add profile button when less than 2 users', async () => {
        const onSelect = vi.fn();
        const onNew = vi.fn();

        render(
            <QueryClientProvider client={queryClient}>
                <ProfilePicker users={[mockUsers[0]]} onSelect={onSelect} onNew={onNew} />
            </QueryClientProvider>
        );

        expect(screen.getByText('Add Profile')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Add Profile'));
        expect(onNew).toHaveBeenCalled();
    });
});
