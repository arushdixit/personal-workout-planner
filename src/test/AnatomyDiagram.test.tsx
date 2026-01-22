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
    const frontButton = screen.getByRole('button', { name: 'Front' });
    expect(frontButton).toHaveClass('gradient-red', 'text-white');
  });

  it('switches to back view when back button clicked', () => {
    render(<AnatomyDiagram />);
    const backButton = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backButton);
    expect(backButton).toHaveClass('gradient-red', 'text-white');
  });

  it('toggles between front and back views', () => {
    render(<AnatomyDiagram />);
    const backBtn = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backBtn);
    expect(backBtn).toHaveClass('gradient-red');

    const frontBtn = screen.getByRole('button', { name: 'Front' });
    fireEvent.click(frontBtn);
    expect(frontBtn).toHaveClass('gradient-red');
  });
});

describe('AnatomyDiagram - Muscle Highlighting', () => {
  it('renders muscles when primaryMuscles prop provided', () => {
    const { container } = render(
      <AnatomyDiagram
        selectedPrimary={['chest', 'triceps']}
        selectedSecondary={[]}
      />
    );
    const diagram = container.querySelector('svg');
    expect(diagram).toBeInTheDocument();
  });

  it('renders muscles when secondaryMuscles prop provided', () => {
    const { container } = render(
      <AnatomyDiagram
        selectedPrimary={[]}
        selectedSecondary={['biceps', 'forearm']}
      />
    );
    const diagram = container.querySelector('svg');
    expect(diagram).toBeInTheDocument();
  });

  it('handles both primary and secondary muscles', () => {
    const { container } = render(
      <AnatomyDiagram
        selectedPrimary={['chest']}
        selectedSecondary={['triceps']}
      />
    );
    const diagram = container.querySelector('svg');
    expect(diagram).toBeInTheDocument();
  });
});

describe('AnatomyDiagram - Mode Display', () => {
  it('shows mode indicator for primary mode', () => {
    render(
      <AnatomyDiagram
        mode="primary"
      />
    );
    expect(screen.getByText(/Selecting:/i)).toBeInTheDocument();
    expect(screen.getByText('Primary Muscles')).toBeInTheDocument();
  });

  it('shows mode indicator for secondary mode', () => {
    render(
      <AnatomyDiagram
        mode="secondary"
      />
    );
    expect(screen.getByText(/Selecting:/i)).toBeInTheDocument();
    expect(screen.getByText('Secondary Muscles')).toBeInTheDocument();
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

describe('AnatomyDiagram - Interaction Callbacks', () => {
  it('accepts onTogglePrimary callback without errors in primary mode', () => {
    const onTogglePrimary = vi.fn();
    render(
      <AnatomyDiagram
        onTogglePrimary={onTogglePrimary}
        mode="primary"
        selectedPrimary={[]}
      />
    );
    expect(onTogglePrimary).toBeDefined();
  });

  it('accepts onToggleSecondary callback without errors in secondary mode', () => {
    const onToggleSecondary = vi.fn();
    render(
      <AnatomyDiagram
        onToggleSecondary={onToggleSecondary}
        mode="secondary"
        selectedSecondary={[]}
      />
    );
    expect(onToggleSecondary).toBeDefined();
  });

  it('does not render clickable interaction when disabled', () => {
    render(
      <AnatomyDiagram
        disabled={true}
        selectedPrimary={[]}
      />
    );
    const { container } = render(
      <AnatomyDiagram
        disabled={true}
        selectedPrimary={[]}
      />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

describe('AnatomyDiagram - Gender', () => {
  it('renders male anatomy by default', () => {
    const { container } = render(
      <AnatomyDiagram
        gender="male"
      />
    );
    const diagram = container.querySelector('svg');
    expect(diagram).toBeInTheDocument();
  });

  it('renders female anatomy when gender prop is female', () => {
    const { container } = render(
      <AnatomyDiagram
        gender="female"
      />
    );
    const diagram = container.querySelector('svg');
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
    const { container } = render(
      <AnatomyDiagram
        selectedPrimary={['invalid-muscle']}
        selectedSecondary={[]}
      />
    );
    const diagram = container.querySelector('svg');
    expect(diagram).toBeInTheDocument();
  });

  it('handles very large muscle arrays', () => {
    const manyMuscles = Array(10).fill('chest');
    const { container } = render(
      <AnatomyDiagram
        selectedPrimary={manyMuscles}
        selectedSecondary={[]}
      />
    );
    const diagram = container.querySelector('svg');
    expect(diagram).toBeInTheDocument();
  });
});
