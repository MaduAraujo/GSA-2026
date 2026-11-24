import { CheckCircle2, Circle, Clock3, Flag, Plus, Search, X } from 'lucide-react';
import { useUrlState } from '../hooks/useUrlState';
import { EmptyState, NoResults } from './ui/EmptyState';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { useState, type ReactNode } from 'react';
import { usePersistedState } from '../hooks/usePersistedState';
import { useUndoableDelete } from '../hooks/useUndoableDelete';
import { useToast } from '../app/ToastProvider';
import { SelectDropdown } from './SelectDropdown';
import type { Challenge, ChallengeType, SocialPost } from '../types';
import { ChallengeCard } from './challenges/ChallengeCard';
import { ChallengeFormModal } from './challenges/ChallengeFormModal';
import { CHALLENGE_TYPES, challengeTypeOf, compareChallenges, nextStatus, STATUSES } from './challenges/challengeModel';
import { useChallengeForm } from './challenges/useChallengeForm';

interface ChallengesModuleProps {
  challenges: Challenge[];
  posts: SocialPost[];
  onSaveChallenge: (challenge: Challenge, mediaFiles?: Record<string, File>) => Promise<void>;
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
        <p className="text-2xs text-gray-500 font-medium hidden sm:block">{label}</p>
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
  const [savedType, setSavedType] = usePersistedState<ChallengeType>('gsa_challenge_tab', 'Desafio');
  const [typeParam, setTypeParam] = useUrlState('tipo');
  const activeType = CHALLENGE_TYPES.find((t) => t.type === typeParam)?.type ?? savedType;
  const [searchQuery, setSearchQuery] = useUrlState('q');
  const [selectedCategory, setSelectedCategory] = useUrlState('categoria', 'Todos');
  const [selectedStatus, setSelectedStatus] = useUrlState('status', 'Todos');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const form = useChallengeForm();
  const toast = useToast();
  const pendingDelete = useUndoableDelete<Challenge>({
    commit: (challenge) => onDeleteChallenge(challenge.id),
    message: 'Item excluído.',
    errorMessage: 'Não foi possível excluir o item. Tente novamente.',
  });

  const activeTab = CHALLENGE_TYPES.find((t) => t.type === activeType) ?? CHALLENGE_TYPES[0]!;
  const visibleChallenges = challenges.filter((c) => !pendingDelete.pendingIds.has(c.id));
  const tabChallenges = visibleChallenges.filter((c) => challengeTypeOf(c) === activeTab.type);
  const categories = getCategories(tabChallenges);
  const query = searchQuery.toLowerCase();

  const selectTab = (type: ChallengeType) => {
    setSavedType(type);
    setTypeParam('');
    setSelectedCategory('Todos');
  };

  const filteredChallenges = tabChallenges
    .filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategory === 'Todos' || c.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
      const matchesStatus = selectedStatus === 'Todos' || c.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort(compareChallenges);

  const countByStatus = (status: Challenge['status']) => tabChallenges.filter((c) => c.status === status).length;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todos');
    setSelectedStatus('Todos');
  };

  const handleCycleStatus = async (challenge: Challenge) => {
    setUpdatingStatusId(challenge.id);
    try {
      await onSaveChallenge({
        ...challenge,
        status: nextStatus(challenge.status),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
      toast.show({ message: 'Não foi possível atualizar o status. Tente novamente.', tone: 'error' });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Flag} iconClassName="text-primary" title="Desafios">
        <Button
          id="btn-new-challenge"
          onClick={() => form.openCreate(activeTab.type)}
          aria-label={activeTab.newLabel}
          title={activeTab.newLabel}
          variant="primary"
          collapseLabel
          icon={<Plus className="w-4 h-4" />}
        >
          {activeTab.newLabel}
        </Button>
      </PageHeader>

      <div
        role="tablist"
        aria-label="Tipos de desafio"
        className="flex gap-1 p-1 rounded-2xl bg-gray-100 overflow-x-auto scrollbar-none"
      >
        {CHALLENGE_TYPES.map(({ type, tab }) => {
          const selected = type === activeTab.type;
          const count = visibleChallenges.filter((c) => challengeTypeOf(c) === type).length;
          return (
            <button
              key={type}
              role="tab"
              aria-selected={selected}
              onClick={() => selectTab(type)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                selected ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`min-w-5 px-1.5 rounded-full text-2xs font-bold ${
                  selected ? 'bg-success/10 text-success-700' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {tabChallenges.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatusCount
            icon={<Circle className="w-4.5 h-4.5" />}
            iconClass="bg-gray-100 text-gray-500"
            count={countByStatus('Pendente')}
            label="Pendentes"
          />
          <StatusCount
            icon={<Clock3 className="w-4.5 h-4.5" />}
            iconClass="bg-primary/10 text-primary"
            count={countByStatus('Em Andamento')}
            label="Em andamento"
          />
          <StatusCount
            icon={<CheckCircle2 className="w-4.5 h-4.5" />}
            iconClass="bg-success/10 text-success-700"
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
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-success/30 focus:border-success bg-gray-50"
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
            <div className="relative w-44">
              <SelectDropdown
                ariaLabel="Filtrar por status"
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { value: 'Todos', label: 'Todos os status' },
                  ...STATUSES.map((s) => ({ value: s, label: s })),
                ]}
                buttonClassName="w-full px-3.5 py-2 pr-8 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-success/30"
              />
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
                    ? 'bg-primary text-white shadow-xs'
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
        tabChallenges.length === 0 ? (
          <EmptyState
            icon={Flag}
            iconClassName="bg-primary/10 text-primary"
            title={`Nenhum item em ${activeTab.tab}`}
            description="Registre aqui o que você fez no programa para acompanhar sua evolução."
            action={{
              label: activeTab.newLabel,
              onClick: () => form.openCreate(activeTab.type),
              icon: <Plus className="w-4 h-4" />,
            }}
          />
        ) : (
          <NoResults onClear={clearFilters} />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              isUpdatingStatus={updatingStatusId === challenge.id}
              onCycleStatus={() => handleCycleStatus(challenge)}
              onEdit={() => form.openEdit(challenge)}
              onDelete={() => pendingDelete.remove(challenge)}
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
