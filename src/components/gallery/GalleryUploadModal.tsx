import { Camera, CircleAlert, CircleCheck, Loader2, PlayCircle, RefreshCw, Upload, X } from 'lucide-react';
import { buttonClasses } from '../ui/buttonClasses';
import { Modal, ModalHeader } from '../ui/Modal';
import React, { useEffect, useId, useRef, useState } from 'react';
import { useToast } from '../../app/ToastProvider';
import { useScrollLock } from '../../hooks/useScrollLock';
import type { GalleryPhoto } from '../../types';
import { formatDateBR } from '../../utils/date';
import { DatePicker } from '../DatePicker';
import { detectCaptureDate, mediaKindOf, prepareImage, validateMediaFile, type MediaKind } from './galleryMedia';

type ItemStatus = 'processing' | 'ready' | 'saving' | 'done' | 'error';

interface QueueItem {
  id: string;
  file: File;
  kind: MediaKind;
  previewUrl: string;
  caption: string;
  takenAt?: string;
  imageData?: string;
  status: ItemStatus;
  error?: string;
}

interface GalleryUploadModalProps {
  photo?: GalleryPhoto;
  categories: string[];
  onSave: (photo: GalleryPhoto, videoFile?: File) => Promise<void>;
  onClose: () => void;
}

