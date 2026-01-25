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
  onNoteChange = vi.fn()
) => {
  return renderWithProviders(
    <ActiveExercise
      exercise={exercise}
      onSetComplete={onSetComplete}
      onAddSet={onAddSet}
      unit="kg"
      onUnitChange={vi.fn()}
      onNoteChange={onNoteChange}
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

  it('switches to tutorial tab when clicked', async () => {
    renderActiveExercise(mockExercise);

    const tutorialTab = screen.getByRole('tab', { name: /tutorial/i });
    fireEvent.click(tutorialTab);

    await waitFor(() => {
      expect(tutorialTab).toHaveAttribute('data-state', 'active');
    });
  });

  it('switches to muscles tab when clicked', async () => {
    renderActiveExercise(mockExercise);

    const musclesTab = screen.getByRole('tab', { name: /target muscles/i });
    fireEvent.click(musclesTab);

    await waitFor(() => {
      expect(musclesTab).toHaveAttribute('data-state', 'active');
    });
  });
});

describe('ActiveExercise - Sets Tab', () => {
  it('renders SetLogger component', () => {
    renderActiveExercise(mockExercise);

    // SetLogger should show progress
    expect(screen.getByText(/0 \/ 3 sets completed/i)).toBeInTheDocument();
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
  it('shows tutorial content when exercise has tutorial URL', async () => {
    const exerciseWithTutorial = {
      ...mockExercise,
      tutorialUrl: 'https://www.youtube.com/embed/test',
    };

    renderActiveExercise(exerciseWithTutorial);

    const tutorialTab = screen.getByRole('tab', { name: /tutorial/i });
    fireEvent.click(tutorialTab);

    await waitFor(() => {
      const iframe = screen.getByRole('presentation') || document.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
    });
  });

  it('shows beginner friendly instructions when available', async () => {
    const exerciseWithInstructions = {
      ...mockExercise,
      beginnerFriendlyInstructions: ['Keep your back straight', 'Control the weight'],
    };

    renderActiveExercise(exerciseWithInstructions);

    const tutorialTab = screen.getByRole('tab', { name: /tutorial/i });
    fireEvent.click(tutorialTab);

    await waitFor(() => {
      expect(screen.getByText(/Beginner Friendly Tips/i)).toBeInTheDocument();
      expect(screen.getByText(/Keep your back straight/i)).toBeInTheDocument();
    });
  });

  it('shows common mistakes when available', async () => {
    const exerciseWithMistakes = {
      ...mockExercise,
      commonMistakes: ['Arching back too much', 'Flaring elbows'],
    };

    renderActiveExercise(exerciseWithMistakes);

    const tutorialTab = screen.getByRole('tab', { name: /tutorial/i });
    fireEvent.click(tutorialTab);

    await waitFor(() => {
      expect(screen.getByText(/Things to Avoid/i)).toBeInTheDocument();
      expect(screen.getByText(/Arching back too much/i)).toBeInTheDocument();
    });
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
  it('renders anatomy diagram in muscles tab', async () => {
    renderActiveExercise(mockExercise);

    const musclesTab = screen.getByRole('tab', { name: /target muscles/i });
    fireEvent.click(musclesTab);

    await waitFor(() => {
      const diagram = screen.getByRole('img');
      expect(diagram).toBeInTheDocument();
    });
  });
});

describe('ActiveExercise - Set Completion', () => {
  it('calls onSetComplete when a set is completed', async () => {
    const onSetComplete = vi.fn();
    const { container } = renderWithProviders(
      <ActiveExercise
        exercise={mockExercise}
        onSetComplete={onSetComplete}
        onAddSet={vi.fn()}
        unit="kg"
        onUnitChange={vi.fn()}
        onNoteChange={vi.fn()}
      />
    );

    // Click first set to enter edit mode
    const setButtons = container.querySelectorAll('button[class*="grid"]');
    fireEvent.click(setButtons[0]);

    await waitFor(() => {
      const completeButton = screen.getByText(/Complete Set/i);
      fireEvent.click(completeButton);
    });

    expect(onSetComplete).toHaveBeenCalled();
  });
});
