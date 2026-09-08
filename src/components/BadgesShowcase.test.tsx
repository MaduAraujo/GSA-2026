import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BadgesShowcase } from './BadgesShowcase';
import { BADGE_CATALOG } from '../data/badgeCatalog';

describe('BadgesShowcase', () => {
  it('shows the unlocked/total count and starts collapsed', () => {
    render(<BadgesShowcase certificates={[]} prompts={[]} posts={[]} userBadges={[]} />);
    expect(screen.getByText(`0 de ${BADGE_CATALOG.length} desbloqueadas`)).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands to show badge cards, unlocked ones listed first', async () => {
    const user = userEvent.setup();
    const unlockedBadge = BADGE_CATALOG[BADGE_CATALOG.length - 2];
    render(
      <BadgesShowcase
        certificates={[]}
        prompts={[]}
        posts={[]}
        userBadges={[{ badgeId: unlockedBadge.id, unlockedAt: '2026-01-15T00:00:00.000Z' }]}
      />
    );
    await user.click(screen.getByRole('button'));

    expect(screen.getByText(`1 de ${BADGE_CATALOG.length} desbloqueadas`)).toBeInTheDocument();
    const names = screen.getAllByText(unlockedBadge.name);
    expect(names.length).toBeGreaterThan(0);
    expect(screen.queryByText(unlockedBadge.hint)).not.toBeInTheDocument();
  });

  it('shows the hint text for a locked badge', async () => {
    const user = userEvent.setup();
    render(<BadgesShowcase certificates={[]} prompts={[]} posts={[]} userBadges={[]} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText(BADGE_CATALOG[0].hint)).toBeInTheDocument();
  });
});