const fieldLabel = 'block text-sm font-medium text-gray-700 mb-1';
const textInput =
  'w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/30 focus:border-danger';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function GalleryUploadModal({ photo, categories, onSave, onClose }: GalleryUploadModalProps) {
  const isEditing = !!photo;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef(new Set<string>());
  const titleId = useId();
  const toast = useToast();

  const [items, setItems] = useState<QueueItem[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [caption, setCaption] = useState(photo?.caption ?? '');
  const [category, setCategory] = useState(photo?.category ?? '');
  const [date, setDate] = useState(photo?.takenAt ?? '');

  const replacement = isEditing ? items[0] : undefined;
  const savableItems = items.filter((item) => item.status !== 'done' && (item.kind === 'video' || !!item.imageData));
  const isPristine = isEditing
    ? !replacement && caption === photo.caption && category === photo.category && date === (photo.takenAt ?? '')
    : items.length === 0;

  const requestClose = () => {
    if (!isSaving) onClose();
  };
  useScrollLock();

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const updateItem = (id: string, patch: Partial<QueueItem>) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const releaseItem = (item: QueueItem) => {
    URL.revokeObjectURL(item.previewUrl);
    objectUrlsRef.current.delete(item.previewUrl);
  };

  const removeItem = (item: QueueItem) => {
    releaseItem(item);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList).slice(0, isEditing ? 1 : undefined);
    const errors: string[] = [];
    const added: QueueItem[] = [];

    for (const file of files) {
      const error = validateMediaFile(file);
      const kind = mediaKindOf(file);
      if (error || !kind) {
        errors.push(error ?? `“${file.name}” não é suportado.`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(previewUrl);
      added.push({
        id: crypto.randomUUID(),
        file,
        kind,
        previewUrl,
        caption: '',
        status: kind === 'image' ? 'processing' : 'ready',
      });
    }

    setRejections(errors);
    if (added.length === 0) return;

    if (isEditing) {
      items.forEach(releaseItem);
      setItems(added);
    } else {
      setItems((prev) => [...prev, ...added]);
    }

    for (const item of added) {
      void (async () => {
        const takenAt = await detectCaptureDate(item.file);
        if (isEditing && takenAt) setDate((current) => current || takenAt);
        if (item.kind === 'video') {
          updateItem(item.id, { takenAt });
          return;
        }
        try {
          updateItem(item.id, { takenAt, imageData: await prepareImage(item.file), status: 'ready' });
        } catch (err) {
          updateItem(item.id, { takenAt, status: 'error', error: (err as Error).message });
        }
      })();
    }
  };

  const saveEdit = async () => {
    if (!photo) return;
    const imageData = replacement ? (replacement.imageData ?? '') : photo.imageData;
    await onSave(
      {
        ...photo,
        imageData,
        mediaType: replacement?.kind ?? photo.mediaType,
        caption: caption.trim(),
        category: category.trim(),
        takenAt: date || undefined,
      },
      replacement?.kind === 'video' ? replacement.file : undefined,
    );
    toast.show({ message: 'Alterações salvas.', tone: 'success' });
    onClose();
  };

  const saveNew = async () => {
    const queue = savableItems;
    const createdAt = new Date().toISOString();
    let failed = 0;

    for (const item of queue) {
      updateItem(item.id, { status: 'saving', error: undefined });
      try {
        await onSave(
          {
            id: item.id,
            imageData: item.imageData ?? '',
            mediaType: item.kind,
            caption: item.caption.trim(),
            category: category.trim(),
            takenAt: date || item.takenAt || undefined,
            createdAt,
          },
          item.kind === 'video' ? item.file : undefined,
        );
        updateItem(item.id, { status: 'done' });
      } catch (err) {
        console.error(err);
        failed++;
        updateItem(item.id, { status: 'error', error: 'Falha ao enviar. Tente novamente.' });
      }
    }

    if (failed === 0) {
      toast.show({
        message: `${plural(queue.length, 'item adicionado', 'itens adicionados')} à galeria.`,
        tone: 'success',
      });
      onClose();
    } else {
      toast.show({ message: `${failed} de ${queue.length} não puderam ser salvos.`, tone: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await (isEditing ? saveEdit() : saveNew());
    } catch (err) {
      console.error(err);
      toast.show({ message: 'Não foi possível salvar. Tente novamente.', tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const savingIndex = items.filter((item) => item.status === 'done').length + 1;
  const isProcessing = items.some((item) => item.status === 'processing');
  const replacementFailed = replacement?.kind === 'image' && !replacement.imageData;
  const canSubmit = isEditing
    ? !isPristine && !isProcessing && !replacementFailed
    : savableItems.length > 0 && !isProcessing;

  const submitLabel = isSaving
    ? isEditing
      ? 'Salvando...'
      : `Enviando ${Math.min(savingIndex, items.length)} de ${items.length}...`
    : isEditing || savableItems.length <= 1
      ? 'Salvar'
      : `Salvar ${savableItems.length} itens`;

  const editKind = replacement?.kind ?? photo?.mediaType ?? 'image';
  const heading = isEditing ? (editKind === 'video' ? 'Editar vídeo' : 'Editar foto') : 'Adicionar à galeria';

  const dropZone = (compact: boolean) => (
    <div
      role="button"
      tabIndex={0}
      aria-label={isEditing ? 'Trocar arquivo' : 'Selecionar fotos ou vídeos'}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isSaving) addFiles(e.dataTransfer.files);
      }}
      onClick={() => !isSaving && fileInputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          if (!isSaving) fileInputRef.current?.click();
        }
      }}
      className={`border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
        isDragging ? 'border-danger bg-danger/5 scale-[1.01]' : 'border-gray-300 hover:border-danger bg-surface-muted'
      } ${compact ? 'p-3' : 'p-6 space-y-3'}`}
    >
      {compact ? (
        <p className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-2">
          <Upload className="w-4 h-4 text-danger" />
          {isDragging ? 'Solte para adicionar' : 'Adicionar mais arquivos'}
        </p>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-800">
            {isDragging ? 'Solte os arquivos aqui' : 'Arraste ou clique para selecionar'}
          </p>
        </>
      )}
    </div>
  );

  const statusLine = (item: QueueItem) => {
    switch (item.status) {
      case 'processing':
        return (
          <span className="flex items-center gap-1 text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" /> Otimizando…
          </span>
        );
      case 'saving':
        return (
          <span className="flex items-center gap-1 text-primary">
            <Loader2 className="w-3 h-3 animate-spin" /> Enviando…
          </span>
        );
      case 'done':
        return (
          <span className="flex items-center gap-1 text-success-800">
            <CircleCheck className="w-3 h-3" /> Enviado
          </span>
        );
      case 'error':
        return (
          <span role="alert" className="flex items-center gap-1 text-danger-600">
            <CircleAlert className="w-3 h-3 shrink-0" /> {item.error}
          </span>
        );
      default:
        return (
          <span className="text-gray-500">
            {item.kind === 'video' ? 'Vídeo' : 'Foto'}
            {item.takenAt && ` · ${formatDateBR(item.takenAt)}`}
          </span>
        );
    }
  };

  const preview = (kind: MediaKind, src: string, alt: string, className: string) =>
    kind === 'video' ? (
      <div className={`relative ${className}`}>
        <video src={src} muted playsInline preload="metadata" className="w-full h-full object-cover" />
        <PlayCircle className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow" />
      </div>
    ) : (
      <img src={src} alt={alt} className={`object-cover ${className}`} />
    );

  return (
    <Modal onClose={requestClose} labelledBy={titleId}>
      <ModalHeader
        titleId={titleId}
        title={heading}
        subtitle="Registre momentos do programa"
        icon={Camera}
        iconClassName="bg-primary/10 text-primary"
        onClose={requestClose}
      />

      <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
        <div className="overflow-y-auto px-6 sm:px-8 py-5 space-y-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple={!isEditing}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />

          {isEditing ? (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 h-48 flex items-center justify-center">
                {replacement ? (
                  preview(replacement.kind, replacement.previewUrl, 'Prévia', 'w-full h-full object-contain')
                ) : editKind === 'video' ? (
                  <video src={photo.imageData} muted playsInline controls className="max-h-full" />
                ) : (
                  <img src={photo.imageData} alt="Prévia" className="max-h-full object-contain" />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0">{replacement ? statusLine(replacement) : null}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {replacement && (
                    <button
                      type="button"
                      onClick={() => removeItem(replacement)}
                      disabled={isSaving}
                      className="px-2.5 py-1.5 rounded-lg font-semibold text-gray-600 hover:bg-gray-100"
                    >
                      Desfazer troca
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold text-danger hover:bg-danger/10"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Trocar arquivo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {dropZone(items.length > 0)}
              {items.length > 0 && (
                <ul aria-label="Arquivos selecionados" className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className={`flex items-center gap-3 p-2 rounded-xl border ${
                        item.status === 'error' ? 'border-danger/40 bg-danger/5' : 'border-gray-200'
                      }`}
                    >
                      {preview(
                        item.kind,
                        item.previewUrl,
                        item.file.name,
                        'w-14 h-14 rounded-lg shrink-0 overflow-hidden bg-gray-100',
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <input
                          type="text"
                          value={item.caption}
                          onChange={(e) => updateItem(item.id, { caption: e.target.value })}
                          disabled={isSaving || item.status === 'done'}
                          placeholder="Legenda (opcional)"
                          aria-label={`Legenda de ${item.file.name}`}
                          className="w-full px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/30 focus:border-danger disabled:opacity-60"
                        />
                        <div className="text-2xs truncate">{statusLine(item)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item)}
                        disabled={isSaving || item.status === 'done'}
                        aria-label={`Remover ${item.file.name}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:invisible shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {rejections.length > 0 && (
            <div
              role="alert"
              className="text-xs font-semibold text-danger-600 bg-danger/10 border border-danger/20 rounded-xl px-3.5 py-2.5 space-y-1"
            >
              {rejections.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}

          {isEditing && (
            <div>
              <label htmlFor="gallery-legenda" className={fieldLabel}>
                Legenda
              </label>
              <textarea
                id="gallery-legenda"
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className={`${textInput} resize-y`}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="gallery-categoria" className={fieldLabel}>
                Categoria
              </label>
              <input
                id="gallery-categoria"
                type="text"
                list="gallery-category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex.: Workshop"
                className={textInput}
              />
              {categories.length > 0 && (
                <datalist id="gallery-category-suggestions">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              )}
            </div>

            <div>
              <label htmlFor="gallery-form-date" className={fieldLabel}>
                Data
              </label>
              <DatePicker
                id="gallery-form-date"
                value={date}
                onChange={setDate}
                placeholder={isEditing ? 'Selecione' : 'Detectada no arquivo'}
              />
            </div>
          </div>
          {!isEditing && items.length > 0 && (
            <p className="text-2xs text-gray-500 -mt-2">
              Categoria e data valem para todos os arquivos. Sem data, usamos a de cada arquivo.
            </p>
          )}
        </div>

        <div className="px-6 sm:px-8 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            className={buttonClasses({ variant: 'ghost' })}
          >
            Cancelar
          </button>
          <button type="submit" disabled={isSaving || !canSubmit} className={buttonClasses({ variant: 'primary' })}>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
