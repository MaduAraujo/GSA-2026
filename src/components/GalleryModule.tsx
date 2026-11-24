import React, { useState } from 'react';
import { useUrlState } from '../hooks/useUrlState';
import { EmptyState, NoResults } from './ui/EmptyState';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Camera, Download, ImagePlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { type GalleryPhoto } from '../types';
import { usePersistedState } from '../hooks/usePersistedState';
import { useUndoableDelete } from '../hooks/useUndoableDelete';
import { useToast } from '../app/ToastProvider';
import { formatDateBR } from '../utils/date';
import { SelectDropdown } from './SelectDropdown';
import { GalleryCard } from './gallery/GalleryCard';
import { GalleryUploadModal } from './gallery/GalleryUploadModal';
import { GalleryViewerModal } from './gallery/GalleryViewerModal';
import { downloadMedia, groupByMonth, photoDate } from './gallery/galleryMedia';

interface GalleryModuleProps {
  photos: GalleryPhoto[];
  onSavePhoto: (photo: GalleryPhoto, videoFile?: File) => Promise<void>;
  onDeletePhoto: (id: string) => Promise<void>;
}

type MediaFilter = 'all' | 'image' | 'video';
type SortOrder = 'recent' | 'oldest';

const ALL_CATEGORIES = 'Todos';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigas' },
];

const MEDIA_FILTERS: { value: MediaFilter; label: string }[] = [
  { value: 'all', label: 'Tudo' },
  { value: 'image', label: 'Fotos' },
  { value: 'video', label: 'Vídeos' },
];

