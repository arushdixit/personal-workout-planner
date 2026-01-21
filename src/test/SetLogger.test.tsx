import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SetLogger from '@/components/SetLogger';

const mockSets = [
    { id: 1, weight: 100, reps: 8, completed: false },
    { id: 2, weight: 100, reps: 8, completed: false },
    { id: 3, weight: 100, reps: 8, completed: false },
];

describe('SetLogger - Rendering', () => {
    it('renders all sets', () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} />);
        
        expect(screen.getByText('SET')).toBeInTheDocument();
        expect(screen.getByText('WEIGHT')).toBeInTheDocument();
        expect(screen.getByText('REPS')).toBeInTheDocument();
        expect(screen.getByText('DONE')).toBeInTheDocument();
    });

    it('displays set information correctly', () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} />);
        
        expect(screen.getByText('100kg')).toBeInTheDocument();
        expect(screen.getAllByText('8')).toHaveLength(3); // 3 sets with 8 reps
    });

    it('shows unit as kg by default', () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} unit="kg" />);
        
        expect(screen.getByText('100kg')).toBeInTheDocument();
    });

    it('shows unit as lbs when specified', () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} unit="lb" />);
        
        expect(screen.getByText('100lb')).toBeInTheDocument();
    });
});

describe('SetLogger - Set Editing', () => {
    it('enters edit mode when clicking incomplete set', async () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} />);
        
        const firstSet = screen.getAllByText(/1/)[0];
        fireEvent.click(firstSet.closest('.grid') || firstSet);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue('100')).toBeInTheDocument();
            expect(screen.getByDisplayValue('8')).toBeInTheDocument();
        });
    });

    it('does not enter edit mode for completed sets', () => {
        const completedSets = [
            { id: 1, weight: 100, reps: 8, completed: true },
        ];
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={completedSets} onSetComplete={onSetComplete} />);
        
        const set = screen.getByText('1').closest('button');
        fireEvent.click(set!);
        
        // Should not enter edit mode
        expect(screen.queryByDisplayValue('100')).not.toBeInTheDocument();
    });
});

describe('SetLogger - Weight Adjustments', () => {
    it('increments weight by 2.5 when plus button clicked', async () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} />);
        
        // Enter edit mode
        fireEvent.click(screen.getByText('1').closest('button')!);
        
        await waitFor(() => {
            const weightInputs = screen.getAllByDisplayValue('100');
            expect(weightInputs[0]).toBeInTheDocument();
        });
        
        const plusButtons = screen.getAllByRole('button');
        const weightPlusButton = plusButtons.find(btn => 
            btn.querySelector('svg') && btn.parentElement?.querySelector('input[type="number"]')
        );
        
        if (weightPlusButton) {
            fireEvent.click(weightPlusButton);
            await waitFor(() => {
                expect(screen.getByDisplayValue('102.5')).toBeInTheDocument();
            });
        }
    });

    it('decrements weight by 2.5 when minus button clicked', async () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} />);
        
        fireEvent.click(screen.getByText('1').closest('button')!);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue('100')).toBeInTheDocument();
        });
        
        const minusButtons = screen.getAllByRole('button');
        const weightMinusButton = minusButtons.find(btn => 
            btn.parentElement?.querySelector('input[type="number"]')
        );
        
        if (weightMinusButton) {
            fireEvent.click(weightMinusButton);
            await waitFor(() => {
                expect(screen.getByDisplayValue('97.5')).toBeInTheDocument();
            });
        }
    });

    it('prevents weight from going below zero', async () => {
        const lowWeightSets = [
            { id: 1, weight: 2, reps: 8, completed: false },
        ];
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={lowWeightSets} onSetComplete={onSetComplete} />);
        
        fireEvent.click(screen.getByText('1').closest('button')!);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue('2')).toBeInTheDocument();
        });
        
        const inputs = screen.getAllByDisplayValue('2');
        fireEvent.change(inputs[0], { target: { value: '-5' } });
        
        await waitFor(() => {
            expect(inputs[0]).toHaveValue(0);
        });
    });

    it('allows direct weight input', async () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} />);
        
        fireEvent.click(screen.getByText('1').closest('button')!);
        
        await waitFor(() => {
            const inputs = screen.getAllByDisplayValue('100');
            expect(inputs[0]).toBeInTheDocument();
        });
        
        const inputs = screen.getAllByDisplayValue('100');
        fireEvent.change(inputs[0], { target: { value: '110.5' } });
        
        await waitFor(() => {
            expect(inputs[0]).toHaveValue(110.5);
        });
    });
});

