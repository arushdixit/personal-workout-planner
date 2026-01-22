import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import Library from '../pages/Library';
import { db } from '../lib/db';
import { renderWithProviders, setupTestDB, seedTestExercise, createMockUser } from './test-utils';

vi.mock('../lib/exercemus', () => ({
  importExercemusData: vi.fn(() => Promise.resolve()),
}));

const mockUser = createMockUser();

describe('Library Page', () => {
  beforeEach(async () => {
    await setupTestDB();
    await seedTestExercise({
      id: 1,
      name: 'Bench Press',
      primaryMuscles: ['chest'],
      secondaryMuscles: ['triceps'],
      equipment: 'Barbell',
      source: 'local',
      inLibrary: true,
    });
    await seedTestExercise({
      id: 2,
      name: 'Global Pushup',
      primaryMuscles: ['chest'],
      secondaryMuscles: ['triceps'],
      equipment: 'Bodyweight',
      source: 'exercemus',
      inLibrary: false,
    });
  });

  it('renders My Exercises by default', async () => {
    act(() => {
      renderWithProviders(<Library />);
    });

    const exercise = await screen.findByText('Bench Press', {}, { timeout: 3000 });
    expect(exercise).toBeInTheDocument();

    expect(screen.getByLabelText('Edit Exercise')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Exercise')).toBeInTheDocument();

    expect(screen.queryByText('Global Pushup')).not.toBeInTheDocument();
  });

  it('switches to Global Library and shows the global exercise', async () => {
    act(() => {
      renderWithProviders(<Library />);
    });

    const globalTab = await screen.findByText(/Global Library/i);
    fireEvent.click(globalTab);

    const globalExercise = await screen.findByText('Global Pushup', {}, { timeout: 3000 });
    expect(globalExercise).toBeInTheDocument();

    expect(screen.getByLabelText('Add to My Exercises')).toBeInTheDocument();
    expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
  });

  it('adds and removes a global exercise', async () => {
    act(() => {
      renderWithProviders(<Library />);
    });

    fireEvent.click(await screen.findByText(/Global Library/i));
    await screen.findByText('Global Pushup');

    const addButton = screen.getByLabelText('Add to My Exercises');
    fireEvent.click(addButton);

    await waitFor(async () => {
      const ex = await db.exercises.get(2);
      expect(ex?.inLibrary).toBe(true);
    });

    expect(await screen.findByLabelText('Added')).toBeInTheDocument();

    fireEvent.click(await screen.findByText(/My Exercises/i));
    expect(await screen.findByText('Global Pushup')).toBeInTheDocument();

    const removeButton = screen.getByLabelText('Remove from My Exercises');
    fireEvent.click(removeButton);

    await waitFor(async () => {
      const ex = await db.exercises.get(2);
      expect(ex?.inLibrary).toBe(false);
    });

    expect(screen.queryByText('Global Pushup')).not.toBeInTheDocument();
  });
});
