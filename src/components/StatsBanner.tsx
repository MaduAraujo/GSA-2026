import React from 'react';
import {
  type PromptItem,
  type SocialPost,
  type Challenge,
  type AmbassadorSession,
  type AmbassadorProfile,
} from '../types';

interface StatsBannerProps {
  prompts: PromptItem[];
  posts: SocialPost[];
  challenges: Challenge[];
  sessions: AmbassadorSession[];
  profile: AmbassadorProfile;
  onNavigate: (tab: 'prompts' | 'posts' | 'weeklyScore') => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  prompts,
  posts,
  challenges,
  sessions,
  profile,
  onNavigate,
}) => {
  const publishedPosts = posts.filter((p) => p.status === 'Publicado').length;
  const totalScore =
    posts.reduce((sum, p) => sum + (p.score || 0), 0) +
    challenges.reduce((sum, c) => sum + (c.points || 0), 0) +
    sessions.reduce((sum, s) => sum + (s.score || 0), 0);

  const stats: Array<{ tab: 'prompts' | 'posts' | 'weeklyScore'; value: number; label: string }> = [
    { tab: 'prompts', value: prompts.length, label: 'Prompts' },
    { tab: 'posts', value: publishedPosts, label: 'Posts publicados' },
    { tab: 'weeklyScore', value: totalScore, label: 'Pontos' },
  ];

  return (
    <section
      aria-label="Resumo"
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-gray-200"
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-gray-900 truncate">Olá, {profile.name}</h1>
        <p className="mt-1 text-sm text-gray-500">Embaixadores Estudantis do Google 2026</p>
      </div>

      <div className="flex items-stretch divide-x divide-gray-200 -mx-3 sm:mx-0">
        {stats.map((stat) => (
          <button
            key={stat.tab}
            type="button"
            onClick={() => onNavigate(stat.tab)}
            aria-label={`${stat.label}: ${stat.value}`}
            className="flex-1 sm:flex-none px-3 sm:px-5 text-center rounded-md hover:bg-gray-100 transition-colors"
          >
            <span className="block text-xl font-semibold text-gray-900 tabular-nums">{stat.value}</span>
            <span className="block text-xs text-gray-500 whitespace-nowrap">{stat.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
