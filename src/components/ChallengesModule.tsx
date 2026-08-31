import React, { useEffect, useRef, useState } from 'react';
import {
  Flag,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Calendar,
  ExternalLink,
  Star,
  Loader2,
  CheckCircle2,
  Circle,
  Clock3,
  ChevronDown,
  MessageSquareText,
  Upload,
  Share2,
} from 'lucide-react';
import { Challenge, ChallengeStatus, GeminiPost, PostPlatform } from '../types';
import { DatePicker } from './DatePicker';
import { usePersistedState } from '../hooks/usePersistedState';

interface ChallengesModuleProps {
  challenges: Challenge[];
  posts: GeminiPost[];
  onSaveChallenge: (challenge: Challenge) => Promise<void>;
  onDeleteChallenge: (id: string) => Promise<void>;
  onSavePost: (post: GeminiPost) => Promise<void>;
}

const STATUSES: ChallengeStatus[] = ['Pendente', 'Em Andamento', 'Concluído'];

const RESULT_PLATFORMS: PostPlatform[] = [
  'LinkedIn',
  'Instagram',
  'Medium / Dev.to',
  'Twitter / X',
  'WhatsApp / Comunidade',
];

const STATUS_STYLES: Record<ChallengeStatus, { bg: string; text: string; icon: typeof Circle }> = {
  'Pendente': { bg: 'bg-gray-100', text: 'text-gray-600', icon: Circle },
  'Em Andamento': { bg: 'bg-[#1A73E8]/10', text: 'text-[#1A73E8]', icon: Clock3 },
  'Concluído': { bg: 'bg-[#34A853]/10', text: 'text-[#1E8E3E]', icon: CheckCircle2 },
};

const DEFAULT_FORM: Partial<Challenge> = {
  title: '',
  description: '',
  category: '',
  status: 'Pendente',
  deadline: '',
  link: '',
  points: undefined,
  result: '',
  resultImage: '',
  resultLink: '',
};

