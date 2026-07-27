import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActiveExercise from '@/components/ActiveExercise';
import { renderWithProviders } from './test-utils';
import { Exercise, WorkoutSet } from '@/lib/db';

const mockExercise: Exercise & { sets: WorkoutSet[] } = {
  id: 1,
  name: 'Bench Press',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  equipment: 'Barbell',
  sets: [
    { id: 1, setNumber: 1, weight: 100, reps: 8, completed: false, unit: 'kg' },
    { id: 2, setNumber: 2, weight: 100, reps: 8, completed: false, unit: 'kg' },
    { id: 3, setNumber: 3, weight: 100, reps: 8, completed: false, unit: 'kg' },
  ],
};

const renderActiveExercise = (
  exercise: Exercise & { sets: WorkoutSet[] },
  onSetComplete = vi.fn(),
  onAddSet = vi.fn(),
  onNoteChange = vi.fn(),
  initialTab?: 'sets' | 'tutorial' | 'muscles'
) => {
  return renderWithProviders(
    <ActiveExercise
      exercise={exercise}
      onSetComplete={onSetComplete}
      onAddSet={onAddSet}
      unit="kg"
      onUnitChange={vi.fn()}
      onNoteChange={onNoteChange}
      initialTab={initialTab}
    />
  );
};

describe('ActiveExercise - Header', () => {
  it('displays exercise name', () => {
    renderActiveExercise(mockExercise);
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });
});

describe('ActiveExercise - Tabs', () => {
  it('renders all tabs', () => {
    renderActiveExercise(mockExercise);

    expect(screen.getByRole('tab', { name: /sets/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tutorial/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /target muscles/i })).toBeInTheDocument();
  });

  it('shows sets tab by default', () => {
    renderActiveExercise(mockExercise);

    const setsTab = screen.getByRole('tab', { name: /sets/i });
    expect(setsTab).toHaveAttribute('data-state', 'active');
  });

  it('switches to tutorial tab when clicked', () => {
    renderActiveExercise(mockExercise, vi.fn(), vi.fn(), vi.fn(), 'tutorial');

    const tutorialTab = screen.getByRole('tab', { name: /tutorial/i });
    expect(tutorialTab).toHaveAttribute('data-state', 'active');
  });

  it('switches to muscles tab when clicked', () => {
    renderActiveExercise(mockExercise, vi.fn(), vi.fn(), vi.fn(), 'muscles');

    const musclesTab = screen.getByRole('tab', { name: /target muscles/i });
    expect(musclesTab).toHaveAttribute('data-state', 'active');
  });
});

describe('ActiveExercise - Sets Tab', () => {
  it('renders SetLogger component', () => {
    renderActiveExercise(mockExercise);

    // SetLogger should show progress
    expect(screen.getByText(/\/ 3 sets completed/i)).toBeInTheDocument();
  });

  it('renders notes textarea', () => {
    renderActiveExercise(mockExercise);

    const textarea = screen.getByPlaceholderText(/Add notes about form/i);
    expect(textarea).toBeInTheDocument();
  });

  it('allows entering notes', () => {
    const onNoteChange = vi.fn();
    renderActiveExercise(mockExercise, vi.fn(), vi.fn(), onNoteChange);

    const textarea = screen.getByPlaceholderText(/Add notes about form/i);
    fireEvent.change(textarea, { target: { value: 'Felt great today!' } });

    expect(onNoteChange).toHaveBeenCalledWith('Felt great today!');
  });
});

describe('ActiveExercise - Tutorial Tab', () => {
  it('shows tutorial content when exercise has tutorial URL', () => {
    const exerciseWithTutorial = {
      ...mockExercise,
      tutorialUrl: 'https://www.youtube.com/embed/test',
    };

    renderActiveExercise(exerciseWithTutorial, vi.fn(), vi.fn(), vi.fn(), 'tutorial');

    const tutorialTab = screen.getByRole('tab', { name: /tutorial/i });
    expect(tutorialTab).toHaveAttribute('data-state', 'active');
  });

  it('shows beginner friendly instructions when available', () => {
    const exerciseWithInstructions = {
      ...mockExercise,
      beginnerFriendlyInstructions: ['Keep your back straight', 'Control the weight'],
    };

    renderActiveExercise(exerciseWithInstructions, vi.fn(), vi.fn(), vi.fn(), 'tutorial');

    expect(screen.getByText(/Beginner Friendly Tips/i)).toBeInTheDocument();
    expect(screen.getByText(/Keep your back straight/i)).toBeInTheDocument();
  });

  it('shows common mistakes when available', () => {
    const exerciseWithMistakes = {
      ...mockExercise,
      commonMistakes: ['Arching back too much', 'Flaring elbows'],
    };

    renderActiveExercise(exerciseWithMistakes, vi.fn(), vi.fn(), vi.fn(), 'tutorial');

    expect(screen.getByText(/Things to Avoid/i)).toBeInTheDocument();
    expect(screen.getByText(/Arching back too much/i)).toBeInTheDocument();
  });
});

describe('ActiveExercise - Warning Banner', () => {
  it('displays warning when exercise has tips', () => {
    const exerciseWithWarning = {
      ...mockExercise,
      tips: ['Previous injury in shoulder area'],
    };

    renderActiveExercise(exerciseWithWarning);

    expect(screen.getByText(/Previous Note/i)).toBeInTheDocument();
    expect(screen.getByText(/Previous injury in shoulder area/i)).toBeInTheDocument();
  });

  it('does not show warning banner when no tips present', () => {
    renderActiveExercise(mockExercise);

    expect(screen.queryByText(/Previous Note/i)).not.toBeInTheDocument();
  });
});

describe('ActiveExercise - Anatomy Diagram', () => {
  it('renders anatomy diagram in muscles tab', () => {
    renderActiveExercise(mockExercise, vi.fn(), vi.fn(), vi.fn(), 'muscles');

    const musclesTab = screen.getByRole('tab', { name: /target muscles/i });
    expect(musclesTab).toHaveAttribute('data-state', 'active');
  });
});

describe('ActiveExercise - Set Completion', () => {
  it('calls onSetComplete when a set is completed', () => {
    const onSetComplete = vi.fn();
    renderWithProviders(
      <ActiveExercise
        exercise={mockExercise}
        onSetComplete={onSetComplete}
        onAddSet={vi.fn()}
        unit="kg"
        onUnitChange={vi.fn()}
        onNoteChange={vi.fn()}
      />
    );

    const completeButton = screen.getByText(/LOG SET/i);
    fireEvent.click(completeButton);

    expect(onSetComplete).toHaveBeenCalled();
  });
});
