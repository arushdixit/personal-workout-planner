import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutHero from '@/components/WorkoutHero';

describe('WorkoutHero - Rendering', () => {
  it('renders greeting text', () => {
    const onStart = vi.fn();

    render(
      <WorkoutHero
        greeting="Good morning"
        workoutName="Push Day"
        exercises={5}
        estimatedTime={45}
        onStart={onStart}
      />
    );

    expect(screen.getByText('Good morning')).toBeInTheDocument();
  });

  it('displays workout name', () => {
    const onStart = vi.fn();

    render(
      <WorkoutHero
        greeting="Good morning"
        workoutName="Push Day"
        exercises={5}
        estimatedTime={45}
        onStart={onStart}
      />
    );

    expect(screen.getByText('Next: Push Day')).toBeInTheDocument();
  });

  it('shows exercise count', () => {
    const onStart = vi.fn();

    render(
      <WorkoutHero
        greeting="Good morning"
        workoutName="Push Day"
        exercises={5}
        estimatedTime={45}
        onStart={onStart}
      />
    );

    expect(screen.getByText(/5 exercises/i)).toBeInTheDocument();
  });

  it('displays estimated time', () => {
    const onStart = vi.fn();

    render(
      <WorkoutHero
        greeting="Good morning"
        workoutName="Push Day"
        exercises={5}
        estimatedTime={45}
        onStart={onStart}
      />
    );

    expect(screen.getByText(/~45 min/i)).toBeInTheDocument();
  });
});

describe('WorkoutHero - Start Button', () => {
  it('renders start button', () => {
    const onStart = vi.fn();

    render(
      <WorkoutHero
        greeting="Good morning"
        workoutName="Push Day"
        exercises={5}
        estimatedTime={45}
        onStart={onStart}
      />
    );

    const startButton = screen.getByRole('button', { name: /start workout/i });
    expect(startButton).toBeInTheDocument();
  });

  it('calls onStart when start button clicked', () => {
    const onStart = vi.fn();

    render(
      <WorkoutHero
        greeting="Good morning"
        workoutName="Push Day"
        exercises={5}
        estimatedTime={45}
        onStart={onStart}
      />
    );

    const startButton = screen.getByRole('button', { name: /start workout/i });
    fireEvent.click(startButton);

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

describe('WorkoutHero - Visual Design', () => {
  it('renders with gradient background', () => {
    const onStart = vi.fn();
    const { container } = render(
      <WorkoutHero
        greeting="Good morning"
        workoutName="Push Day"
        exercises={5}
        estimatedTime={45}
        onStart={onStart}
      />
    );

    const heroSection = container.querySelector('.gradient-red');
    expect(heroSection).toBeInTheDocument();
  });

  it('displays icons for stats', () => {
    const onStart = vi.fn();

    render(
      <WorkoutHero
        greeting="Good morning"
        workoutName="Push Day"
        exercises={5}
        estimatedTime={45}
        onStart={onStart}
      />
    );

    const { container } = render(
      <WorkoutHero
        greeting="Good morning"
        workoutName="Push Day"
        exercises={5}
        estimatedTime={45}
        onStart={onStart}
      />
    );

    const flameIcon = container.querySelector('svg[aria-label*="Number"]');
    expect(flameIcon).toBeInTheDocument();

    const clockIcon = container.querySelector('svg[aria-label*="Estimated"]');
    expect(clockIcon).toBeInTheDocument();
  });
});

describe('WorkoutHero - Edge Cases', () => {
  it('handles single exercise', () => {
    const onStart = vi.fn();

    render(
      <WorkoutHero
        greeting="Good morning"
        workoutName="Push Day"
        exercises={1}
        estimatedTime={15}
        onStart={onStart}
      />
    );

    expect(screen.getByText(/1 exercise/i)).toBeInTheDocument();
  });

  it('handles large number of exercises', () => {
    const onStart = vi.fn();

    render(
      <WorkoutHero
        greeting="Good morning"
        workoutName="Push Day"
        exercises={12}
        estimatedTime={90}
        onStart={onStart}
      />
    );

    expect(screen.getByText(/12 exercises/i)).toBeInTheDocument();
  });

  it('handles empty workout name', () => {
    const onStart = vi.fn();

    render(
      <WorkoutHero
        greeting="Good morning"
        workoutName=""
        exercises={5}
        estimatedTime={45}
        onStart={onStart}
      />
    );

    expect(screen.getByText('Next:')).toBeInTheDocument();
  });
});
