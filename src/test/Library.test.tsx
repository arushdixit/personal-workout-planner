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

  it('renders My Exercises when selected', async () => {
    renderWithProviders(<Library />);

    const myTab = await screen.findByText(/My Exercises/i);
    fireEvent.click(myTab);

    const exercise = await screen.findByText('Bench Press', {}, { timeout: 3000 });
    expect(exercise).toBeInTheDocument();

    expect(screen.getByLabelText('Edit Exercise')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Exercise')).toBeInTheDocument();
  });

  it('switches to Global Library and shows the global exercise', async () => {
    renderWithProviders(<Library />);

    const globalTab = await screen.findByText(/Global Library/i);
    fireEvent.click(globalTab);

    const chestGroup = await screen.findByText(/chest/i);
    fireEvent.click(chestGroup);

    const globalExercise = await screen.findByText('Global Pushup', {}, { timeout: 3000 });
    expect(globalExercise).toBeInTheDocument();
  });

  it('adds and removes a global exercise', async () => {
    renderWithProviders(<Library />);

    const globalTab = await screen.findByText(/Global Library/i);
    fireEvent.click(globalTab);

    const chestGroup = await screen.findByText(/chest/i);
    fireEvent.click(chestGroup);

    const globalExercise = await screen.findByText('Global Pushup');
    expect(globalExercise).toBeInTheDocument();

    const addButton = screen.getByLabelText('Add to My Exercises');
    fireEvent.click(addButton);

    await waitFor(async () => {
      const allEx = await db.exercises.toArray();
      const ex = allEx.find(e => e.name === 'Global Pushup');
      expect(ex?.inLibrary).toBe(true);
    });
  });
});
