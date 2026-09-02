import React from 'react';
import { Award, Sparkles, FileText, Clock, Trophy, Star, ChevronRight } from 'lucide-react';
import { Certificate, PromptItem, GeminiPost, Challenge, AmbassadorSession, AmbassadorProfile } from '../types';
import { formatTotalHoursDecimal, sumCertHours } from '../utils/duration';

interface StatsBannerProps {
  certificates: Certificate[];
  prompts: PromptItem[];
  posts: GeminiPost[];
  challenges: Challenge[];
  sessions: AmbassadorSession[];
  profile: AmbassadorProfile;
  onNavigate: (tab: 'certificates' | 'prompts' | 'posts') => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  certificates,
  prompts,
  posts,
  challenges,
  sessions,
  profile,
  onNavigate,
}) => {
  const totalHoursLabel = formatTotalHoursDecimal(sumCertHours(certificates));
  const favoritePrompts = prompts.filter((p) => p.isFavorite).length;
  const publishedPosts = posts.filter((p) => p.status === 'Publicado').length;
  const totalScore =
    posts.reduce((sum, p) => sum + (p.score || 0), 0) +
    challenges.reduce((sum, c) => sum + (c.points || 0), 0) +
    sessions.reduce((sum, s) => sum + (s.score || 0), 0);

  return (
    <div className="mb-6">
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/10 text-blue-600 border border-blue-600/20 mb-8">
              <Trophy className="w-3.5 h-3.5 text-[#FBBC04]" />
              <span>Programa Oficial</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Olá, {profile.name}
            </h1>
            
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Seja bem vindo(a) ao seu hub central do programa <strong className="text-gray-900 font-semibold">Embaixadores Estudantis do Google 2026</strong>.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div 
            onClick={() => onNavigate('certificates')}
            className="group cursor-pointer p-4 rounded-xl bg-gray-50 hover:bg-blue-600/5 border border-gray-200 hover:border-blue-600/30 transition-all"
          >
            <div className="flex items-center justify-center sm:justify-start gap-0 sm:gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1A73E8]/10 flex items-center justify-center text-[#1A73E8] group-hover:scale-105 transition-transform">
                <Award className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-gray-600 uppercase tracking-wider">Certificados</span>
            </div>
            <div className="mt-2 flex items-baseline justify-center gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">{certificates.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-center sm:justify-start gap-0 sm:gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-600/10 flex items-center justify-center text-green-600">
                <Clock className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-gray-600 uppercase tracking-wider">Horas de Estudo</span>
            </div>
            <div className="mt-2 flex items-baseline justify-center gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">{totalHoursLabel}</span>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('prompts')}
            className="group cursor-pointer p-4 rounded-xl bg-gray-50 hover:bg-amber-400/10 border border-gray-200 hover:border-amber-400/40 transition-all"
          >
            <div className="flex items-center justify-center sm:justify-start gap-0 sm:gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-gray-600 uppercase tracking-wider">Prompts</span>
            </div>
            <div className="mt-2 flex items-baseline justify-center gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">{prompts.length}</span>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('posts')}
            className="group cursor-pointer p-4 rounded-xl bg-gray-50 hover:bg-red-600/10 border border-gray-200 hover:border-red-600/30 transition-all"
          >
            <div className="flex items-center justify-center sm:justify-start gap-0 sm:gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center text-red-600 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-gray-600 uppercase tracking-wider">Posts Criados</span>
            </div>
            <div className="mt-2 flex items-baseline justify-center gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">{publishedPosts}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-center sm:justify-start gap-0 sm:gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center text-purple-600">
                <Star className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-gray-600 uppercase tracking-wider">Pontuação</span>
            </div>
            <div className="mt-2 flex items-baseline justify-center gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">{totalScore}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};