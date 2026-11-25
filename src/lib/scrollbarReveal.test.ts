import { fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installScrollbarReveal } from './scrollbarReveal';

describe('installScrollbarReveal', () => {
  let uninstall: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    uninstall = installScrollbarReveal();
  });

  afterEach(() => {
    uninstall();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('shows the scrollbar while the row scrolls and hides it shortly after', () => {
    const row = document.createElement('div');
    row.className = 'scrollbar-reveal';
    document.body.appendChild(row);

    fireEvent.scroll(row);
    expect(row).toHaveClass('is-scrolling');

    vi.advanceTimersByTime(500);
    fireEvent.scroll(row);
    vi.advanceTimersByTime(500);
    expect(row).toHaveClass('is-scrolling');

    vi.advanceTimersByTime(500);
    expect(row).not.toHaveClass('is-scrolling');
  });

  it('ignores elements without the scrollbar-reveal class', () => {
    const other = document.createElement('div');
    document.body.appendChild(other);
    fireEvent.scroll(other);
    expect(other).not.toHaveClass('is-scrolling');
  });
});