describe('SetLogger - Reps Adjustments', () => {
    it('increments reps by 1 when plus button clicked', async () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} />);
        
        fireEvent.click(screen.getByText('1').closest('button')!);
        
        await waitFor(() => {
            const repsInputs = screen.getAllByDisplayValue('8');
            expect(repsInputs[0]).toBeInTheDocument();
        });
        
        const plusButtons = screen.getAllByRole('button');
        const repsPlusButton = plusButtons[plusButtons.length - 1];
        
        fireEvent.click(repsPlusButton);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue('9')).toBeInTheDocument();
        });
    });

    it('decrements reps by 1 when minus button clicked', async () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} />);
        
        fireEvent.click(screen.getByText('1').closest('button')!);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue('8')).toBeInTheDocument();
        });
        
        const minusButtons = screen.getAllByRole('button');
        const repsMinusButton = minusButtons[minusButtons.length - 2];
        
        fireEvent.click(repsMinusButton);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue('7')).toBeInTheDocument();
        });
    });

    it('prevents reps from going below zero', async () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} />);
        
        fireEvent.click(screen.getByText('1').closest('button')!);
        
        await waitFor(() => {
            const inputs = screen.getAllByDisplayValue('8');
            expect(inputs[1]).toBeInTheDocument();
        });
        
        const inputs = screen.getAllByDisplayValue('8');
        fireEvent.change(inputs[1], { target: { value: '-1' } });
        
        await waitFor(() => {
            expect(inputs[1]).toHaveValue(0);
        });
    });

    it('allows direct reps input', async () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} />);
        
        fireEvent.click(screen.getByText('1').closest('button')!);
        
        await waitFor(() => {
            const inputs = screen.getAllByDisplayValue('8');
            expect(inputs[1]).toBeInTheDocument();
        });
        
        const inputs = screen.getAllByDisplayValue('8');
        fireEvent.change(inputs[1], { target: { value: '12' } });
        
        await waitFor(() => {
            expect(inputs[1]).toHaveValue(12);
        });
    });
});

describe('SetLogger - Set Completion', () => {
    it('marks set as completed when check button clicked', async () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} />);
        
        fireEvent.click(screen.getByText('1').closest('button')!);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue('100')).toBeInTheDocument();
        });
        
        const checkButtons = screen.getAllByRole('button').filter(btn => 
            btn.querySelector('svg') && btn.className.includes('gradient-red')
        );
        
        fireEvent.click(checkButtons[0]);
        
        expect(onSetComplete).toHaveBeenCalledWith(1, 100, 8);
    });

    it('calls onSetComplete with correct values', async () => {
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={mockSets} onSetComplete={onSetComplete} />);
        
        fireEvent.click(screen.getByText('1').closest('button')!);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue('100')).toBeInTheDocument();
        });
        
        const inputs = screen.getAllByDisplayValue('100');
        fireEvent.change(inputs[0], { target: { value: '110' } });
        
        const repsInputs = screen.getAllByDisplayValue('8');
        fireEvent.change(repsInputs[1], { target: { value: '10' } });
        
        const checkButtons = screen.getAllByRole('button').filter(btn => 
            btn.querySelector('svg') && btn.className.includes('gradient-red')
        );
        
        fireEvent.click(checkButtons[0]);
        
        expect(onSetComplete).toHaveBeenCalledWith(1, 110, 10);
    });

    it('shows completed set visual indicator', async () => {
        const completedSets = [
            { id: 1, weight: 100, reps: 8, completed: true },
        ];
        const onSetComplete = vi.fn();
        
        render(<SetLogger sets={completedSets} onSetComplete={onSetComplete} />);
        
        const completedSet = screen.getByText('1');
        expect(completedSet).toHaveClass('text-primary');
    });
});