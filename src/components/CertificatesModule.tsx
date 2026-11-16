import {
  ArrowUpDown,
  Award,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  FileDown,
  FileText,
  Layers,
  LayoutGrid,
  Link2,
  List,
  Plus,
  Search,
  Star,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useToast } from '../app/ToastProvider';
import { useDismiss } from '../hooks/useDismiss';
import { usePersistedState } from '../hooks/usePersistedState';
import { useUndoableDelete } from '../hooks/useUndoableDelete';
import type { AmbassadorProfile, Certificate, EarnedBadge } from '../types';
import { certHoursDecimal, formatTotalHoursDecimal, sumCertHours } from '../utils/duration';
import { CertificateDetailModal } from './certificates/CertificateDetailModal';
import { CertificateExportModal } from './certificates/CertificateExportModal';
import { CertificateFormModal } from './certificates/CertificateFormModal';
import { CertificateGrid, CertificateTable } from './certificates/CertificateViews';
import { EarnedBadgesSection } from './certificates/EarnedBadgesSection';
import { SelectDropdown } from './SelectDropdown';
import { useCertificateForm } from './certificates/useCertificateForm';

interface CertificatesModuleProps {
  certificates: Certificate[];
  earnedBadges: EarnedBadge[];
  isEarnedBadgesLoading: boolean;
  profile: AmbassadorProfile;
  onUploadEarnedBadge: (file: File) => Promise<void>;
  onDeleteEarnedBadge: (badge: EarnedBadge) => Promise<void>;
  onToggleEarnedBadgeFavorite: (badge: EarnedBadge, isFavorite: boolean) => Promise<void>;
  onSaveCertificate: (cert: Certificate) => Promise<void>;
  onToggleCertificateFavorite: (cert: Certificate, isFavorite: boolean) => Promise<void>;
  onToggleCertificatePortfolio: (cert: Certificate, showInPortfolio: boolean) => Promise<void>;
  onDeleteCertificate: (id: string) => Promise<void>;
  onCreatePostFromCertificate: (cert: Certificate) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'hours-desc' | 'name-asc';

const SORT_LABELS: Record<SortOption, string> = {
  'date-desc': 'Mais recentes',
  'date-asc': 'Mais antigos',
  'hours-desc': 'Maior carga horária',
  'name-asc': 'Nome (A-Z)',
};

const SORTERS: Record<SortOption, (a: Certificate, b: Certificate) => number> = {
  'date-desc': (a, b) => b.issueDate.localeCompare(a.issueDate),
  'date-asc': (a, b) => a.issueDate.localeCompare(b.issueDate),
  'hours-desc': (a, b) => certHoursDecimal(b) - certHoursDecimal(a),
  'name-asc': (a, b) => a.title.localeCompare(b.title),
};

function getCategories(certificates: Certificate[]): string[] {
  const byKey = new Map<string, string>();
  for (const c of certificates) {
    const trimmed = c.category?.trim();
    if (trimmed && !byKey.has(trimmed.toLowerCase())) byKey.set(trimmed.toLowerCase(), trimmed);
  }
  return Array.from(byKey.values());
}

function StatCard({
  icon,
  value,
  label,
  iconClass,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  iconClass: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className="bg-white rounded-2xl border border-gray-200 shadow-xs p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 min-w-0 hover:border-[#1A73E8]/40 hover:shadow-sm transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>{icon}</div>
      <div className="min-w-0 max-w-full text-center">
        <p className="text-lg font-bold text-gray-900 leading-tight whitespace-nowrap tabular-nums">{value}</p>
        <p className="text-[11px] text-gray-500 font-medium truncate">{label}</p>
      </div>
    </button>
  );
}

export function CertificatesModule({
  certificates: savedCertificates,
  earnedBadges,
  isEarnedBadgesLoading,
  profile,
  onUploadEarnedBadge,
  onDeleteEarnedBadge,
  onToggleEarnedBadgeFavorite,
  onSaveCertificate,
  onToggleCertificateFavorite,
  onToggleCertificatePortfolio,
  onDeleteCertificate,
  onCreatePostFromCertificate,
}: CertificatesModuleProps) {
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const [portfolioOverrides, setPortfolioOverrides] = useState<Record<string, boolean>>({});
  const toast = useToast();
  const pendingDelete = useUndoableDelete<Certificate>({
    commit: (cert) => onDeleteCertificate(cert.id),
    message: 'Certificado excluído',
    errorMessage: 'Não foi possível excluir o certificado. Ele foi restaurado.',
  });
  const certificates = savedCertificates
    .filter((c) => !pendingDelete.pendingIds.has(c.id))
    .map((c) => (c.id in favoriteOverrides ? { ...c, isFavorite: favoriteOverrides[c.id] } : c))
    .map((c) => (c.id in portfolioOverrides ? { ...c, showInPortfolio: portfolioOverrides[c.id] } : c));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [storedViewMode, setViewMode] = usePersistedState<'grid' | 'list'>('gsa_cert_view_mode', 'grid');
  const [storedSortBy, setSortBy] = usePersistedState<SortOption>('gsa_cert_sort_by', 'date-desc');
  const viewMode = storedViewMode === 'list' ? 'list' : 'grid';
  const sortBy: SortOption = storedSortBy in SORTERS ? storedSortBy : 'date-desc';
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExportSelectOpen, setIsExportSelectOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedCertId, setSelectedCertId] = useState<string | null>(null);
  const [isBadgesExpanded, setIsBadgesExpanded] = usePersistedState('gsa_badges_expanded', false);

