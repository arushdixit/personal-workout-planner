import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfilePicker from '../components/ProfilePicker';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProfile } from '../lib/db';

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const mockUsers: UserProfile[] = [
    {
        id: 1,
        name: 'User One',
        gender: 'male',
        age: 30,
        height: 180,
        weight: 80,
        onboarded: true,
        activeSplit: 'PPL',
        createdAt: new Date().toISOString(),
    },
    {
        id: 2,
        name: 'User Two',
        gender: 'female',
        age: 28,
        height: 165,
        weight: 60,
        onboarded: true,
        activeSplit: 'UpperLower',
        createdAt: new Date().toISOString(),
    },
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

        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();

        fireEvent.click(screen.getByText('User One'));
        expect(onSelect).toHaveBeenCalledWith(1);
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
