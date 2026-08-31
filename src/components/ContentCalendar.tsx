import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { GeminiPost } from '../types';

interface ContentCalendarProps {
  posts: GeminiPost[];
  onSelectPost: (post: GeminiPost) => void;
  onReschedulePost: (post: GeminiPost, newDate: string) => void;
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_DOT: Record<string, string> = {
  Publicado: 'bg-[#34A853]',
  Agendado: 'bg-[#1A73E8]',
  Rascunho: 'bg-[#FBBC04]',
};

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function postDateKey(post: GeminiPost): string | null {
  return post.scheduledDate || null;
}

export const ContentCalendar: React.FC<ContentCalendarProps> = ({ posts, onSelectPost, onReschedulePost }) => {
  const [cursor, setCursor] = useState(() => new Date());
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);

  const postsByDate = useMemo(() => {
    const map = new Map<string, GeminiPost[]>();
    posts.forEach((p) => {
      const key = postDateKey(p);
      if (!key) return;
      const list = map.get(key) || [];
      list.push(p);
      map.set(key, list);
    });
    return map;
  }, [posts]);

  const unscheduledPosts = useMemo(() => posts.filter((p) => !p.scheduledDate), [posts]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const gridDays = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < startOffset; i++) {
      days.push({ date: new Date(year, month, i - startOffset + 1), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (days.length % 7 !== 0) {
      const last = days[days.length - 1].date;
      days.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
    }
    return days;
  }, [year, month]);

  const todayKey = toIsoDate(new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 shadow-xs p-3">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          aria-label="Mês anterior"
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm sm:text-base font-bold text-gray-900">
          {MONTH_LABELS[month]} {year}
        </h3>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          aria-label="Próximo mês"
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAY_LABELS.map((w, i) => (
            <div key={i} className="text-center text-[11px] font-bold text-gray-400 uppercase py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {gridDays.map(({ date, inMonth }, idx) => {
            const key = toIsoDate(date);
            const dayPosts = postsByDate.get(key) || [];
            const isToday = key === todayKey;
            return (
              <div
                key={idx}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!draggedPostId) return;
                  const post = posts.find((p) => p.id === draggedPostId);
                  if (post) onReschedulePost(post, key);
                  setDraggedPostId(null);
                }}
                className={`min-h-20 sm:min-h-24 rounded-xl p-1.5 border transition-colors ${
                  inMonth ? 'bg-white border-gray-100' : 'bg-gray-50/60 border-transparent'
                } ${isToday ? 'ring-2 ring-[#1A73E8]/40' : ''}`}
              >
                <span className={`text-[11px] font-semibold ${inMonth ? 'text-gray-700' : 'text-gray-300'} ${isToday ? 'text-[#1A73E8]' : ''}`}>
                  {date.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <button
                      key={post.id}
                      draggable
                      onDragStart={() => setDraggedPostId(post.id)}
                      onClick={() => onSelectPost(post)}
                      title={post.title}
                      className="w-full flex items-center gap-1 px-1.5 py-1 rounded-md bg-gray-50 hover:bg-gray-100 text-left transition-colors"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[post.status] || 'bg-gray-400'}`} />
                      <span className="text-[10px] font-medium text-gray-700 truncate">{post.title}</span>
                    </button>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[10px] text-gray-400 font-medium pl-1.5">+{dayPosts.length - 3} mais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium px-1">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FBBC04]" /> Rascunho</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1A73E8]" /> Agendado</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#34A853]" /> Publicado</span>
        <span className="ml-auto hidden sm:inline">Arraste um post para reagendar</span>
      </div>

      {unscheduledPosts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Sem data definida ({unscheduledPosts.length})</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {unscheduledPosts.map((post) => (
              <button
                key={post.id}
                draggable
                onDragStart={() => setDraggedPostId(post.id)}
                onClick={() => onSelectPost(post)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 transition-colors"
              >
                {post.status === 'Publicado' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34A853]" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                )}
                <span className="max-w-40 truncate">{post.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};