  const showBadges = () => {
    setIsBadgesExpanded(true);
    document.getElementById('earned-badges')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const exportMenuRef = useRef<HTMLDivElement>(null);
  useDismiss(exportMenuRef, isExportMenuOpen, () => setIsExportMenuOpen(false));
  const form = useCertificateForm();

  const selectedCert = selectedCertId ? (certificates.find((c) => c.id === selectedCertId) ?? null) : null;
  const categories = getCategories(certificates);
  const query = searchQuery.trim().toLowerCase();
  const hasActiveFilters = query !== '' || selectedCategory !== 'Todos' || onlyFavorites;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todos');
    setOnlyFavorites(false);
  };

  const filteredCertificates = certificates
    .filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(query) ||
        c.issuer.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        (c.description ?? '').toLowerCase().includes(query) ||
        c.skills.some((s) => s.toLowerCase().includes(query));
      const matchesCategory =
        selectedCategory === 'Todos' || c.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
      const matchesFav = !onlyFavorites || c.isFavorite;
      return matchesSearch && matchesCategory && matchesFav;
    })
    .sort(SORTERS[sortBy]);

  const portfolioUrl =
    profile.isPublic && profile.publicSlug ? `${window.location.origin}/p/${profile.publicSlug}` : null;

  const handleCopyPortfolioLink = async () => {
    if (!portfolioUrl) return;
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setLinkCopied(true);
      setTimeout(() => {
        setLinkCopied(false);
        setIsExportMenuOpen(false);
      }, 1500);
    } catch {
      window.prompt('Copie o link do portfólio:', portfolioUrl);
      setIsExportMenuOpen(false);
    }
  };

  const toggleFavorite = async (cert: Certificate) => {
    const next = !cert.isFavorite;
    setFavoriteOverrides((o) => ({ ...o, [cert.id]: next }));
    try {
      await onToggleCertificateFavorite(cert, next);
    } catch (err) {
      console.error(err);
      toast.show({ message: 'Não foi possível atualizar o favorito. Tente novamente.', tone: 'error' });
    } finally {
      setFavoriteOverrides(({ [cert.id]: _, ...rest }) => rest);
    }
  };

  const togglePortfolio = async (cert: Certificate) => {
    const next = cert.showInPortfolio === false;
    setPortfolioOverrides((o) => ({ ...o, [cert.id]: next }));
    try {
      await onToggleCertificatePortfolio(cert, next);
      toast.show({
        message: next ? 'Certificado visível no portfólio público' : 'Certificado oculto do portfólio público',
        tone: 'success',
      });
    } catch (err) {
      console.error(err);
      toast.show({ message: 'Não foi possível alterar a visibilidade. Tente novamente.', tone: 'error' });
    } finally {
      setPortfolioOverrides(({ [cert.id]: _, ...rest }) => rest);
    }
  };

  const openEdit = (cert: Certificate) => {
    setSelectedCertId(null);
    form.openEdit(cert);
  };

  const handleDelete = (cert: Certificate) => {
    setSelectedCertId(null);
    pendingDelete.remove(cert);
  };

  const viewActions = {
    onOpen: (cert: Certificate) => setSelectedCertId(cert.id),
    onEdit: openEdit,
    onToggleFavorite: toggleFavorite,
    onTogglePortfolio: togglePortfolio,
    onCreatePost: onCreatePostFromCertificate,
    onDelete: handleDelete,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 pt-15">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-[#1A73E8]" />
            <span>Certificados e Badges</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={isExportMenuOpen}
              aria-label="Exportar certificados"
              className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95"
              title="Exportar ou compartilhar o portfólio"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isExportMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white border border-gray-200 shadow-lg p-1.5 z-20"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    setIsExportSelectOpen(true);
                  }}
                  disabled={certificates.length === 0}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4 text-[#EA4335]" />
                  <span>Baixar PDF</span>
                </button>
                <button
                  role="menuitem"
                  onClick={handleCopyPortfolioLink}
                  disabled={!portfolioUrl}
                  className="w-full flex items-start gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed text-left"
                >
                  {linkCopied ? (
                    <Check className="w-4 h-4 text-[#34A853] mt-0.5 shrink-0" />
                  ) : (
                    <Link2 className="w-4 h-4 text-[#1A73E8] mt-0.5 shrink-0" />
                  )}
                  <span className="min-w-0">
                    <span className={portfolioUrl ? '' : 'opacity-50'}>
                      {linkCopied ? 'Link copiado!' : 'Link público'}
                    </span>
                    {!portfolioUrl && (
                      <span className="block text-[11px] font-normal text-gray-500">
                        Ative o portfólio público no seu perfil
                      </span>
                    )}
                  </span>
                </button>
              </div>
            )}
          </div>

          <button
            id="btn-upload-cert"
            onClick={form.openCreate}
            aria-label="Novo certificado"
            title="Novo certificado"
            className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-[#1A73E8] hover:bg-[#1765CC] border border-[#1A73E8] text-white font-semibold text-sm shadow-sm transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A73E8]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo certificado</span>
          </button>
        </div>
      </div>

      {certificates.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Layers className="w-4.5 h-4.5" />}
            iconClass="bg-[#1A73E8]/10 text-[#1A73E8]"
            value={certificates.length}
            label="Certificados"
            hint="Mostrar todos os certificados"
            onClick={clearFilters}
          />
          <StatCard
            icon={<Clock className="w-4.5 h-4.5" />}
            iconClass="bg-[#34A853]/10 text-[#34A853]"
            value={formatTotalHoursDecimal(sumCertHours(certificates))}
            label="Horas de estudo"
            hint="Ordenar por maior carga horária"
            onClick={() => setSortBy('hours-desc')}
          />
          <StatCard
            icon={<BadgeCheck className="w-4.5 h-4.5" />}
            iconClass="bg-[#FBBC04]/10 text-[#9E5D00]"
            value={earnedBadges.length}
            label="Badges"
            hint="Ver os badges"
            onClick={showBadges}
          />
        </div>
      )}

      <EarnedBadgesSection
        badges={earnedBadges}
        isLoading={isEarnedBadgesLoading}
        onUpload={onUploadEarnedBadge}
        onDelete={onDeleteEarnedBadge}
        onToggleFavorite={onToggleEarnedBadgeFavorite}
        isExpanded={isBadgesExpanded}
        onExpandedChange={setIsBadgesExpanded}
      />

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-certificates-input"
              type="text"
              aria-label="Buscar certificados"
              placeholder="Buscar por título, emissor ou habilidade…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/30 focus:border-[#1A73E8] bg-[#F8FAFD]"
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
            <button
              id="filter-favorites-cert"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              aria-pressed={onlyFavorites}
              className={`inline-flex items-center justify-center gap-1.5 h-8.5 px-3 rounded-full text-xs font-semibold leading-none border transition-all ${
                onlyFavorites
                  ? 'bg-[#FBBC04]/15 border-[#FBBC04] text-[#9E5D00]'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Star
                aria-hidden="true"
                className={`block w-3.5 h-3.5 shrink-0 ${onlyFavorites ? 'fill-[#FBBC04] text-[#FBBC04]' : 'text-gray-400'}`}
              />
              <span className="leading-none">Favoritos</span>
            </button>

            <div className="relative w-42">
              <SelectDropdown
                value={sortBy}
                onChange={(v) => setSortBy(v as SortOption)}
                options={(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => ({
                  value: opt,
                  label: <span className="whitespace-nowrap">{SORT_LABELS[opt]}</span>,
                }))}
                ariaLabel="Ordenar certificados"
                buttonClassName="w-full h-8.5 pl-7 pr-7 rounded-full text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/30"
              />
              <ArrowUpDown
                aria-hidden="true"
                className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>

            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Visualização em grade"
                aria-pressed={viewMode === 'grid'}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Visualização em Grade"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="Visualização em lista"
                aria-pressed={viewMode === 'list'}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Visualização em Lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {['Todos', ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={selectedCategory === cat}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#1A73E8] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {hasActiveFilters && certificates.length > 0 && (
          <div className="flex items-center justify-between gap-3 pt-1 text-xs">
            <p role="status" className="text-gray-500 tabular-nums">
              <span className="font-semibold text-gray-800">{filteredCertificates.length}</span> de{' '}
              {certificates.length} certificado{certificates.length === 1 ? '' : 's'}
            </p>
            <button type="button" onClick={clearFilters} className="font-semibold text-[#1A73E8] hover:underline">
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Adicione seu primeiro certificado</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Envie a imagem ou o PDF e a IA ajuda a preencher título, emissor e habilidades.
          </p>
          <button
            type="button"
            onClick={form.openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1A73E8] hover:bg-[#1765CC] text-white font-semibold text-sm shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar certificado</span>
          </button>
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum certificado encontrado</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {onlyFavorites && !query && selectedCategory === 'Todos'
              ? 'Você ainda não favoritou nenhum certificado. Toque na ⭐ de um card para destacá-lo.'
              : 'Nenhum certificado corresponde à busca e aos filtros atuais.'}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
            <span>Limpar filtros</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <CertificateGrid certificates={filteredCertificates} {...viewActions} />
      ) : (
        <CertificateTable certificates={filteredCertificates} {...viewActions} />
      )}

      {form.isOpen && (
        <CertificateFormModal form={form} categories={categories} onSaveCertificate={onSaveCertificate} />
      )}

      {selectedCert && !form.isOpen && (
        <CertificateDetailModal
          cert={selectedCert}
          onClose={() => setSelectedCertId(null)}
          onToggleFavorite={() => toggleFavorite(selectedCert)}
          onTogglePortfolio={() => togglePortfolio(selectedCert)}
          onEdit={() => openEdit(selectedCert)}
          onDelete={() => handleDelete(selectedCert)}
          onCreatePost={() => {
            setSelectedCertId(null);
            onCreatePostFromCertificate(selectedCert);
          }}
        />
      )}

      {isExportSelectOpen && (
        <CertificateExportModal
          certificates={certificates}
          profile={profile}
          preselectedIds={hasActiveFilters ? filteredCertificates.map((c) => c.id) : undefined}
          onClose={() => setIsExportSelectOpen(false)}
        />
      )}
    </div>
  );
}
