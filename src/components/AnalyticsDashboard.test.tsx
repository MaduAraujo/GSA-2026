import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { makeCertificate, makeChallenge, makePost, makeSession } from '../test/factories';

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a fallback message when there are no posts', () => {
    render(<AnalyticsDashboard certificates={[]} posts={[]} sessions={[]} challenges={[]} />);
    expect(screen.getByText('Nenhum post criado ainda.')).toBeInTheDocument();
  });

  it('buckets a certificate issued this month into the current month bar', () => {
    render(
      <AnalyticsDashboard
        certificates={[makeCertificate({ issueDate: '2026-03-05' })]}
        posts={[]}
        sessions={[]}
        challenges={[]}
      />
    );
    expect(document.querySelector('[title="Mar: 1"]')).not.toBeNull();
  });

  it('counts posts by platform, most frequent first', () => {
    render(
      <AnalyticsDashboard
        certificates={[]}
        posts={[
          makePost({ id: 'p1', platform: 'LinkedIn' }),
          makePost({ id: 'p2', platform: 'LinkedIn' }),
          makePost({ id: 'p3', platform: 'Instagram' }),
        ]}
        sessions={[]}
        challenges={[]}
      />
    );
    const platformSection = screen.getByText('Posts por plataforma').closest('div');
    expect(platformSection).toHaveTextContent(/LinkedIn.*2/s);
    expect(platformSection).toHaveTextContent(/Instagram.*1/s);
  });

  it('counts posts by status', () => {
    render(
      <AnalyticsDashboard
        certificates={[]}
        posts={[makePost({ id: 'p1', status: 'Publicado' }), makePost({ id: 'p2', status: 'Rascunho' })]}
        sessions={[]}
        challenges={[]}
      />
    );
    expect(document.querySelector('[title="Publicado: 1"]')).not.toBeNull();
    expect(document.querySelector('[title="Rascunho: 1"]')).not.toBeNull();
  });

  it('sums score from posts, challenges and sessions into the same month', () => {
    render(
      <AnalyticsDashboard
        certificates={[]}
        posts={[makePost({ score: 10, createdAt: '2026-03-01T00:00:00.000Z' })]}
        sessions={[makeSession({ score: 5, date: '2026-03-02' })]}
        challenges={[makeChallenge({ points: 7, dates: ['2026-03-03'] })]}
      />
    );
    expect(document.querySelector('[title="Mar: 22"]')).not.toBeNull();
  });
});
