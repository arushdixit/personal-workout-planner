import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SetLogger from '@/components/SetLogger';
import { WorkoutSet } from '@/lib/db';

const mockSets: WorkoutSet[] = [
    { id: 1, setNumber: 1, weight: 100, reps: 8, completed: false, unit: 'kg' },
    { id: 2, setNumber: 2, weight: 100, reps: 8, completed: false, unit: 'kg' },
    { id: 3, setNumber: 3, weight: 100, reps: 8, completed: false, unit: 'kg' },
];

describe('SetLogger - Rendering', () => {
    it('renders all sets with headers', () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
            />
        );

        // Check for progress summary
        expect(screen.getByText(/0 \/ 3 sets completed/i)).toBeInTheDocument();
    });

    it('displays set information correctly', () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
            />
        );

        // Check for set numbers
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows unit toggle buttons', () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
            />
        );

        const buttons = screen.getAllByRole('button');
        const kgButton = buttons.find(btn => btn.textContent === 'kg');
        const lbsButton = buttons.find(btn => btn.textContent === 'lbs');

        expect(kgButton).toBeInTheDocument();
        expect(lbsButton).toBeInTheDocument();
    });

    it('calls onUnitChange when unit is toggled', () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
            />
        );

        const buttons = screen.getAllByRole('button');
        const lbsButton = buttons.find(btn => btn.textContent === 'lbs');

        if (lbsButton) {
            fireEvent.click(lbsButton);
            expect(onUnitChange).toHaveBeenCalledWith('lbs');
        }
    });
});

describe('SetLogger - Set Editing', () => {
    it('enters edit mode when clicking incomplete set', async () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        const { container } = render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
            />
        );

        // Find the first set button and click it
        const setButtons = container.querySelectorAll('button[class*="grid"]');
        fireEvent.click(setButtons[0]);

        await waitFor(() => {
            expect(screen.getByText(/Complete Set/i)).toBeInTheDocument();
        });
    });

    it('does not enter edit mode for completed sets', () => {
        const completedSets: WorkoutSet[] = [
            { id: 1, setNumber: 1, weight: 100, reps: 8, completed: true, unit: 'kg' },
        ];
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        const { container } = render(
            <SetLogger
                sets={completedSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
            />
        );

        const setButtons = container.querySelectorAll('button[disabled]');
        expect(setButtons.length).toBeGreaterThan(0);
    });
});

describe('SetLogger - Weight Adjustments', () => {
    it('allows editing weight in edit mode', async () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        const { container } = render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
            />
        );

        // Click first set to enter edit mode
        const setButtons = container.querySelectorAll('button[class*="grid"]');
        fireEvent.click(setButtons[0]);

        await waitFor(() => {
            const weightInput = screen.getByDisplayValue('100');
            expect(weightInput).toBeInTheDocument();
        });
    });

    it('prevents weight from going below zero', async () => {
        const lowWeightSets: WorkoutSet[] = [
            { id: 1, setNumber: 1, weight: 2, reps: 8, completed: false, unit: 'kg' },
        ];
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        const { container } = render(
            <SetLogger
                sets={lowWeightSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
            />
        );

        const setButtons = container.querySelectorAll('button[class*="grid"]');
        fireEvent.click(setButtons[0]);

        await waitFor(() => {
            const weightInput = screen.getByDisplayValue('2') as HTMLInputElement;
            fireEvent.change(weightInput, { target: { value: '-5' } });
            expect(weightInput.value).toBe('0');
        });
    });
});

describe('SetLogger - Reps Adjustments', () => {
    it('allows editing reps in edit mode', async () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        const { container } = render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
            />
        );

        const setButtons = container.querySelectorAll('button[class*="grid"]');
        fireEvent.click(setButtons[0]);

        await waitFor(() => {
            const repsInput = screen.getAllByDisplayValue('8')[0];
            expect(repsInput).toBeInTheDocument();
        });
    });

    it('prevents reps from going below zero', async () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        const { container } = render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
            />
        );

        const setButtons = container.querySelectorAll('button[class*="grid"]');
        fireEvent.click(setButtons[0]);

        await waitFor(() => {
            const repsInputs = screen.getAllByDisplayValue('8');
            const repsInput = repsInputs[repsInputs.length - 1] as HTMLInputElement;
            fireEvent.change(repsInput, { target: { value: '-1' } });
            expect(repsInput.value).toBe('0');
        });
    });
});

describe('SetLogger - Set Completion', () => {
    it('calls onSetComplete when completing a set', async () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        const { container } = render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
            />
        );

        // Click first set to enter edit mode
        const setButtons = container.querySelectorAll('button[class*="grid"]');
        fireEvent.click(setButtons[0]);

        await waitFor(() => {
            const completeButton = screen.getByText(/Complete Set/i);
            fireEvent.click(completeButton);
        });

        expect(onSetComplete).toHaveBeenCalledWith(1, 100, 8, 'kg');
    });

    it('shows completed set visual indicator', () => {
        const completedSets: WorkoutSet[] = [
            { id: 1, setNumber: 1, weight: 100, reps: 8, completed: true, unit: 'kg' },
        ];
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        render(
            <SetLogger
                sets={completedSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
            />
        );

        expect(screen.getByText(/1 \/ 1 sets completed/i)).toBeInTheDocument();
    });
});

describe('SetLogger - Add Set', () => {
    it('shows add set button when canAddSet is true', () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
                canAddSet={true}
            />
        );

        expect(screen.getByText(/Add Set/i)).toBeInTheDocument();
    });

    it('calls onAddSet when add set button is clicked', () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();
        const onUnitChange = vi.fn();

        render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                onUnitChange={onUnitChange}
                canAddSet={true}
            />
        );

        const addButton = screen.getByText(/Add Set/i);
        fireEvent.click(addButton);

        expect(onAddSet).toHaveBeenCalled();
    });
});