export const GalleryModule: React.FC<GalleryModuleProps> = ({ photos, onSavePhoto, onDeletePhoto }) => {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useUrlState('q');
  const [selectedCategory, setSelectedCategory] = useUrlState('categoria', ALL_CATEGORIES);
  const [mediaFilterParam, setMediaFilter] = useUrlState('midia', 'all');
  const mediaFilter: MediaFilter = MEDIA_FILTERS.find((f) => f.value === mediaFilterParam)?.value ?? 'all';
  const [sortOrder, setSortOrder] = usePersistedState<SortOrder>('gsa_gallery_sort', 'recent');
  const [formTarget, setFormTarget] = useState<{ photo?: GalleryPhoto } | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const pendingDelete = useUndoableDelete<GalleryPhoto>({
    commit: (photo) => onDeletePhoto(photo.id),
    message: 'Item excluído da galeria.',
    errorMessage: 'Não foi possível excluir. Tente novamente.',
  });

  const visiblePhotos = photos.filter((p) => !pendingDelete.pendingIds.has(p.id));
  const videoCount = visiblePhotos.filter((p) => p.mediaType === 'video').length;
  const imageCount = visiblePhotos.length - videoCount;

  const categoryCounts = Array.from(
    visiblePhotos
      .reduce((map, p) => {
        const trimmed = p.category?.trim();
        if (!trimmed) return map;
        const key = trimmed.toLowerCase();
        const entry = map.get(key);
        map.set(key, { name: entry?.name ?? trimmed, count: (entry?.count ?? 0) + 1 });
        return map;
      }, new Map<string, { name: string; count: number }>())
      .values(),
  ).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
  const categoryNames = categoryCounts.map((c) => c.name);

  const activeCategory = categoryNames.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())
    ? selectedCategory
    : ALL_CATEGORIES;

  const query = searchQuery.trim().toLowerCase();
  const filteredPhotos = visiblePhotos
    .filter((p) => {
      const matchesSearch =
        !query ||
        p.caption.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (!!p.takenAt && formatDateBR(p.takenAt).includes(query));
      const matchesCategory =
        activeCategory === ALL_CATEGORIES || p.category.trim().toLowerCase() === activeCategory.toLowerCase();
      const matchesMedia = mediaFilter === 'all' || (p.mediaType ?? 'image') === mediaFilter;
      return matchesSearch && matchesCategory && matchesMedia;
    })
    .sort((a, b) => {
      const byDate = photoDate(a).localeCompare(photoDate(b)) || a.createdAt.localeCompare(b.createdAt);
      return sortOrder === 'oldest' ? byDate : -byDate;
    });
  const groups = groupByMonth(filteredPhotos);

  const hasActiveFilters = !!query || activeCategory !== ALL_CATEGORIES || mediaFilter !== 'all';
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(ALL_CATEGORIES);
    setMediaFilter('all');
  };

  const viewingIndex = viewingId ? filteredPhotos.findIndex((p) => p.id === viewingId) : -1;

  const openCreate = () => setFormTarget({});
  const openEdit = (photo: GalleryPhoto) => {
    setViewingId(null);
    setFormTarget({ photo });
  };

  const handleDelete = (photo: GalleryPhoto) => {
    if (viewingId === photo.id) {
      const next = filteredPhotos[viewingIndex + 1] ?? filteredPhotos[viewingIndex - 1];
      setViewingId(next?.id ?? null);
    }
    pendingDelete.remove(photo);
  };

  const handleDownload = (photo: GalleryPhoto) => {
    downloadMedia(photo).catch((err) => {
      console.error(err);
      toast.show({ message: 'Não foi possível baixar o arquivo.', tone: 'error' });
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Camera} iconClassName="text-primary" title="Galeria">
        <Button
          id="btn-new-photo"
          onClick={openCreate}
          aria-label="Adicionar fotos ou vídeos"
          title="Adicionar fotos ou vídeos"
          variant="primary"
          collapseLabel
          icon={<Plus className="w-4 h-4" />}
        >
          Adicionar
        </Button>
      </PageHeader>

      {visiblePhotos.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          iconClassName="bg-primary/10 text-primary"
          title="Sua galeria está vazia"
          description="Guarde fotos e vídeos de workshops, sessões e encontros do programa. Você pode enviar vários arquivos de uma vez."
          action={{ label: 'Adicionar primeiras fotos', onClick: openCreate, icon: <Plus className="w-4 h-4" /> }}
        />
      ) : (
        <>
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-gallery-input"
                type="text"
                placeholder="Buscar por legenda, categoria ou data..."
                aria-label="Buscar na galeria"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 rounded-xl text-sm border border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/30 focus:border-danger bg-gray-50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpar busca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {categoryCounts.length > 0 && (
              <div
                role="group"
                aria-label="Filtrar por categoria"
                className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none"
              >
                {[{ name: ALL_CATEGORIES, count: visiblePhotos.length }, ...categoryCounts].map(({ name, count }) => {
                  const isSelected = activeCategory.toLowerCase() === name.toLowerCase();
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedCategory(name)}
                      aria-pressed={isSelected}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                      }`}
                    >
                      {name}{' '}
                      <span className={`tabular-nums ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              {imageCount > 0 && videoCount > 0 ? (
                <div role="group" aria-label="Tipo de mídia" className="inline-flex rounded-xl bg-gray-100 p-0.5">
                  {MEDIA_FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMediaFilter(value)}
                      aria-pressed={mediaFilter === value}
                      className={`px-3 py-1 rounded-[10px] text-xs font-semibold transition-all ${
                        mediaFilter === value ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <span />
              )}
              <div className="w-40">
                <SelectDropdown
                  value={sortOrder}
                  options={SORT_OPTIONS}
                  onChange={(value) => setSortOrder(value as SortOrder)}
                  ariaLabel="Ordenar"
                  buttonClassName="w-full px-3 py-1.5 pr-8 rounded-xl text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-700"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <p aria-live="polite" className="text-xs text-gray-600">
                {filteredPhotos.length} de {visiblePhotos.length} itens
              </p>
            )}
          </div>

          {filteredPhotos.length === 0 ? (
            <NoResults
              title="Nenhuma foto encontrada"
              description={
                query ? (
                  <>
                    Nenhum resultado para <span className="font-semibold">“{searchQuery.trim()}”</span> com os filtros
                    atuais.
                  </>
                ) : (
                  'Nenhum item corresponde aos filtros selecionados.'
                )
              }
              onClear={clearFilters}
            />
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.key} aria-label={group.label} className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-700 flex items-baseline gap-2">
                    {group.label}{' '}
                    <span className="text-xs font-medium text-gray-400 tabular-nums">{group.photos.length}</span>
                  </h3>
                  <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
                    {group.photos.map((photo) => (
                      <GalleryCard
                        key={photo.id}
                        photo={photo}
                        onOpen={() => setViewingId(photo.id)}
                        actions={[
                          { label: 'Editar', icon: Pencil, onSelect: () => openEdit(photo) },
                          { label: 'Baixar', icon: Download, onSelect: () => handleDownload(photo) },
                          { label: 'Excluir', icon: Trash2, tone: 'danger', onSelect: () => handleDelete(photo) },
                        ]}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {formTarget && (
        <GalleryUploadModal
          photo={formTarget.photo}
          categories={categoryNames}
          onSave={onSavePhoto}
          onClose={() => setFormTarget(null)}
        />
      )}

      {viewingIndex >= 0 && (
        <GalleryViewerModal
          photos={filteredPhotos}
          index={viewingIndex}
          onNavigate={(index) => setViewingId(filteredPhotos[index]?.id ?? null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onClose={() => setViewingId(null)}
        />
      )}
    </div>
  );
};
