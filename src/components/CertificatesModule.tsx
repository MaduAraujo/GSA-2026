import {
  ArrowUpDown,
  Award,
  ChevronDown,
  Clock,
  FileDown,
  FileText,
  Layers,
  LayoutGrid,
  List,
  Search,
  Star,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useDismiss } from '../hooks/useDismiss';
import { usePersistedState } from '../hooks/usePersistedState';
import type { AmbassadorProfile, Certificate, EarnedBadge, PromptItem, SocialPost, UserBadge } from '../types';
import { certHoursDecimal, formatTotalHoursDecimal, sumCertHours } from '../utils/duration';
import { BadgesShowcase } from './BadgesShowcase';
import { CertificateDetailModal } from './certificates/CertificateDetailModal';
import { CertificateExportModal } from './certificates/CertificateExportModal';
import { CertificateFormModal } from './certificates/CertificateFormModal';
import { CertificateGrid, CertificateTable } from './certificates/CertificateViews';
import { EarnedBadgesSection } from './certificates/EarnedBadgesSection';
import { useCertificateForm } from './certificates/useCertificateForm';

interface CertificatesModuleProps {
  certificates: Certificate[];
  prompts: PromptItem[];
  posts: SocialPost[];
  userBadges: UserBadge[];
  earnedBadges: EarnedBadge[];
  isEarnedBadgesLoading: boolean;
  profile: AmbassadorProfile;
  onUploadEarnedBadge: (file: File) => Promise<void>;
  onDeleteEarnedBadge: (badge: EarnedBadge) => Promise<void>;
  onSaveCertificate: (cert: Certificate) => Promise<void>;
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
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  iconClass: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex items-center justify-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>{icon}</div>
      <div className="min-w-0 text-center">
        <p className="text-lg font-bold text-gray-900 leading-tight whitespace-nowrap">{value}</p>
        <p className="text-[11px] text-gray-500 font-medium hidden sm:block whitespace-nowrap">{label}</p>
      </div>
    </div>
  );
}

export function CertificatesModule({
  certificates,
  prompts,
  posts,
  userBadges,
  earnedBadges,
  isEarnedBadgesLoading,
  profile,
  onUploadEarnedBadge,
  onDeleteEarnedBadge,
  onSaveCertificate,
  onDeleteCertificate,
  onCreatePostFromCertificate,
}: CertificatesModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExportSelectOpen, setIsExportSelectOpen] = useState(false);
  const [selectedCertId, setSelectedCertId] = usePersistedState<string | null>('gsa_cert_selected_id', null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  useDismiss(exportMenuRef, isExportMenuOpen, () => setIsExportMenuOpen(false));
  const form = useCertificateForm();

  const selectedCert = selectedCertId ? (certificates.find((c) => c.id === selectedCertId) ?? null) : null;
  const categories = getCategories(certificates);
  const query = searchQuery.toLowerCase();

  const filteredCertificates = certificates
    .filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(query) ||
        c.issuer.toLowerCase().includes(query) ||
        c.skills.some((s) => s.toLowerCase().includes(query));
      const matchesCategory =
        selectedCategory === 'Todos' || c.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
      const matchesFav = !onlyFavorites || c.isFavorite;
      return matchesSearch && matchesCategory && matchesFav;
    })
    .sort(SORTERS[sortBy]);

  const toggleFavorite = (cert: Certificate) => onSaveCertificate({ ...cert, isFavorite: !cert.isFavorite });

  const openEdit = (cert: Certificate) => {
    setSelectedCertId(null);
    form.openEdit(cert);
  };

  const handleDelete = async (cert: Certificate) => {
    if (!confirm('Deseja realmente remover este certificado?')) return;
    setDeletingId(cert.id);
    try {
      await onDeleteCertificate(cert.id);
      setSelectedCertId(null);
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir o certificado. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  };

  const viewActions = {
    onOpen: (cert: Certificate) => setSelectedCertId(cert.id),
    onEdit: openEdit,
    onToggleFavorite: toggleFavorite,
    onCreatePost: onCreatePostFromCertificate,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 pt-15">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-[#1A73E8]" />
            <span>Certificados e Selos</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen((v) => !v)}
              disabled={certificates.length === 0}
              aria-haspopup="menu"
              aria-expanded={isExportMenuOpen}
              aria-label="Exportar certificados"
              className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Exportar todos os certificados do portfólio"
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
                className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-white border border-gray-200 shadow-lg p-1.5 z-20"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    setIsExportSelectOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 text-[#EA4335]" />
                  <span>.pdf</span>
                </button>
              </div>
            )}
          </div>

          <button
            id="btn-upload-cert"
            onClick={form.openCreate}
            aria-label="Novo certificado"
            title="Novo certificado"
            className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
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
          />
          <StatCard
            icon={<Clock className="w-4.5 h-4.5" />}
            iconClass="bg-[#34A853]/10 text-[#34A853]"
            value={formatTotalHoursDecimal(sumCertHours(certificates))}
            label="Horas de estudo"
          />
          <StatCard
            icon={<Star className="w-4.5 h-4.5" />}
            iconClass="bg-[#FBBC04]/10 text-[#9E5D00]"
            value={certificates.filter((c) => c.isFavorite).length}
            label="Favoritos"
          />
        </div>
      )}

      <BadgesShowcase certificates={certificates} prompts={prompts} posts={posts} userBadges={userBadges} />

      <EarnedBadgesSection
        badges={earnedBadges}
        isLoading={isEarnedBadgesLoading}
        onUpload={onUploadEarnedBadge}
        onDelete={onDeleteEarnedBadge}
      />

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-certificates-input"
              type="text"
              aria-label="Buscar certificados"
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
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                onlyFavorites
                  ? 'bg-[#FBBC04]/15 border-[#FBBC04] text-[#9E5D00]'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-[#FBBC04] text-[#FBBC04]' : 'text-gray-400'}`} />
              <span>Favoritos</span>
            </button>

            <div className="relative">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Ordenar certificados"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none pl-7 pr-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/30"
              >
                {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                  <option key={opt} value={opt}>
                    {SORT_LABELS[opt]}
                  </option>
                ))}
              </select>
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

        {categories.length > 0 && (
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
      </div>

      {filteredCertificates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum certificado encontrado</h3>
          {(searchQuery || selectedCategory !== 'Todos') && (
            <p className="text-sm text-gray-500 max-w-md mx-auto">Tente ajustar seus filtros ou termo de busca.</p>
          )}
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
          isDeleting={deletingId === selectedCert.id}
          onClose={() => setSelectedCertId(null)}
          onToggleFavorite={() => toggleFavorite(selectedCert)}
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
          onClose={() => setIsExportSelectOpen(false)}
        />
      )}
    </div>
  );
}
