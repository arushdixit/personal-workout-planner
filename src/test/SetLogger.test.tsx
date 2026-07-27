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
        expect(screen.getByText(/\/ 3 sets completed/i)).toBeInTheDocument();
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
        expect(screen.getAllByText('1')[0]).toBeInTheDocument();
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

        expect(screen.getByText('KG')).toBeInTheDocument();
        expect(screen.getByText('LBS')).toBeInTheDocument();
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

        const lbsButton = screen.getByText('LBS');
        fireEvent.click(lbsButton);
        expect(onUnitChange).toHaveBeenCalledWith('lbs');
    });
});

describe('SetLogger - Inputs', () => {
    it('displays initial set values in inputs', () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();

        render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
            />
        );

        const weightInputs = screen.getAllByDisplayValue('100');
        expect(weightInputs.length).toBeGreaterThan(0);
    });
});

describe('SetLogger - Set Completion', () => {
    it('calls onSetComplete when completing a set', () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();

        render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
            />
        );

        const completeButton = screen.getByText(/LOG SET/i);
        fireEvent.click(completeButton);

        expect(onSetComplete).toHaveBeenCalledWith(1, 100, 8, 'kg');
    });

    it('shows completed set visual indicator', () => {
        const completedSets: WorkoutSet[] = [
            { id: 1, setNumber: 1, weight: 100, reps: 8, completed: true, unit: 'kg' },
        ];
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();

        render(
            <SetLogger
                sets={completedSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
            />
        );

        expect(screen.getByText(/\/ 1 sets completed/i)).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
    });
});

describe('SetLogger - Add Set', () => {
    it('shows add set button when canAddSet is true', () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();

        render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                canAddSet={true}
            />
        );

        expect(screen.getByText(/ADD SET/i)).toBeInTheDocument();
    });

    it('calls onAddSet when add set button is clicked', () => {
        const onSetComplete = vi.fn();
        const onAddSet = vi.fn();

        render(
            <SetLogger
                sets={mockSets}
                onSetComplete={onSetComplete}
                onAddSet={onAddSet}
                unit="kg"
                canAddSet={true}
            />
        );

        const addButton = screen.getByText(/ADD SET/i);
        fireEvent.click(addButton);

        expect(onAddSet).toHaveBeenCalled();
    });
});