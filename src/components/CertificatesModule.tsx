import React, { useState, useRef, useEffect } from 'react';
import {
  Award,
  Upload,
  Search,
  Filter,
  ExternalLink,
  Trash2,
  Star,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  Sparkles,
  X,
  Eye,
  Download,
  Share2,
  Plus,
  LayoutGrid,
  List,
  ChevronRight,
  ShieldCheck,
  Tag,
  Pencil,
  Loader2,
  ArrowUpDown,
  FileDown,
  Layers,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AmbassadorProfile, Certificate, PromptItem, GeminiPost, UserBadge } from '../types';
import { GeminiApiService } from '../services/geminiApi';
import { exportPortfolioAsPdf } from '../utils/portfolioExport';
import { DatePicker } from './DatePicker';
import { BadgesShowcase } from './BadgesShowcase';

interface CertificatesModuleProps {
  certificates: Certificate[];
  prompts: PromptItem[];
  posts: GeminiPost[];
  userBadges: UserBadge[];
  profile: AmbassadorProfile;
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

function formatDateBR(isoDate: string): string {
  const [year, month, day] = (isoDate || '').split('-');
  if (!year || !month || !day) return isoDate || '';
  return `${day}/${month}/${year}`;
}

export const CertificatesModule: React.FC<CertificatesModuleProps> = ({
  certificates,
  prompts,
  posts,
  userBadges,
  profile,
  onSaveCertificate,
  onDeleteCertificate,
  onCreatePostFromCertificate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isExportSelectOpen, setIsExportSelectOpen] = useState(false);
  const [selectedExportIds, setSelectedExportIds] = useState<Set<string>>(new Set());
  const exportSelectModalRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const addModalRef = useRef<HTMLDivElement>(null);
  const detailModalRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Certificate>>({
    title: '',
    issuer: 'Google Cloud Skills Boost',
    issueDate: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    skills: [],
    credentialId: '',
    credentialUrl: '',
    hours: 10,
    isFavorite: false,
  });
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'document'>('image');
  const [skillInput, setSkillInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

  // Categories the user has actually typed in, deduped case-insensitively
  // (keeps the casing of whichever certificate used that category first).
  const dynamicCategories = Array.from(
    certificates.reduce((map, c) => {
      const trimmed = c.category?.trim();
      if (trimmed && !map.has(trimmed.toLowerCase())) {
        map.set(trimmed.toLowerCase(), trimmed);
      }
      return map;
    }, new Map<string, string>()).values()
  );

  // Filtered + Sorted Certificates
  const filteredCertificates = certificates
    .filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'Todos' || c.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
      const matchesFav = !onlyFavorites || c.isFavorite;

      return matchesSearch && matchesCategory && matchesFav;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return a.issueDate.localeCompare(b.issueDate);
        case 'hours-desc':
          return (b.hours || 0) - (a.hours || 0);
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'date-desc':
        default:
          return b.issueDate.localeCompare(a.issueDate);
      }
    });

  const totalHours = certificates.reduce((acc, c) => acc + (c.hours || 0), 0);
  const favoriteCount = certificates.filter((c) => c.isFavorite).length;

  const loadFileIntoForm = (file: File) => {
    setFileError(null);
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O limite é 4MB — comprima a imagem ou o PDF antes de enviar.`);
      return;
    }

    setFileName(file.name);
    const isPdf = file.type === 'application/pdf';
    setFileType(isPdf ? 'pdf' : 'image');

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFilePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFileIntoForm(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    loadFileIntoForm(file);
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    const newSkill = skillInput.trim();
    if (!formData.skills?.includes(newSkill)) {
      setFormData({
        ...formData,
        skills: [...(formData.skills || []), newSkill],
      });
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills?.filter((s) => s !== skillToRemove) || [],
    });
  };

  // AI Auto-Fill Certificate with Gemini
  const handleAiAutoFill = async () => {
    setIsAnalyzing(true);
    try {
      const res = await GeminiApiService.analyzeCertificate({
        title: formData.title || fileName || 'Certificado Google 2026',
        issuer: formData.issuer || 'Google',
        imageBase64: filePreview || undefined,
      });

      setFormData((prev) => ({
        ...prev,
        title: res.suggestedTitle || prev.title,
        issuer: res.issuer || prev.issuer,
        category: res.category || prev.category,
        description: res.summary || prev.description,
        skills: Array.from(new Set([...(prev.skills || []), ...(res.skills || [])])),
      }));

      // Trigger soft celebratory confetti
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#1A73E8', '#34A853', '#FBBC04', '#EA4335'],
      });
    } catch (err: any) {
      console.warn('Erro na IA:', err);
      alert(`Não foi possível preencher automaticamente com a IA: ${err?.message || 'tente novamente em instantes.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    setIsSaving(true);
    try {
      const newCert: Certificate = {
        id: formData.id || crypto.randomUUID(),
        title: formData.title.trim(),
        issuer: (formData.issuer || 'Google').trim(),
        issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
        category: (formData.category || 'Outros').trim(),
        description: (formData.description || '').trim(),
        fileData: filePreview || undefined,
        fileName: fileName || undefined,
        fileType: fileType,
        skills: (formData.skills || []).map((s) => s.trim()).filter(Boolean),
        credentialId: formData.credentialId,
        credentialUrl: formData.credentialUrl,
        hours: Number(formData.hours) || 0,
        isFavorite: formData.isFavorite || false,
        createdAt: formData.createdAt || new Date().toISOString(),
      };

      await onSaveCertificate(newCert);

      // Trigger Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1A73E8', '#EA4335', '#FBBC04', '#34A853'],
      });

      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Não foi possível salvar o certificado. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      issuer: 'Google Cloud Skills Boost',
      issueDate: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      skills: [],
      credentialId: '',
      credentialUrl: '',
      hours: 10,
      isFavorite: false,
    });
    setFilePreview(null);
    setFileName('');
    setFileError(null);
    setIsEditMode(false);
  };

  const openEditModal = (cert: Certificate) => {
    setFormData({ ...cert });
    setFilePreview(cert.fileData || null);
    setFileName(cert.fileName || '');
    setFileType(cert.fileType || 'image');
    setFileError(null);
    setIsEditMode(true);
    setSelectedCert(null);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (cert: Certificate) => {
    if (!confirm('Deseja realmente remover este certificado?')) return;
    setDeletingId(cert.id);
    try {
      await onDeleteCertificate(cert.id);
      setSelectedCert(null);
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir o certificado. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExportSelection = (id: string) => {
    setSelectedExportIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmExport = () => {
    const toExport = certificates.filter((c) => selectedExportIds.has(c.id));
    exportPortfolioAsPdf(profile, toExport);
    setIsExportSelectOpen(false);
  };

  const toggleFavorite = async (cert: Certificate) => {
    await onSaveCertificate({
      ...cert,
      isFavorite: !cert.isFavorite,
    });
  };

  // Close the export menu on outside click or Esc
  useEffect(() => {
    if (!isExportMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExportMenuOpen]);

  // Esc-to-close + basic focus trap for whichever modal is open
  useEffect(() => {
    const modalRef = isAddModalOpen
      ? addModalRef
      : isExportSelectOpen
      ? exportSelectModalRef
      : selectedCert
      ? detailModalRef
      : null;
    if (!modalRef) return;

    const focusables = () =>
      Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        ) || []
      );

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddModalOpen) setIsAddModalOpen(false);
        else if (isExportSelectOpen) setIsExportSelectOpen(false);
        else setSelectedCert(null);
        return;
      }
      if (e.key === 'Tab') {
        const nodes = focusables();
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isAddModalOpen, isExportSelectOpen, selectedCert]);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-15">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-[#1A73E8]" />
            <span>Certificados e Badges</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen((v) => !v)}
              disabled={certificates.length === 0}
              aria-haspopup="menu"
              aria-expanded={isExportMenuOpen}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Exportar todos os certificados do portfólio"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <div
                role="menu"
                className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-40 rounded-xl bg-white border border-gray-200 shadow-lg p-1.5 z-20"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setSelectedExportIds(new Set(certificates.map((c) => c.id)));
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
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1A73E8] hover:bg-[#1A73E8] text-white font-semibold text-sm shadow-sm transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Novo certificado</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {certificates.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center shrink-0">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{certificates.length}</p>
              <p className="text-[11px] text-gray-500 font-medium">Certificados</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#34A853]/10 text-[#34A853] flex items-center justify-center shrink-0">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{totalHours}h</p>
              <p className="text-[11px] text-gray-500 font-medium">Horas de estudo</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FBBC04]/10 text-[#9E5D00] flex items-center justify-center shrink-0">
              <Star className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{favoriteCount}</p>
              <p className="text-[11px] text-gray-500 font-medium">Favoritos</p>
            </div>
          </div>
        </div>
      )}

      {/* Badges / Gamification Showcase */}
      <BadgesShowcase
        certificates={certificates}
        prompts={prompts}
        posts={posts}
        userBadges={userBadges}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-certificates-input"
              type="text"
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

          {/* Favorites Filter & View Mode Toggle */}
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

        {/* Category Pills */}
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
                      ? 'bg-[#1A73E8] text-white shadow-xs'
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

      {/* Certificates Content Area */}
      {filteredCertificates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nada encontrado</h3>
          {(searchQuery || selectedCategory !== 'Todos') && (
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Tente ajustar seus filtros ou termo de busca.
            </p>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCertificates.map((cert) => {
            const isGoogleTheme = cert.category.includes('Google') || cert.category.includes('Gemini');
            return (
              <div
                key={cert.id}
                id={`cert-card-${cert.id}`}
                className="group relative flex flex-col bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-[#1A73E8]/40 transition-all overflow-hidden"
              >
                {/* Visual Header / Certificate Preview */}
                <div 
                  onClick={() => setSelectedCert(cert)}
                  className="relative h-44 w-full bg-gradient-to-br from-[#F1F5F9] via-[#E2E8F0] to-[#EEF2F6] flex items-center justify-center p-4 cursor-pointer overflow-hidden group-hover:opacity-95"
                >
                  {cert.fileData ? (
                    cert.fileType === 'pdf' ? (
                      <div className="flex flex-col items-center gap-2 text-gray-600">
                        <FileText className="w-12 h-12 text-[#EA4335]" />
                        <span className="text-xs font-semibold bg-white/90 px-2 py-0.5 rounded-md shadow-xs">
                          Documento PDF
                        </span>
                      </div>
                    ) : (
                      <img
                        src={cert.fileData}
                        alt={cert.title}
                        className="w-full h-full object-contain rounded-xl shadow-xs"
                      />
                    )
                  ) : (
                    /* Default Google Emblem */
                    <div className="relative flex flex-col items-center justify-center text-center p-4">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-200 flex items-center justify-center mb-2">
                        <Award className={`w-8 h-8 ${isGoogleTheme ? 'text-[#1A73E8]' : 'text-[#34A853]'}`} />
                      </div>
                      <span className="text-xs font-bold text-gray-800 line-clamp-1">{cert.issuer}</span>
                      <span className="text-[11px] text-gray-500">Certificado Verificado</span>
                    </div>
                  )}

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(cert);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-400 hover:text-[#FBBC04] shadow-xs transition-all"
                    aria-label="Favoritar certificado"
                    title="Favoritar Certificado"
                  >
                    <Star className={`w-4 h-4 ${cert.isFavorite ? 'fill-[#FBBC04] text-[#FBBC04]' : ''}`} />
                  </button>
                </div>

                {/* Card Body */}
                <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">{cert.issuer}</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDateBR(cert.issueDate)}</span>
                      </div>
                    </div>

                    <h3 
                      onClick={() => setSelectedCert(cert)}
                      className="font-bold text-gray-900 text-base leading-snug cursor-pointer hover:text-[#1A73E8] line-clamp-2"
                    >
                      {cert.title}
                    </h3>

                    {cert.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {cert.description}
                      </p>
                    )}
                  </div>

                  {/* Skills Chips */}
                  {cert.skills && cert.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cert.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700"
                        >
                          #{skill}
                        </span>
                      ))}
                      {cert.skills.length > 3 && (
                        <span className="text-[11px] text-gray-400 self-center font-medium">
                          +{cert.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {cert.hours ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                          <Clock className="w-3 h-3 text-[#34A853]" />
                          <span>{cert.hours}h</span>
                        </span>
                      ) : null}

                      {cert.credentialId && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          ID: {cert.credentialId.slice(0, 10)}...
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(cert)}
                        className="p-1.5 rounded-xl bg-gray-100 hover:bg-[#1A73E8]/10 hover:text-[#1A73E8] text-gray-600 transition-all"
                        aria-label="Editar certificado"
                        title="Editar Certificado"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="p-1.5 rounded-xl bg-gray-100 hover:bg-[#1A73E8]/10 hover:text-[#1A73E8] text-gray-600 transition-all"
                        aria-label="Visualizar Detalhes"
                        title="Visualizar Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        
        /* Table / List View */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-sm">
              <thead className="bg-[#F8FAFD] text-gray-600 text-xs font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Certificado</th>
                  <th className="py-3.5 px-4">Emissor</th>
                  <th className="py-3.5 px-4">Categoria</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4">Carga</th>
                  <th className="py-3.5 px-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <div className="flex items-center justify-center gap-2.5">
                        <Award className="w-4 h-4 text-[#1A73E8] shrink-0" />
                        <span
                          onClick={() => setSelectedCert(cert)}
                          className="hover:text-[#1A73E8] cursor-pointer"
                        >
                          {cert.title}
                        </span>
                        {cert.isFavorite && (
                          <Star className="w-3.5 h-3.5 fill-[#FBBC04] text-[#FBBC04]" />
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs">{cert.issuer}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {cert.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{formatDateBR(cert.issueDate)}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">{cert.hours || 0}h</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onCreatePostFromCertificate(cert)}
                          className="p-1.5 rounded-lg text-[#D93025] hover:bg-[#EA4335]/10"
                          aria-label="Criar post no Gemini"
                          title="Criar post no Gemini"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(cert)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                          aria-label="Editar certificado"
                          title="Editar Certificado"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                          aria-label="Visualizar detalhes"
                          title="Visualizar Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: ADD/EDIT CERTIFICATE -------------------- */}
      {isAddModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div ref={addModalRef} className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-8 space-y-6">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center">
                  {isEditMode ? <Pencil className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    {isEditMode ? 'Editar Certificado' : 'Upload de Certificado'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isEditMode ? 'Atualize os dados do certificado' : 'Adicione certificados ou badges'}
                  </p>
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

            {/* Dropzone Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-[#1A73E8] bg-[#F8FAFD] rounded-2xl p-6 text-center cursor-pointer transition-all space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              
              {filePreview ? (
                <div className="flex items-center justify-center gap-4">
                  {fileType === 'pdf' ? (
                    <FileText className="w-12 h-12 text-[#EA4335]" />
                  ) : (
                    <img src={filePreview} alt="Preview" className="h-20 max-w-xs object-contain rounded-lg shadow-xs" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{fileName}</p>
                    <p className="text-xs text-green-600 font-medium">Arquivo carregado com sucesso!</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Arraste ou clique para selecionar o certificado
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Suporta imagens (PNG, JPG, WebP) e arquivos PDF, até 4MB</p>
                  </div>
                </>
              )}
            </div>

            {fileError && (
              <p role="alert" className="text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5">
                {fileError}
              </p>
            )}

            {/* AI Auto-Fill */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleAiAutoFill}
                disabled={isAnalyzing}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#1A73E8] to-[#34A853] hover:shadow-md text-xs font-bold text-white shadow-sm flex items-center gap-1.5 shrink-0 transition-all active:scale-95 disabled:opacity-60 disabled:active:scale-100"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Lendo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto Preencher</span>
                  </>
                )}
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Título do Certificado *
                </label>
                <input
                  id="cert-form-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-[#1A73E8]/30 focus:border-[#1A73E8] bg-[#F8FAFD]"
                />
              </div>

              {/* Issuer & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Emissor / Organização
                  </label>
                  <input
                    id="cert-form-issuer"
                    type="text"
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-[#1A73E8]/30 focus:border-[#1A73E8] bg-[#F8FAFD]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <input
                    id="cert-form-category"
                    type="text"
                    list="cert-category-suggestions"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-[#1A73E8]/30 focus:border-[#1A73E8] bg-[#F8FAFD]"
                  />
                  {dynamicCategories.length > 0 && (
                    <datalist id="cert-category-suggestions">
                      {dynamicCategories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>

              {/* Issue Date & Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Data de Emissão
                  </label>
                  <DatePicker
                    id="cert-form-date"
                    value={formData.issueDate || ''}
                    onChange={(date) => setFormData({ ...formData, issueDate: date })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Carga Horária (Horas)
                  </label>
                  <input
                    id="cert-form-hours"
                    type="number"
                    min="0"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-[#1A73E8]/30 focus:border-[#1A73E8] bg-[#F8FAFD]"
                  />
                </div>
              </div>

              {/* Skills Tags Manager */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Habilidades e Competências
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
                  >
                    Adicionar
                  </button>
                </div>

                {formData.skills && formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20"
                      >
                        #{skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-[#EA4335]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description / Summary */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD] focus:ring-2 focus:ring-[#1A73E8]/30"
                />
              </div>

              {/* Credential URL / ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Código de Validação
                  </label>
                  <input
                    type="text"
                    value={formData.credentialId || ''}
                    onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    URL de Verificação
                  </label>
                  <input
                    type="url"
                    value={formData.credentialUrl || ''}
                    onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F8FAFD]"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  id="submit-cert-form"
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#1A73E8] hover:bg-[#1A73E8] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Salvando...' : isEditMode ? 'Salvar' : 'Salvar Certificado'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* -------------------- MODAL: VIEW CERTIFICATE DETAILS -------------------- */}
      {selectedCert && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div ref={detailModalRef} className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-8 space-y-6">

            {/* Top Bar */}
            <div className="flex items-center justify-end pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavorite(selectedCert)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#FBBC04]"
                  aria-label="Favoritar"
                  title="Favoritar"
                >
                  <Star className={`w-5 h-5 ${selectedCert.isFavorite ? 'fill-[#FBBC04] text-[#FBBC04]' : ''}`} />
                </button>
                <button
                  onClick={() => setSelectedCert(null)}
                  aria-label="Fechar"
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate Preview Display */}
            {selectedCert.fileData && (
              <div className="bg-gray-900/5 rounded-2xl p-4 flex items-center justify-center max-h-80 overflow-hidden border border-gray-200">
                {selectedCert.fileType === 'pdf' ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <FileText className="w-16 h-16 text-[#EA4335]" />
                    <p className="text-sm font-semibold text-gray-800">{selectedCert.fileName || 'Certificado.pdf'}</p>
                    <a
                      href={selectedCert.fileData}
                      download={selectedCert.fileName || 'certificado.pdf'}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-800 shadow-xs hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 text-[#1A73E8]" />
                      <span>Baixar Documento PDF</span>
                    </a>
                  </div>
                ) : (
                  <img
                    src={selectedCert.fileData}
                    alt={selectedCert.title}
                    className="max-h-72 w-auto object-contain rounded-lg shadow-sm"
                  />
                )}
              </div>
            )}

            {/* Info Body */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{selectedCert.issuer}</span>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{selectedCert.title}</h2>
              </div>

              {selectedCert.description && (
                <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-gray-200 text-sm text-gray-700 leading-relaxed">
                  {selectedCert.description}
                </div>
              )}

              {/* Skills */}
              {selectedCert.skills && selectedCert.skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Habilidades Desenvolvidas</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCert.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20"
                      >
                        #{skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra Details Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[11px] text-gray-500 uppercase font-semibold">Data de Emissão</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{formatDateBR(selectedCert.issueDate)}</p>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[11px] text-gray-500 uppercase font-semibold">Carga Horária</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedCert.hours || 0} horas</p>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[11px] text-gray-500 uppercase font-semibold">Categoria</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedCert.category}</p>
                </div>

                {selectedCert.credentialId && (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-[11px] text-gray-500 uppercase font-semibold">ID da Credencial</span>
                    <p className="text-xs font-mono font-bold text-gray-900 mt-0.5 truncate">{selectedCert.credentialId}</p>
                  </div>
                )}

                {selectedCert.credentialUrl && (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-[11px] text-gray-500 uppercase font-semibold">Link de Validação</span>
                    <a
                      href={selectedCert.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-[#1A73E8] hover:underline mt-0.5"
                    >
                      <span>Verificar</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => handleDelete(selectedCert)}
                disabled={deletingId === selectedCert.id}
                aria-label="Excluir certificado"
                title="Excluir Certificado"
                className="p-2.5 rounded-xl text-[#EA4335] border border-gray-200 hover:bg-[#EA4335]/10 transition-all active:scale-95 disabled:opacity-50"
              >
                {deletingId === selectedCert.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => {
                  const certToUse = selectedCert;
                  setSelectedCert(null);
                  onCreatePostFromCertificate(certToUse);
                }}
                aria-label="Gerar post comemorativo no Gemini"
                title="Gerar Post comemorativo no Gemini"
                className="p-2.5 rounded-xl bg-[#EA4335] hover:bg-[#D93025] text-white shadow-sm transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-[#FBBC04]" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------- MODAL: SELECT CERTIFICATES TO EXPORT -------------------- */}
      {isExportSelectOpen && (
        <div role="dialog" aria-modal="true" aria-label="Selecionar certificados para exportar" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div ref={exportSelectModalRef} className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Exportar</h3>
                  <p className="text-xs text-gray-500">Escolha o que deve ser exportado</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportSelectOpen(false)}
                aria-label="Fechar"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                {selectedExportIds.size} de {certificates.length} selecionado{certificates.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelectedExportIds(
                    selectedExportIds.size === certificates.length ? new Set() : new Set(certificates.map((c) => c.id))
                  )
                }
                className="text-xs font-bold text-[#1A73E8] hover:underline"
              >
                {selectedExportIds.size === certificates.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
              {certificates.map((cert) => (
                <label
                  key={cert.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedExportIds.has(cert.id)}
                    onChange={() => toggleExportSelection(cert.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1A73E8] focus:ring-[#1A73E8]/30 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{cert.title}</p>
                    <p className="text-xs text-gray-500 truncate">{cert.issuer} · {formatDateBR(cert.issueDate)}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="p-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsExportSelectOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmExport}
                disabled={selectedExportIds.size === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#1A73E8] hover:bg-[#1A73E8] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className="w-4 h-4" />
                <span>Exportar {selectedExportIds.size > 0 ? `(${selectedExportIds.size})` : ''}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
