import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatsBanner } from './StatsBanner';
import { makeCertificate, makeChallenge, makePost, makeProfile, makeSession } from '../test/factories';

describe('StatsBanner', () => {
  it('greets the ambassador by name', () => {
    render(
      <StatsBanner
        certificates={[]}
        prompts={[]}
        posts={[]}
        challenges={[]}
        sessions={[]}
        profile={makeProfile({ name: 'Ana' })}
        onNavigate={() => {}}
      />
    );
    expect(screen.getByText('Olá, Ana')).toBeInTheDocument();
  });

  it('counts only published posts, not every post', () => {
    render(
      <StatsBanner
        certificates={[]}
        prompts={[]}
        posts={[makePost({ status: 'Publicado' }), makePost({ id: 'post-2', status: 'Rascunho' })]}
        challenges={[]}
        sessions={[]}
        profile={makeProfile()}
        onNavigate={() => {}}
      />
    );
    const postsCard = screen.getByText('Posts Criados').closest('div[class*="cursor-pointer"]');
    expect(postsCard).toHaveTextContent('1');
  });

  it('sums score across posts, challenges and sessions', () => {
    render(
      <StatsBanner
        certificates={[]}
        prompts={[]}
        posts={[makePost({ score: 10 })]}
        challenges={[makeChallenge({ points: 5 })]}
        sessions={[makeSession({ score: 7 })]}
        profile={makeProfile()}
        onNavigate={() => {}}
      />
    );
    expect(screen.getByText('22')).toBeInTheDocument();
  });

  it('calls onNavigate with the correct tab when a stat card is clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <StatsBanner
        certificates={[makeCertificate()]}
        prompts={[]}
        posts={[]}
        challenges={[]}
        sessions={[]}
        profile={makeProfile()}
        onNavigate={onNavigate}
      />
    );
    await user.click(screen.getByText('Certificados'));
    expect(onNavigate).toHaveBeenCalledWith('certificates');
  });
});
