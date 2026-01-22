import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ActiveExercise from '@/components/ActiveExercise';
import { renderWithProviders } from './test-utils';

const mockExercise = {
  id: '1',
  name: 'Bench Press',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  sets: [
    { id: 1, weight: 100, reps: 8, completed: false },
    { id: 2, weight: 100, reps: 8, completed: false },
    { id: 3, weight: 100, reps: 8, completed: false },
  ],
};

const renderActiveExercise = (exercise, currentIndex, totalExercises, onPrevious, onNext, onSetComplete) => {
  act(() => {
    renderWithProviders(
      <ActiveExercise
        exercise={exercise}
        currentIndex={currentIndex}
        totalExercises={totalExercises}
        onPrevious={onPrevious}
        onNext={onNext}
        onSetComplete={onSetComplete}
      />
    );
  });
};

describe('ActiveExercise - Header & Progress', () => {
  it('displays exercise name', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('shows current exercise index', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('displays progress indicator', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 1, 3, onPrevious, onNext, onSetComplete);

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('shows sets completion status', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);

    expect(screen.getByText('0 / 3 sets completed')).toBeInTheDocument();
  });
});

describe('ActiveExercise - Navigation', () => {
  it('disables previous button on first exercise', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);

    const prevButton = screen.getByRole('button', { name: /previous exercise/i });
    expect(prevButton).toBeDisabled();
  });

  it('enables previous button on subsequent exercises', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 1, 3, onPrevious, onNext, onSetComplete);

    const prevButton = screen.getByRole('button', { name: /previous exercise/i });
    expect(prevButton).not.toBeDisabled();
  });

  it('disables next button on last exercise', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 2, 3, onPrevious, onNext, onSetComplete);

    const nextButton = screen.getByRole('button', { name: /next exercise/i });
    expect(nextButton).toBeDisabled();
  });

  it('calls onPrevious when previous button clicked', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 1, 3, onPrevious, onNext, onSetComplete);

    const prevButton = screen.getByRole('button', { name: /previous exercise/i });
    fireEvent.click(prevButton);

    expect(onPrevious).toHaveBeenCalled();
  });

  it('calls onNext when next button clicked', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 1, 3, onPrevious, onNext, onSetComplete);

    const nextButton = screen.getByRole('button', { name: /next exercise/i });
    fireEvent.click(nextButton);

    expect(onNext).toHaveBeenCalled();
  });
});

describe('ActiveExercise - Anatomy Diagram', () => {
  it('renders anatomy diagram', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);

    const diagramElement = screen.getByRole('img');
    expect(diagramElement).toBeInTheDocument();
  });
});

describe('ActiveExercise - Tutorial', () => {
  it('shows tutorial button', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);

    expect(screen.getByRole('button', { name: /watch tutorial/i })).toBeInTheDocument();
  });

  it('toggles tutorial display when clicked', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);

    const tutorialButton = screen.getByRole('button', { name: /watch tutorial/i });
    fireEvent.click(tutorialButton);

    expect(screen.getByText(/Video tutorial placeholder/i)).toBeInTheDocument();
  });
});

describe('ActiveExercise - Notes Section', () => {
  it('renders notes textarea', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);

    const textarea = screen.getByPlaceholderText(/Add notes about form/i);
    expect(textarea).toBeInTheDocument();
  });

  it('allows entering notes', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);

    const textarea = screen.getByPlaceholderText(/Add notes about form/i);
    fireEvent.change(textarea, { target: { value: 'Felt great today!' } });

    expect(textarea).toHaveValue('Felt great today!');
  });
});

describe('ActiveExercise - Warning Banner', () => {
  it('displays warning when exercise has warning', () => {
    const exerciseWithWarning = {
      ...mockExercise,
      warning: 'Previous injury in shoulder area',
    };
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(exerciseWithWarning, 0, 3, onPrevious, onNext, onSetComplete);

    expect(screen.getByText(/Previous Note/i)).toBeInTheDocument();
    expect(screen.getByText(/Previous injury in shoulder area/i)).toBeInTheDocument();
  });

  it('does not show warning banner when no warning present', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSetComplete = vi.fn();

    renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);

    expect(screen.queryByText(/Previous Note/i)).not.toBeInTheDocument();
  });
});
