import React, { useEffect, useRef, useState } from 'react';
import { Camera, Plus, Search, X, Trash2, Upload, Calendar, Loader2, ImageOff } from 'lucide-react';
import { GalleryPhoto } from '../types';
import { DatePicker } from './DatePicker';
import { usePersistedState } from '../hooks/usePersistedState';

interface GalleryModuleProps {
  photos: GalleryPhoto[];
  onSavePhoto: (photo: GalleryPhoto) => Promise<void>;
  onDeletePhoto: (id: string) => Promise<void>;
}

const DEFAULT_FORM: Partial<GalleryPhoto> = {
  imageData: '',
  caption: '',
  category: '',
  takenAt: '',
};

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

function formatDateBR(isoDate?: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

export const GalleryModule: React.FC<GalleryModuleProps> = ({ photos, onSavePhoto, onDeletePhoto }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const [isAddModalOpen, setIsAddModalOpen] = usePersistedState('gsa_gallery_modal_open', false);
  const [formData, setFormData] = usePersistedState<Partial<GalleryPhoto>>('gsa_gallery_form_draft', DEFAULT_FORM);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<GalleryPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dynamicCategories = Array.from(
    photos.reduce((map, p) => {
      const trimmed = p.category?.trim();
      if (trimmed && !map.has(trimmed.toLowerCase())) {
        map.set(trimmed.toLowerCase(), trimmed);
      }
      return map;
    }, new Map<string, string>()).values()
  );

  const filteredPhotos = photos.filter((p) => {
    const matchesSearch =
      p.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Todos' || p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setFileError(null);
  };

  const loadFileIntoForm = (file: File) => {
    setFileError(null);
    if (!file.type.startsWith('image/')) {
      setFileError('Envie um arquivo de imagem (PNG, JPG, WebP).');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFileError(`Imagem muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O limite é 4MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, imageData: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFileIntoForm(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    loadFileIntoForm(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageData) return;

    setIsSaving(true);
    try {
      const photo: GalleryPhoto = {
        id: formData.id || crypto.randomUUID(),
        imageData: formData.imageData,
        caption: (formData.caption || '').trim(),
        category: (formData.category || '').trim(),
        takenAt: formData.takenAt || undefined,
        createdAt: formData.createdAt || new Date().toISOString(),
      };

      await onSavePhoto(photo);
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Não foi possível salvar a foto. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (photo: GalleryPhoto) => {
    if (!confirm('Deseja realmente remover esta foto?')) return;
    setDeletingId(photo.id);
    try {
      await onDeletePhoto(photo.id);
      setViewingPhoto(null);
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir a foto. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  };

  // Esc-to-close for whichever modal is open
  useEffect(() => {
    if (!isAddModalOpen && !viewingPhoto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setViewingPhoto(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isAddModalOpen, viewingPhoto]);

  return (
    <div className="space-y-6">

      {/* Header & New Photo Button */}
      <div className="flex items-center justify-between gap-4 pt-15">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Camera className="w-6 h-6 text-[#EA4335]" />
            <span>Galeria</span>
          </h2>
        </div>

        <button
          id="btn-new-photo"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          aria-label="Nova foto"
          title="Nova foto"
          className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova foto</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-gallery-input"
            type="text"
            placeholder="Buscar por legenda ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EA4335]/30 focus:border-[#EA4335] bg-gray-50"
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
                      ? 'bg-[#EA4335] text-white shadow-xs'
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

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#EA4335]/10 text-[#EA4335] flex items-center justify-center mx-auto">
            <ImageOff className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhuma foto encontrada</h3>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <button
              key={photo.id}
              id={`gallery-photo-${photo.id}`}
              onClick={() => setViewingPhoto(photo)}
              className="group relative flex flex-col bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-[#EA4335]/40 transition-all overflow-hidden text-left"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <img
                  src={photo.imageData}
                  alt={photo.caption || 'Foto do programa'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {photo.category && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white">
                    {photo.category}
                  </span>
                )}
              </div>
              {(photo.caption || photo.takenAt) && (
                <div className="p-2.5 space-y-0.5">
                  {photo.caption && (
                    <p className="text-xs font-semibold text-gray-800 line-clamp-1">{photo.caption}</p>
                  )}
                  {photo.takenAt && (
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateBR(photo.takenAt)}
                    </p>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* -------------------- MODAL: ADD PHOTO -------------------- */}
      {isAddModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">

              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EA4335]/10 text-[#EA4335] flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Nova Foto</h3>
                    <p className="text-xs text-gray-500">Registre momentos do programa</p>
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

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-[#EA4335] bg-[#F8FAFD] rounded-2xl p-6 text-center cursor-pointer transition-all space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {formData.imageData ? (
                  <div className="flex items-center justify-center gap-4">
                    <img src={formData.imageData} alt="Prévia" className="h-24 max-w-xs object-contain rounded-lg shadow-xs" />
                    <p className="text-xs text-green-600 font-medium">Foto carregada com sucesso!</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#EA4335]/10 text-[#EA4335] flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">Arraste ou clique para selecionar</p>
                  </>
                )}
              </div>

              {fileError && (
                <p role="alert" className="text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5">
                  {fileError}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Legenda
                  </label>
                  <input
                    type="text"
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#EA4335]/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      list="gallery-category-suggestions"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                    />
                    {dynamicCategories.length > 0 && (
                      <datalist id="gallery-category-suggestions">
                        {dynamicCategories.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Data (opcional)
                    </label>
                    <DatePicker
                      id="gallery-form-date"
                      value={formData.takenAt || ''}
                      onChange={(date) => setFormData({ ...formData, takenAt: date })}
                    />
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
                    disabled={isSaving || !formData.imageData}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#EA4335] hover:bg-[#D93025] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* -------------------- MODAL: VIEW PHOTO -------------------- */}
      {viewingPhoto && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="overflow-y-auto">
              <div className="relative bg-gray-900">
                <img src={viewingPhoto.imageData} alt={viewingPhoto.caption || 'Foto do programa'} className="w-full max-h-[60vh] object-contain" />
                <button
                  onClick={() => setViewingPhoto(null)}
                  aria-label="Fechar"
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {viewingPhoto.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700 mb-1">
                      {viewingPhoto.category}
                    </span>
                  )}
                  {viewingPhoto.caption && <p className="font-bold text-gray-900 truncate">{viewingPhoto.caption}</p>}
                  {viewingPhoto.takenAt && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateBR(viewingPhoto.takenAt)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(viewingPhoto)}
                  disabled={deletingId === viewingPhoto.id}
                  className="p-2.5 rounded-xl text-[#EA4335] border border-gray-200 hover:bg-[#EA4335]/10 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  aria-label="Excluir foto"
                  title="Excluir Foto"
                >
                  {deletingId === viewingPhoto.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
