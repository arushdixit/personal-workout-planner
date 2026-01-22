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

    expect(screen.getByText(/Rest Time/i)).toBeInTheDocument();
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

  it('calls onComplete when timer reaches zero', async () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={5} onComplete={onComplete} onSkip={onSkip} />);
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 6000 });
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

  it('stops timer after skipping', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={90} onComplete={onComplete} onSkip={onSkip} />);
    });

    const skipButton = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipButton);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText('1:30')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
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

  it('decrements time by 15 seconds when minus button clicked', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={90} onComplete={onComplete} onSkip={onSkip} />);
    });

    const minusButton = screen.getByText(/-15s/i);
    fireEvent.click(minusButton);

    expect(screen.getByText('1:15')).toBeInTheDocument();
  });

  it('increments time by 15 seconds when plus button clicked', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={90} onComplete={onComplete} onSkip={onSkip} />);
    });

    const plusButton = screen.getByText(/\+15s/i);
    fireEvent.click(plusButton);

    expect(screen.getByText('1:45')).toBeInTheDocument();
  });

  it('prevents time from going below zero', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={20} onComplete={onComplete} onSkip={onSkip} />);
    });

    const minusButtons = screen.getAllByText(/-15s/i);
    fireEvent.click(minusButtons[0]);
    fireEvent.click(minusButtons[0]);

    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('updates current duration when adjusting', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={90} onComplete={onComplete} onSkip={onSkip} />);
    });

    const plusButton = screen.getByText(/\+15s/i);
    fireEvent.click(plusButton);

    act(() => {
      vi.advanceTimersByTime(95000);
    });

    expect(screen.getByText('0:10')).toBeInTheDocument();
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

    const progressCircle = screen.getByRole('img');
    expect(progressCircle).toBeInTheDocument();
  });

  it('updates progress as time decreases', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    act(() => {
      render(<RestTimer duration={90} onComplete={onComplete} onSkip={onSkip} />);
    });

    const initialOffset = document.querySelector('circle')?.getAttribute('stroke-dashoffset');
    act(() => {
      vi.advanceTimersByTime(45000);
    });
    const updatedOffset = document.querySelector('circle')?.getAttribute('stroke-dashoffset');
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
