import { CheckCircle2, ChevronDown, Circle, Clock3, Flag, Plus, Search, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { Challenge, SocialPost } from '../types';
import { ChallengeCard } from './challenges/ChallengeCard';
import { ChallengeFormModal } from './challenges/ChallengeFormModal';
import { compareChallenges, nextStatus, STATUSES } from './challenges/challengeModel';
import { useChallengeForm } from './challenges/useChallengeForm';

interface ChallengesModuleProps {
  challenges: Challenge[];
  posts: SocialPost[];
  onSaveChallenge: (challenge: Challenge, resultVideoFile?: File) => Promise<void>;
  onDeleteChallenge: (id: string) => Promise<void>;
  onSavePost: (post: SocialPost) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
}

function getCategories(challenges: Challenge[]): string[] {
  const byKey = new Map<string, string>();
  for (const c of challenges) {
    const trimmed = c.category?.trim();
    if (trimmed && !byKey.has(trimmed.toLowerCase())) byKey.set(trimmed.toLowerCase(), trimmed);
  }
  return Array.from(byKey.values());
}

function StatusCount({
  icon,
  iconClass,
  count,
  label,
}: {
  icon: ReactNode;
  iconClass: string;
  count: number;
  label: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex items-center justify-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>{icon}</div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-900 leading-tight">{count}</p>
        <p className="text-[11px] text-gray-500 font-medium hidden sm:block">{label}</p>
      </div>
    </div>
  );
}

export function ChallengesModule({
  challenges,
  posts,
  onSaveChallenge,
  onDeleteChallenge,
  onSavePost,
  onDeletePost,
}: ChallengesModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const form = useChallengeForm();

  const categories = getCategories(challenges);
  const query = searchQuery.toLowerCase();

  const filteredChallenges = challenges
    .filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategory === 'Todos' || c.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
      const matchesStatus = selectedStatus === 'Todos' || c.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort(compareChallenges);

  const countByStatus = (status: Challenge['status']) => challenges.filter((c) => c.status === status).length;

  const handleDelete = async (challenge: Challenge) => {
    if (!confirm('Deseja realmente remover este desafio?')) return;
    setDeletingId(challenge.id);
    try {
      await onDeleteChallenge(challenge.id);
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir o desafio. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCycleStatus = async (challenge: Challenge) => {
    setUpdatingStatusId(challenge.id);
    try {
      await onSaveChallenge({
        ...challenge,
        status: nextStatus(challenge.status),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 pt-15">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Flag className="w-6 h-6 text-[#34A853]" />
            <span>Desafios</span>
          </h2>
        </div>

        <button
          id="btn-new-challenge"
          onClick={form.openCreate}
          aria-label="Novo desafio"
          title="Novo desafio"
          className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo desafio</span>
        </button>
      </div>

      {challenges.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatusCount
            icon={<Circle className="w-4.5 h-4.5" />}
            iconClass="bg-gray-100 text-gray-500"
            count={countByStatus('Pendente')}
            label="Pendentes"
          />
          <StatusCount
            icon={<Clock3 className="w-4.5 h-4.5" />}
            iconClass="bg-[#1A73E8]/10 text-[#1A73E8]"
            count={countByStatus('Em Andamento')}
            label="Em andamento"
          />
          <StatusCount
            icon={<CheckCircle2 className="w-4.5 h-4.5" />}
            iconClass="bg-[#34A853]/10 text-[#1E8E3E]"
            count={countByStatus('Concluído')}
            label="Concluídos"
          />
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-challenges-input"
              type="text"
              aria-label="Buscar desafios"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#34A853]/30 focus:border-[#34A853] bg-gray-50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                aria-label="Filtrar por status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#34A853]/30"
              >
                <option value="Todos">Todos os Status</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {['Todos', ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={selectedCategory === cat}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#34A853] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredChallenges.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#34A853]/10 text-[#1E8E3E] flex items-center justify-center mx-auto">
            <Flag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {challenges.length === 0 ? 'Nenhum desafio encontrado' : 'Nada encontrado'}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              isUpdatingStatus={updatingStatusId === challenge.id}
              isDeleting={deletingId === challenge.id}
              onCycleStatus={() => handleCycleStatus(challenge)}
              onEdit={() => form.openEdit(challenge)}
              onDelete={() => handleDelete(challenge)}
            />
          ))}
        </div>
      )}

      {form.isOpen && (
        <ChallengeFormModal
          form={form}
          categories={categories}
          posts={posts}
          onSaveChallenge={onSaveChallenge}
          onSavePost={onSavePost}
          onDeletePost={onDeletePost}
        />
      )}
    </div>
  );
}