function formatDateBR(isoDate?: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function nextStatus(status: ChallengeStatus): ChallengeStatus {
  const idx = STATUSES.indexOf(status);
  return STATUSES[(idx + 1) % STATUSES.length];
}

export const ChallengesModule: React.FC<ChallengesModuleProps> = ({
  challenges,
  posts,
  onSaveChallenge,
  onDeleteChallenge,
  onSavePost,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');

  const [isAddModalOpen, setIsAddModalOpen] = usePersistedState('gsa_challenge_modal_open', false);
  const [isEditMode, setIsEditMode] = usePersistedState('gsa_challenge_edit_mode', false);
  const [formData, setFormData] = usePersistedState<Partial<Challenge>>('gsa_challenge_form_draft', DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const addModalRef = useRef<HTMLDivElement>(null);

  // Result image attachment (proof/screenshot of the publication)
  const [resultImageError, setResultImageError] = useState<string | null>(null);
  const resultImageInputRef = useRef<HTMLInputElement>(null);
  const MAX_RESULT_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

  const handleResultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResultImageError(null);
    if (file.size > MAX_RESULT_IMAGE_SIZE_BYTES) {
      setResultImageError(`Imagem muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O limite é 4MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, resultImage: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const dynamicCategories = Array.from(
    challenges.reduce((map, c) => {
      const trimmed = c.category?.trim();
      if (trimmed && !map.has(trimmed.toLowerCase())) {
        map.set(trimmed.toLowerCase(), trimmed);
      }
      return map;
    }, new Map<string, string>()).values()
  );

  const filteredChallenges = challenges
    .filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Todos' || c.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
      const matchesStatus = selectedStatus === 'Todos' || c.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

  const pendingCount = challenges.filter((c) => c.status === 'Pendente').length;
  const inProgressCount = challenges.filter((c) => c.status === 'Em Andamento').length;
  const doneCount = challenges.filter((c) => c.status === 'Concluído').length;

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setIsEditMode(false);
    setResultImageError(null);
  };

  const openEditModal = (challenge: Challenge) => {
    setFormData({ ...challenge });
    setIsEditMode(true);
    setResultImageError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.description?.trim()) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const title = formData.title.trim();
      const resultLink = (formData.resultLink || '').trim() || undefined;
      const resultPlatform = formData.resultPlatform || undefined;

      // A result published somewhere real (LinkedIn/Instagram/etc.) also
      // gets counted as a post on the Posts screen — create it on first
      // save, then keep updating the same linked post on later edits
      // instead of creating duplicates.
      let linkedPostId = formData.linkedPostId;
      if (resultLink && resultPlatform) {
        const existingPost = linkedPostId ? posts.find((p) => p.id === linkedPostId) : undefined;
        const postId = existingPost?.id || crypto.randomUUID();
        const post: GeminiPost = {
          id: postId,
          title,
          platform: resultPlatform,
          status: 'Publicado',
          category: (formData.category || 'Desafios').trim() || 'Desafios',
          tone: existingPost?.tone || 'Resultado de Desafio',
          content: (formData.result || '').trim() || title,
          promptUsed: existingPost?.promptUsed || `Resultado do desafio: "${title}"`,
          hashtags: existingPost?.hashtags || [],
          visualIdea: existingPost?.visualIdea,
          publishedUrl: resultLink,
          likes: existingPost?.likes ?? 0,
          comments: existingPost?.comments ?? 0,
          createdAt: existingPost?.createdAt || now,
          updatedAt: now,
        };
        await onSavePost(post);
        linkedPostId = postId;
      }

      const challenge: Challenge = {
        id: formData.id || crypto.randomUUID(),
        title,
        description: (formData.description || '').trim(),
        category: (formData.category || '').trim(),
        status: formData.status || 'Pendente',
        deadline: formData.deadline || undefined,
        link: formData.link || undefined,
        points: formData.points ? Number(formData.points) : undefined,
        result: (formData.result || '').trim() || undefined,
        resultImage: formData.resultImage || undefined,
        resultLink,
        resultPlatform,
        linkedPostId,
        createdAt: formData.createdAt || now,
        updatedAt: now,
      };

      await onSaveChallenge(challenge);
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Não foi possível salvar o desafio. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

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

  // Esc-to-close for the add/edit modal
  useEffect(() => {
    if (!isAddModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAddModalOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isAddModalOpen]);

  return (
    <div className="space-y-6">

      {/* Header & New Challenge Button */}
      <div className="flex items-center justify-between gap-4 pt-15">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Flag className="w-6 h-6 text-[#34A853]" />
            <span>Desafios</span>
          </h2>
        </div>

        <button
          id="btn-new-challenge"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          aria-label="Novo desafio"
          title="Novo desafio"
          className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo desafio</span>
        </button>
      </div>

      {/* Quick Stats */}
      {challenges.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex items-center justify-center sm:justify-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
              <Circle className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{pendingCount}</p>
              <p className="text-[11px] text-gray-500 font-medium hidden sm:block">Pendentes</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex items-center justify-center sm:justify-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center shrink-0">
              <Clock3 className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{inProgressCount}</p>
              <p className="text-[11px] text-gray-500 font-medium hidden sm:block">Em andamento</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex items-center justify-center sm:justify-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#34A853]/10 text-[#1E8E3E] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{doneCount}</p>
              <p className="text-[11px] text-gray-500 font-medium hidden sm:block">Concluídos</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-challenges-input"
              type="text"
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
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {dynamicCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {['Todos', ...dynamicCategories].map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-[#34A853] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Challenges List */}
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
          {filteredChallenges.map((challenge) => {
            const style = STATUS_STYLES[challenge.status];
            const StatusIcon = style.icon;
            return (
              <div
                key={challenge.id}
                id={`challenge-card-${challenge.id}`}
                className="flex flex-col bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-[#34A853]/40 transition-all p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {challenge.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700">
                        {challenge.category}
                      </span>
                    )}
                    <button
                      onClick={() => handleCycleStatus(challenge)}
                      disabled={updatingStatusId === challenge.id}
                      title="Clique para avançar o status"
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition-all active:scale-95 ${style.bg} ${style.text}`}
                    >
                      {updatingStatusId === challenge.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <StatusIcon className="w-3 h-3" />
                      )}
                      <span>{challenge.status}</span>
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-base leading-snug">{challenge.title}</h3>

                {challenge.description && (
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{challenge.description}</p>
                )}

                {challenge.result && (
                  <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-[#34A853]/5 border border-[#34A853]/15">
                    <MessageSquareText className="w-3.5 h-3.5 text-[#1E8E3E] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[#1E8E3E] uppercase tracking-wider">Resultado</p>
                      <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">{challenge.result}</p>
                    </div>
                  </div>
                )}

                {challenge.resultImage && (
                  <img
                    src={challenge.resultImage}
                    alt="Resultado do desafio"
                    className="w-full h-32 rounded-xl object-cover border border-gray-200"
                  />
                )}

                {challenge.resultLink && (
                  <a
                    href={challenge.resultLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A73E8] hover:underline"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Ver publicação{challenge.resultPlatform ? ` no ${challenge.resultPlatform}` : ''}
                  </a>
                )}

                <div className="flex-1" />

                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 pt-1">
                  {challenge.deadline && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateBR(challenge.deadline)}
                    </span>
                  )}
                  {typeof challenge.points === 'number' && (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#9E5D00]">
                      <Star className="w-3.5 h-3.5 fill-[#FBBC04] text-[#FBBC04]" />
                      {challenge.points} pts
                    </span>
                  )}
                  {challenge.link && (
                    <a
                      href={challenge.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#1A73E8] hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Detalhes
                    </a>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openEditModal(challenge)}
                    className="p-1.5 rounded-xl bg-gray-100 hover:bg-[#34A853]/10 hover:text-[#1E8E3E] text-gray-600 transition-all"
                    aria-label="Editar desafio"
                    title="Editar Desafio"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(challenge)}
                    disabled={deletingId === challenge.id}
                    className="p-1.5 rounded-xl bg-gray-100 hover:bg-[#EA4335]/10 hover:text-[#EA4335] text-gray-600 transition-all disabled:opacity-50"
                    aria-label="Excluir desafio"
                    title="Excluir Desafio"
                  >
                    {deletingId === challenge.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -------------------- MODAL: ADD/EDIT CHALLENGE -------------------- */}
      {isAddModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div ref={addModalRef} className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">

              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#34A853]/10 text-[#1E8E3E] flex items-center justify-center">
                    <Flag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {isEditMode ? 'Editar Desafio' : 'Novo Desafio'}
                    </h3>
                    <p className="text-xs text-gray-500">Acompanhe os desafios do programa</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  aria-label="Fechar"
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Título do Desafio *
                  </label>
                  <input
                    id="challenge-form-title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-[#34A853]/30 focus:border-[#34A853] bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      list="challenge-category-suggestions"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                    />
                    {dynamicCategories.length > 0 && (
                      <datalist id="challenge-category-suggestions">
                        {dynamicCategories.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ChallengeStatus })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Dia (opcional)
                    </label>
                    <DatePicker
                      id="challenge-form-deadline"
                      value={formData.deadline || ''}
                      onChange={(date) => setFormData({ ...formData, deadline: date })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Pontos (opcional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.points ?? ''}
                      onChange={(e) => setFormData({ ...formData, points: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Link do desafio (opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.link || ''}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Descrição *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#34A853]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Resultado (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.result || ''}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#34A853]/30"
                  />
                </div>

                {/* Publication proof — if the result was posted on social media,
                    this also creates/updates a matching entry on the Posts screen. */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Publicação (opcional)
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Se você publicou este resultado em uma rede social, informe a plataforma e o link — ele passa a contar também na tela de Posts.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Plataforma</label>
                      <div className="relative">
                        <select
                          value={formData.resultPlatform || ''}
                          onChange={(e) => setFormData({ ...formData, resultPlatform: (e.target.value || undefined) as PostPlatform | undefined })}
                          className="appearance-none w-full pl-3.5 pr-8 py-2.5 rounded-xl text-sm border border-gray-200 bg-white cursor-pointer"
                        >
                          <option value="">Nenhuma</option>
                          {RESULT_PLATFORMS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Link da publicação</label>
                      <input
                        type="url"
                        value={formData.resultLink || ''}
                        onChange={(e) => setFormData({ ...formData, resultLink: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-2">Imagem (opcional)</label>
                    <input
                      ref={resultImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleResultImageChange}
                    />
                    {formData.resultImage ? (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-200">
                        <img
                          src={formData.resultImage}
                          alt="Prévia do resultado"
                          className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-200"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-green-700">Imagem anexada</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, resultImage: '' }))}
                          aria-label="Remover imagem"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => resultImageInputRef.current?.click()}
                        className="w-full flex items-center gap-2.5 p-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#1A73E8] bg-white text-left transition-all"
                      >
                        <Upload className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="text-xs text-gray-600">Anexe uma imagem ou captura da publicação</span>
                      </button>
                    )}
                    {resultImageError && (
                      <p role="alert" className="mt-2 text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5">
                        {resultImageError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !formData.title?.trim() || !formData.description?.trim()}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#34A853] hover:bg-[#2E7D32] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
