import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatsBanner } from './StatsBanner';
import { makeChallenge, makePost, makeProfile, makeSession } from '../test/factories';

const renderBanner = (props: Partial<React.ComponentProps<typeof StatsBanner>> = {}) =>
  render(
    <StatsBanner
      prompts={[]}
      posts={[]}
      challenges={[]}
      sessions={[]}
      profile={makeProfile()}
      onNavigate={() => {}}
      {...props}
    />,
  );

describe('StatsBanner', () => {
  it('greets the ambassador by name', () => {
    renderBanner({ profile: makeProfile({ name: 'Ana' }) });
    expect(screen.getByText('Olá, Ana')).toBeInTheDocument();
  });

  it('counts only published posts, not every post', () => {
    renderBanner({ posts: [makePost({ status: 'Publicado' }), makePost({ id: 'post-2', status: 'Rascunho' })] });
    expect(screen.getByRole('button', { name: 'Posts publicados: 1' })).toBeInTheDocument();
  });

  it('sums score across posts, challenges and sessions', () => {
    renderBanner({
      posts: [makePost({ score: 10 })],
      challenges: [makeChallenge({ points: 5 })],
      sessions: [makeSession({ score: 7 })],
    });
    expect(screen.getByRole('button', { name: 'Pontos: 22' })).toBeInTheDocument();
  });

  it('calls onNavigate with the correct tab when a stat is clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderBanner({ onNavigate });
    await user.click(screen.getByRole('button', { name: /^Prompts/ }));
    expect(onNavigate).toHaveBeenCalledWith('prompts');
    await user.click(screen.getByRole('button', { name: /^Pontos/ }));
    expect(onNavigate).toHaveBeenCalledWith('weeklyScore');
  });
});
