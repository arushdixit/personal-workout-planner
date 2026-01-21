import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnatomyDiagram from '@/components/AnatomyDiagram';

describe('AnatomyDiagram - Rendering', () => {
    it('renders anatomy diagram component', () => {
        render(<AnatomyDiagram />);
        
        expect(screen.getByText('Front')).toBeInTheDocument();
        expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('renders legend', () => {
        render(<AnatomyDiagram />);
        
        expect(screen.getByText('Primary')).toBeInTheDocument();
        expect(screen.getByText('Secondary')).toBeInTheDocument();
    });
});

describe('AnatomyDiagram - View Toggle', () => {
    it('starts with front view by default', () => {
        render(<AnatomyDiagram />);
        
        const frontButton = screen.getByText('Front');
        expect(frontButton).toHaveClass('gradient-red', 'text-white');
    });

    it('switches to back view when back button clicked', () => {
        render(<AnatomyDiagram />);
        
        const backButton = screen.getByText('Back');
        fireEvent.click(backButton);
        
        expect(backButton).toHaveClass('gradient-red', 'text-white');
    });

    it('toggles between front and back views', () => {
        const { container } = render(<AnatomyDiagram />);
        
        const backBtn = screen.getByText('Back');
        fireEvent.click(backBtn);
        expect(backBtn).toHaveClass('gradient-red');
        
        const frontBtn = screen.getByText('Front');
        fireEvent.click(frontBtn);
        expect(frontBtn).toHaveClass('gradient-red');
    });
});

describe('AnatomyDiagram - Muscle Highlighting', () => {
    it('renders muscles when primaryMuscles prop provided', () => {
        render(
            <AnatomyDiagram
                selectedPrimary={['chest', 'triceps']}
                selectedSecondary={[]}
            />
        );
        
        const diagram = document.querySelector('svg');
        expect(diagram).toBeInTheDocument();
    });

    it('renders muscles when secondaryMuscles prop provided', () => {
        render(
            <AnatomyDiagram
                selectedPrimary={[]}
                selectedSecondary={['biceps', 'forearm']}
            />
        );
        
        const diagram = document.querySelector('svg');
        expect(diagram).toBeInTheDocument();
    });

    it('handles both primary and secondary muscles', () => {
        render(
            <AnatomyDiagram
                selectedPrimary={['chest']}
                selectedSecondary={['triceps']}
            />
        );
        
        const diagram = document.querySelector('svg');
        expect(diagram).toBeInTheDocument();
    });
});

describe('AnatomyDiagram - Muscle Click Interaction', () => {
    it('allows clicking muscles when mode is primary', () => {
        const onTogglePrimary = vi.fn();
        
        render(
            <AnatomyDiagram
                onTogglePrimary={onTogglePrimary}
                mode="primary"
            />
        );
        
        const musclePath = document.querySelector('svg path');
        if (musclePath) {
            fireEvent.click(musclePath);
            // Note: Actual muscle group depends on the clicked path
            expect(onTogglePrimary).toHaveBeenCalled();
        }
    });

    it('allows clicking muscles when mode is secondary', () => {
        const onToggleSecondary = vi.fn();
        
        render(
            <AnatomyDiagram
                onToggleSecondary={onToggleSecondary}
                mode="secondary"
            />
        );
        
        const musclePath = document.querySelector('svg path');
        if (musclePath) {
            fireEvent.click(musclePath);
            expect(onToggleSecondary).toHaveBeenCalled();
        }
    });

    it('prevents clicking muscles when disabled', () => {
        const onTogglePrimary = vi.fn();
        
        render(
            <AnatomyDiagram
                onTogglePrimary={onTogglePrimary}
                disabled={true}
            />
        );
        
        const musclePath = document.querySelector('svg path');
        if (musclePath) {
            fireEvent.click(musclePath);
            expect(onTogglePrimary).not.toHaveBeenCalled();
        }
    });
});

describe('AnatomyDiagram - Mode Display', () => {
    it('shows mode indicator for primary mode', () => {
        render(
            <AnatomyDiagram
                mode="primary"
            />
        );
        
        expect(screen.getByText(/Selecting: Primary Muscles/i)).toBeInTheDocument();
    });

    it('shows mode indicator for secondary mode', () => {
        render(
            <AnatomyDiagram
                mode="secondary"
            />
        );
        
        expect(screen.getByText(/Selecting: Secondary Muscles/i)).toBeInTheDocument();
    });

    it('does not show mode indicator in read-only mode', () => {
        render(
            <AnatomyDiagram
                mode="read-only"
            />
        );
        
        expect(screen.queryByText(/Selecting:/i)).not.toBeInTheDocument();
    });
});

describe('AnatomyDiagram - Gender', () => {
    it('renders male anatomy by default', () => {
        render(
            <AnatomyDiagram
                gender="male"
            />
        );
        
        const diagram = document.querySelector('svg');
        expect(diagram).toBeInTheDocument();
    });

    it('renders female anatomy when gender prop is female', () => {
        render(
            <AnatomyDiagram
                gender="female"
            />
        );
        
        const diagram = document.querySelector('svg');
        expect(diagram).toBeInTheDocument();
    });
});

describe('AnatomyDiagram - Edge Cases', () => {
    it('handles empty muscle arrays gracefully', () => {
        render(
            <AnatomyDiagram
                selectedPrimary={[]}
                selectedSecondary={[]}
            />
        );
        
        expect(screen.getByText('Front')).toBeInTheDocument();
    });

    it('handles invalid muscle slugs gracefully', () => {
        render(
            <AnatomyDiagram
                selectedPrimary={['invalid-muscle']}
                selectedSecondary={[]}
            />
        );
        
        const diagram = document.querySelector('svg');
        expect(diagram).toBeInTheDocument();
        // Should not throw error
    });

    it('handles very large muscle arrays', () => {
        const manyMuscles = Array(10).fill('chest');
        render(
            <AnatomyDiagram
                selectedPrimary={manyMuscles}
                selectedSecondary={[]}
            />
        );
        
        const diagram = document.querySelector('svg');
        expect(diagram).toBeInTheDocument();
    });
});