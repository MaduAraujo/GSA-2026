import React from 'react';
import { Award, Sparkles, FileText, Clock, Trophy, ChevronRight } from 'lucide-react';
import { Certificate, PromptItem, GeminiPost, AmbassadorProfile } from '../types';

interface StatsBannerProps {
  certificates: Certificate[];
  prompts: PromptItem[];
  posts: GeminiPost[];
  profile: AmbassadorProfile;
  onNavigate: (tab: 'certificates' | 'prompts' | 'posts' | 'copilot') => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  certificates,
  prompts,
  posts,
  profile,
  onNavigate,
}) => {
  const totalHours = certificates.reduce((acc, c) => acc + (c.hours || 0), 0);
  const favoritePrompts = prompts.filter((p) => p.isFavorite).length;
  const publishedPosts = posts.filter((p) => p.status === 'Publicado').length;

  return (
    <div className="mb-6">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E8EAED] p-6 sm:p-8">
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          {/* Welcome Text */}
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20 mb-8">
              <Trophy className="w-3.5 h-3.5 text-[#FBBC04]" />
              <span>Programa Oficial • Embaixadores Google 2026</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] tracking-tight">
              Olá, {profile.name}
            </h1>
            
            <p className="text-sm sm:text-base text-[#5F6368] leading-relaxed">
              Seja bem vindo(a) ao seu hub central do programa <strong className="text-[#202124] font-semibold">Embaixadores Estudantis do Google 2026</strong>.
            </p>
          </div>
        </div>

        {/* 4-Stat Metric Cards Grid */}
        <div className="mt-8 pt-6 border-t border-[#E8EAED] grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* 1. Certificados */}
          <div 
            onClick={() => onNavigate('certificates')}
            className="group cursor-pointer p-4 rounded-xl bg-[#F8F9FA] hover:bg-[#1A73E8]/5 border border-[#E8EAED] hover:border-[#1A73E8]/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">Certificados</span>
              <div className="w-8 h-8 rounded-lg bg-[#1A73E8]/10 flex items-center justify-center text-[#1A73E8] group-hover:scale-105 transition-transform">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#202124]">{certificates.length}</span>
              <span className="text-xs text-[#5F6368] font-medium">conquistados</span>
            </div>
          </div>

          {/* 2. Horas de Capacitação */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E8EAED]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">Horas de Estudo</span>
              <div className="w-8 h-8 rounded-lg bg-[#34A853]/10 flex items-center justify-center text-[#34A853]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#202124]">{totalHours}h</span>
              <span className="text-xs text-[#5F6368] font-medium">acumuladas</span>
            </div>
          </div>

          {/* 3. Prompts Salvos */}
          <div 
            onClick={() => onNavigate('prompts')}
            className="group cursor-pointer p-4 rounded-xl bg-[#F8F9FA] hover:bg-[#FBBC04]/10 border border-[#E8EAED] hover:border-[#FBBC04]/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">Prompts</span>
              <div className="w-8 h-8 rounded-lg bg-[#FBBC04]/15 flex items-center justify-center text-[#B06000] group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#202124]">{prompts.length}</span>
              <span className="text-xs text-[#5F6368] font-medium">por seção</span>
            </div>
          </div>

          {/* 4. Posts Gemini */}
          <div 
            onClick={() => onNavigate('posts')}
            className="group cursor-pointer p-4 rounded-xl bg-[#F8F9FA] hover:bg-[#EA4335]/10 border border-[#E8EAED] hover:border-[#EA4335]/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">Posts Criados</span>
              <div className="w-8 h-8 rounded-lg bg-[#EA4335]/10 flex items-center justify-center text-[#EA4335] group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#202124]">{posts.length}</span>
              <span className="text-xs text-[#1E8E3E] font-medium">{publishedPosts} pub.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
