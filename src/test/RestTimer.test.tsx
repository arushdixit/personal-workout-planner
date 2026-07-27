import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import RestTimer from '@/components/RestTimer';

describe('RestTimer - Timer Functionality', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders with initial duration', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={90} onComplete={onComplete} onSkip={onSkip} />);
    });

    expect(screen.getByText(/Rest Period/i)).toBeInTheDocument();
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('counts down from initial duration', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={90} onComplete={onComplete} onSkip={onSkip} />);
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('1:25')).toBeInTheDocument();
  });

  it('calls onComplete when timer reaches zero', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={5} onComplete={onComplete} onSkip={onSkip} />);
    });

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(onComplete).toHaveBeenCalled();
  });

  it('displays minutes and seconds correctly', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={150} onComplete={onComplete} onSkip={onSkip} />);
    });

    expect(screen.getByText('2:30')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });
});

describe('RestTimer - Skip Functionality', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('calls onSkip when skip button is clicked', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={90} onComplete={onComplete} onSkip={onSkip} />);
    });

    const skipButton = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipButton);

    expect(onSkip).toHaveBeenCalled();
  });
});

describe('RestTimer - Time Adjustments', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('decrements time by 10 seconds when minus button clicked', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={90} onComplete={onComplete} onSkip={onSkip} />);
    });

    const buttons = screen.getAllByRole('button');
    const minusButton = buttons.find(b => b.textContent?.includes('10s'));
    if (minusButton) fireEvent.click(minusButton);

    expect(screen.getByText('1:20')).toBeInTheDocument();
  });

  it('increments time by 10 seconds when plus button clicked', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={90} onComplete={onComplete} onSkip={onSkip} />);
    });

    const buttons = screen.getAllByRole('button');
    const plusButton = buttons[buttons.length - 1];
    fireEvent.click(plusButton);

    expect(screen.getByText('1:40')).toBeInTheDocument();
  });

  it('prevents time from going below zero', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={5} onComplete={onComplete} onSkip={onSkip} />);
    });

    const buttons = screen.getAllByRole('button');
    const minusButton = buttons.find(b => b.textContent?.includes('10s'));
    if (minusButton) {
      fireEvent.click(minusButton);
    }

    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('updates current duration when adjusting', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={90} onComplete={onComplete} onSkip={onSkip} />);
    });

    const buttons = screen.getAllByRole('button');
    const plusButton = buttons[buttons.length - 1];
    fireEvent.click(plusButton);

    act(() => {
      vi.advanceTimersByTime(95000);
    });

    expect(screen.getByText('0:05')).toBeInTheDocument();
  });
});

describe('RestTimer - Progress Display', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('shows circular progress animation', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={90} onComplete={onComplete} onSkip={onSkip} />);
    });

    const progressSvg = document.querySelector('svg[role="img"]');
    expect(progressSvg).toBeInTheDocument();
  });

  it('updates progress as time decreases', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={90} onComplete={onComplete} onSkip={onSkip} />);
    });

    const circles = document.querySelectorAll('circle');
    const initialOffset = circles[1]?.getAttribute('stroke-dashoffset');
    act(() => {
      vi.advanceTimersByTime(45000);
    });
    const updatedOffset = circles[1]?.getAttribute('stroke-dashoffset');
    expect(updatedOffset).not.toBe(initialOffset);
  });
});

describe('RestTimer - Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('handles zero duration gracefully', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={0} onComplete={onComplete} onSkip={onSkip} />);
    });

    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('handles very short durations', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={5} onComplete={onComplete} onSkip={onSkip} />);
    });

    expect(screen.getByText('0:05')).toBeInTheDocument();
  });

  it('handles very long durations', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={600} onComplete={onComplete} onSkip={onSkip} />);
    });

    expect(screen.getByText('10:00')).toBeInTheDocument();
  });
});
