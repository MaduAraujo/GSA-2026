import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BadgeUnlockToast } from './BadgeUnlockToast';
import { BADGE_CATALOG } from '../data/badgeCatalog';

const badge = BADGE_CATALOG[0];

describe('BadgeUnlockToast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the badge name and description', () => {
    render(<BadgeUnlockToast badge={badge} onDismiss={() => {}} />);
    expect(screen.getByText(badge.name)).toBeInTheDocument();
    expect(screen.getByText(badge.description)).toBeInTheDocument();
  });

  it('calls onDismiss when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<BadgeUnlockToast badge={badge} onDismiss={onDismiss} />);
    await user.click(screen.getByLabelText('Fechar notificação'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after 5 seconds', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<BadgeUnlockToast badge={badge} onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
