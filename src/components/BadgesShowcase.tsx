import React, { useMemo, useState } from 'react';
import { Lock, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { Certificate, PromptItem, GeminiPost, UserBadge } from '../types';
import { BADGE_CATALOG, badgeTierStyle, computeBadgeStats } from '../data/badgeCatalog';

interface BadgesShowcaseProps {
  certificates: Certificate[];
  prompts: PromptItem[];
  posts: GeminiPost[];
  userBadges: UserBadge[];
}

function formatDateBR(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const BadgesShowcase: React.FC<BadgesShowcaseProps> = ({
  certificates,
  prompts,
  posts,
  userBadges,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const stats = useMemo(
    () => computeBadgeStats(certificates, prompts, posts),
    [certificates, prompts, posts]
  );

  const unlockedMap = useMemo(() => {
    const map = new Map<string, string>();
    userBadges.forEach((b) => map.set(b.badgeId, b.unlockedAt));
    return map;
  }, [userBadges]);

  const unlockedIds = useMemo(() => new Set(unlockedMap.keys()), [unlockedMap]);

  const cards = useMemo(() => {
    return BADGE_CATALOG.map((badge) => {
      const unlockedAt = unlockedMap.get(badge.id);
      const isUnlocked = !!unlockedAt;

      let progressPct = isUnlocked ? 1 : 0;
      if (!isUnlocked) {
        if (badge.id === 'all_star') {
          const target = BADGE_CATALOG.length - 1;
          progressPct = target > 0 ? unlockedIds.size / target : 0;
        } else if (badge.progress) {
          const { current, target } = badge.progress(stats);
          progressPct = target > 0 ? Math.min(current, target) / target : 0;
        }
      }

      return { badge, isUnlocked, unlockedAt, progressPct };
    }).sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
      if (a.isUnlocked) return (b.unlockedAt || '').localeCompare(a.unlockedAt || '');
      return b.progressPct - a.progressPct;
    });
  }, [unlockedMap, unlockedIds, stats]);

  const unlockedCount = unlockedMap.size;
  const totalCount = BADGE_CATALOG.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
      <button
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FBBC04]/15 text-[#9E5D00] flex items-center justify-center shrink-0">
            <Trophy className="w-4.5 h-4.5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-900">Badges</h3>
            <p className="text-[11px] text-gray-500 font-medium">
              {unlockedCount} de {totalCount} desbloqueadas
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {cards.map(({ badge, isUnlocked, unlockedAt, progressPct }) => {
            const Icon = badge.icon;
            const style = badgeTierStyle(badge.tier);

            return (
              <div
                key={badge.id}
                title={isUnlocked ? badge.description : badge.hint}
                className={`relative flex flex-col items-center text-center gap-1.5 p-3 rounded-xl border transition-all ${
                  isUnlocked
                    ? `${style.bg} border-transparent ring-1 ${style.ring}`
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div
                  className={`relative w-11 h-11 rounded-full flex items-center justify-center ${
                    isUnlocked ? 'bg-white/70' : 'bg-gray-200/70'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isUnlocked ? style.text : 'text-gray-400'}`} />
                  {!isUnlocked && (
                    <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-gray-400 text-white flex items-center justify-center">
                      <Lock className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                <p className={`text-[11px] font-bold leading-tight ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {badge.name}
                </p>

                {isUnlocked ? (
                  <p className="text-[10px] text-gray-500 font-medium">{formatDateBR(unlockedAt!)}</p>
                ) : (
                  <>
                    <p className="text-[10px] text-gray-400 font-medium leading-tight">{badge.hint}</p>
                    <div className="w-full h-1 rounded-full bg-gray-200 overflow-hidden mt-0.5">
                      <div
                        className="h-full bg-[#1A73E8]/60 rounded-full transition-all"
                        style={{ width: `${Math.round(progressPct * 100)}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
