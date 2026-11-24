import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { BottomNav } from './BottomNav';

function renderNav(activeTab: Parameters<typeof BottomNav>[0]['activeTab'], onOpenMore = vi.fn()) {
  return render(
    <MemoryRouter>
      <BottomNav activeTab={activeTab} isMoreOpen={false} onOpenMore={onOpenMore} />
    </MemoryRouter>,
  );
}

describe('BottomNav', () => {
  it('marks the current tab and opens the full menu from "Mais"', async () => {
    const onOpenMore = vi.fn();
    renderNav('posts', onOpenMore);
    expect(screen.getByRole('link', { name: 'Posts' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Certificados' })).not.toHaveAttribute('aria-current');
    await userEvent.click(screen.getByRole('button', { name: 'Mais' }));
    expect(onOpenMore).toHaveBeenCalledOnce();
  });

  it('reserves space for itself while mounted so toasts sit above it', () => {
    const { unmount } = renderNav('certificates');
    expect(document.documentElement.style.getPropertyValue('--bottom-nav-offset')).not.toBe('');
    unmount();
    expect(document.documentElement.style.getPropertyValue('--bottom-nav-offset')).toBe('');
  });
});
