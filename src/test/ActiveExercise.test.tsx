import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActiveExercise from '@/components/ActiveExercise';
import { UserProvider } from '@/context/UserContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const renderActiveExercise = (exercise, currentIndex, totalExercises, onPrevious, onNext, onSetComplete) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <UserProvider>
                <ActiveExercise
                    exercise={exercise}
                    currentIndex={currentIndex}
                    totalExercises={totalExercises}
                    onPrevious={onPrevious}
                    onNext={onNext}
                    onSetComplete={onSetComplete}
                />
            </UserProvider>
        </QueryClientProvider>
    );
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

    it('displays progress bar', () => {
        const onPrevious = vi.fn();
        const onNext = vi.fn();
        const onSetComplete = vi.fn();
        
        const { container } = renderActiveExercise(mockExercise, 1, 3, onPrevious, onNext, onSetComplete);
        
        const progressBar = container.querySelector('.gradient-red');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveStyle({ width: '66.67%' });
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
        
        const { container } = renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);
        
        const prevButton = container.querySelector('button[disabled]');
        expect(prevButton).toBeInTheDocument();
    });

    it('enables previous button on subsequent exercises', () => {
        const onPrevious = vi.fn();
        const onNext = vi.fn();
        const onSetComplete = vi.fn();
        
        const { container } = renderActiveExercise(mockExercise, 1, 3, onPrevious, onNext, onSetComplete);
        
        const prevButton = container.querySelector('button:not([disabled])')?.closest('button');
        // First button should be enabled
        expect(prevButton).not.toBeDisabled();
    });

    it('disables next button on last exercise', () => {
        const onPrevious = vi.fn();
        const onNext = vi.fn();
        const onSetComplete = vi.fn();
        
        const { container } = renderActiveExercise(mockExercise, 2, 3, onPrevious, onNext, onSetComplete);
        
        const nextButtons = container.querySelectorAll('button');
        const lastButton = nextButtons[nextButtons.length - 1];
        expect(lastButton).toBeDisabled();
    });

    it('calls onPrevious when previous button clicked', () => {
        const onPrevious = vi.fn();
        const onNext = vi.fn();
        const onSetComplete = vi.fn();
        
        const { container } = renderActiveExercise(mockExercise, 1, 3, onPrevious, onNext, onSetComplete);
        
        const prevButton = container.querySelectorAll('button')[0];
        fireEvent.click(prevButton);
        
        expect(onPrevious).toHaveBeenCalled();
    });

    it('calls onNext when next button clicked', () => {
        const onPrevious = vi.fn();
        const onNext = vi.fn();
        const onSetComplete = vi.fn();
        
        const { container } = renderActiveExercise(mockExercise, 1, 3, onPrevious, onNext, onSetComplete);
        
        const nextButtons = container.querySelectorAll('button');
        const nextButton = nextButtons[nextButtons.length - 1];
        fireEvent.click(nextButton);
        
        expect(onNext).toHaveBeenCalled();
    });
});

describe('ActiveExercise - Anatomy Diagram', () => {
    it('renders anatomy diagram', () => {
        const onPrevious = vi.fn();
        const onNext = vi.fn();
        const onSetComplete = vi.fn();
        
        const { container } = renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);
        
        const diagramElement = container.querySelector('svg');
        expect(diagramElement).toBeInTheDocument();
    });
});

describe('ActiveExercise - Tutorial', () => {
    it('shows tutorial button', () => {
        const onPrevious = vi.fn();
        const onNext = vi.fn();
        const onSetComplete = vi.fn();
        
        renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);
        
        expect(screen.getByText(/Watch Tutorial/i)).toBeInTheDocument();
    });

    it('toggles tutorial display when clicked', () => {
        const onPrevious = vi.fn();
        const onNext = vi.fn();
        const onSetComplete = vi.fn();
        
        renderActiveExercise(mockExercise, 0, 3, onPrevious, onNext, onSetComplete);
        
        const tutorialButton = screen.getByText(/Watch Tutorial/i);
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