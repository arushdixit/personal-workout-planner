import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Library from '../pages/Library';
import { db } from '../lib/db';

// Mock the importExercemusData to avoid loading large JSON in tests
vi.mock('../lib/exercemus', () => ({
    importExercemusData: vi.fn(() => Promise.resolve()),
}));

describe('Library Page', () => {
    beforeEach(async () => {
        // Clear and seed the database before each test
        await db.exercises.clear();
        await db.exercises.add({
            id: 1,
            name: 'Bench Press',
            primaryMuscles: ['chest'],
            secondaryMuscles: ['triceps'],
            equipment: 'Barbell',
            source: 'local',
            mastered: true
        });
        await db.exercises.add({
            id: 2,
            name: 'Global Pushup',
            primaryMuscles: ['chest'],
            secondaryMuscles: ['triceps'],
            equipment: 'Bodyweight',
            source: 'exercemus',
            mastered: false
        });
    });

    it('renders My Exercises by default', async () => {
        render(<Library />);

        const exercise = await screen.findByText('Bench Press', {}, { timeout: 3000 });
        expect(exercise).toBeInTheDocument();

        // Bench Press is local, should have Edit and Delete labels
        expect(screen.getByLabelText('Edit Exercise')).toBeInTheDocument();
        expect(screen.getByLabelText('Delete Exercise')).toBeInTheDocument();

        // Global Pushup should NOT be in "My Exercises" because mastered is false
        expect(screen.queryByText('Global Pushup')).not.toBeInTheDocument();
    });

    it('switches to Global Library and shows the global exercise', async () => {
        render(<Library />);

        const globalTab = await screen.findByText(/Global Library/i);
        fireEvent.click(globalTab);

        const globalExercise = await screen.findByText('Global Pushup', {}, { timeout: 3000 });
        expect(globalExercise).toBeInTheDocument();

        // Should show "Add to My Exercises" button
        expect(screen.getByLabelText('Add to My Exercises')).toBeInTheDocument();

        // Should NOT show Bench Press in Global Library view (because source is 'local')
        expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
    });

    it('adds and removes a global exercise', async () => {
        render(<Library />);

        // Switch to Global Library
        fireEvent.click(await screen.findByText(/Global Library/i));
        await screen.findByText('Global Pushup');

        // Click Add button
        const addButton = screen.getByLabelText('Add to My Exercises');
        fireEvent.click(addButton);

        // Verify it was added (mastered) in our DB
        await waitFor(async () => {
            const ex = await db.exercises.get(2);
            expect(ex?.mastered).toBe(true);
        });

        // Should now show "Added" label
        expect(await screen.findByLabelText('Added')).toBeInTheDocument();

        // Switch back to My Exercises
        fireEvent.click(await screen.findByText(/My Exercises/i));
        expect(await screen.findByText('Global Pushup')).toBeInTheDocument();

        // Click Remove button (trash icon labeled "Remove from My Exercises")
        const removeButton = screen.getByLabelText('Remove from My Exercises');
        fireEvent.click(removeButton);

        // Verify it was removed (un-mastered)
        await waitFor(async () => {
            const ex = await db.exercises.get(2);
            expect(ex?.mastered).toBe(false);
        });

        expect(screen.queryByText('Global Pushup')).not.toBeInTheDocument();
    });
});
