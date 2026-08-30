import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { BadgeDefinition, badgeTierStyle } from '../data/badgeCatalog';

interface BadgeUnlockToastProps {
  badge: BadgeDefinition;
  onDismiss: () => void;
}

export const BadgeUnlockToast: React.FC<BadgeUnlockToastProps> = ({ badge, onDismiss }) => {
  const Icon = badge.icon;
  const style = badgeTierStyle(badge.tier);

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [badge.id, onDismiss]);

  return (
    <div
      role="status"
      className="badge-toast-enter fixed right-4 bottom-4 z-100 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 flex items-start gap-3"
    >
      <div className={`w-11 h-11 rounded-xl ${style.bg} ${style.text} flex items-center justify-center shrink-0`}>
        <Icon className="w-5.5 h-5.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#1A73E8]">Badge desbloqueada!</p>
        <p className="text-sm font-bold text-gray-900 leading-tight mt-0.5">{badge.name}</p>
        <p className="text-xs text-gray-500 leading-snug mt-0.5">{badge.description}</p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Fechar notificação"
        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
