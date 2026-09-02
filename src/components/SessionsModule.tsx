import React, { useEffect, useRef, useState } from 'react';
import { GraduationCap, Plus, Search, X, Trash2, Upload, Calendar, Loader2, Flag, Wrench, ImageOff, Paperclip, FileText, Download, Star, Pencil } from 'lucide-react';
import { AmbassadorSession, SessionFile } from '../types';
import { DatePicker } from './DatePicker';
import { usePersistedState } from '../hooks/usePersistedState';

interface SessionsModuleProps {
  sessions: AmbassadorSession[];
  onSaveSession: (session: AmbassadorSession) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
}

const DEFAULT_FORM: Partial<AmbassadorSession> = {
  title: '',
  date: '',
  challenge: '',
  challengeFiles: [],
  toolLearned: '',
  proofImage: '',
  score: undefined,
};

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; 
const MAX_ATTACHMENT_SIZE_BYTES = 8 * 1024 * 1024; 

function formatDateBR(isoDate?: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function isImageFile(file: SessionFile): boolean {
  return file.fileType.startsWith('image/');
}

export const SessionsModule: React.FC<SessionsModuleProps> = ({ sessions, onSaveSession, onDeleteSession }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = usePersistedState('gsa_sessions_modal_open', false);
  const [formData, setFormData] = usePersistedState<Partial<AmbassadorSession>>('gsa_sessions_form_draft', DEFAULT_FORM);
  const [fileError, setFileError] = useState<string | null>(null);
  const [challengeFileError, setChallengeFileError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingSession, setViewingSession] = useState<AmbassadorSession | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const challengeFileInputRef = useRef<HTMLInputElement>(null);

  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (s.challenge || '').toLowerCase().includes(q) ||
      s.toolLearned.toLowerCase().includes(q)
    );
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => (a.date < b.date ? 1 : -1));

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setFileError(null);
    setChallengeFileError(null);
  };

  const handleEditSession = (session: AmbassadorSession) => {
    setFormData(session);
    setFileError(null);
    setChallengeFileError(null);
    setViewingSession(null);
    setIsAddModalOpen(true);
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
      setFormData((prev) => ({ ...prev, proofImage: event.target?.result as string }));
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

  const loadChallengeFilesIntoForm = (files: FileList | File[]) => {
    setChallengeFileError(null);
    Array.from(files).forEach((file) => {
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        setChallengeFileError(`"${file.name}" é muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O limite é 8MB por arquivo.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const newFile: SessionFile = {
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl: event.target?.result as string,
          fileType: file.type,
          fileSize: file.size,
        };
        setFormData((prev) => ({ ...prev, challengeFiles: [...(prev.challengeFiles || []), newFile] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleChallengeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    loadChallengeFilesIntoForm(files);
    e.target.value = '';
  };

  const handleChallengeFilesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    loadChallengeFilesIntoForm(files);
  };

  const handleRemoveChallengeFile = (id: string) => {
    setFormData((prev) => ({ ...prev, challengeFiles: (prev.challengeFiles || []).filter((f) => f.id !== id) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.date) return;

    setIsSaving(true);
    try {
      const session: AmbassadorSession = {
        id: formData.id || crypto.randomUUID(),
        title: formData.title.trim(),
        date: formData.date,
        challenge: (formData.challenge || '').trim() || undefined,
        challengeFiles: formData.challengeFiles && formData.challengeFiles.length > 0 ? formData.challengeFiles : undefined,
        toolLearned: (formData.toolLearned || '').trim(),
        proofImage: formData.proofImage || undefined,
        score: formData.score,
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveSession(session);
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Não foi possível salvar a sessão. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (session: AmbassadorSession) => {
    if (!confirm('Deseja realmente remover esta sessão?')) return;
    setDeletingId(session.id);
    try {
      await onDeleteSession(session.id);
      setViewingSession(null);
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir a sessão. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!isAddModalOpen && !viewingSession) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setViewingSession(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isAddModalOpen, viewingSession]);

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-[#34A853]" />
            <span>Sessões</span>
          </h2>
        </div>

        <button
          id="btn-new-session"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          aria-label="Nova sessão"
          title="Nova sessão"
          className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova sessão</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por sessão, desafio ou ferramenta..."
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
      </div>

      {sortedSessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#34A853]/10 text-[#34A853] flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhuma sessão encontrada</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedSessions.map((session) => (
            <div
              key={session.id}
              id={`session-card-${session.id}`}
              onClick={() => setViewingSession(session)}
              className="bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-[#34A853]/50 transition-all p-6 flex gap-4 cursor-pointer"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                {session.proofImage ? (
                  <img src={session.proofImage} alt={session.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageOff className="w-6 h-6 text-gray-300" />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-gray-900 leading-snug truncate">{session.title}</h3>
                  <span className="text-xs text-gray-400 font-medium shrink-0 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateBR(session.date)}
                  </span>
                </div>

                {session.challenge && (
                  <p className="text-xs text-gray-600 flex items-start gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-[#FBBC04] shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{session.challenge}</span>
                  </p>
                )}

                {session.challengeFiles && session.challengeFiles.length > 0 && (() => {
                  const images = session.challengeFiles.filter(isImageFile);
                  const docs = session.challengeFiles.length - images.length;
                  return (
                    <div className="flex items-center gap-1.5">
                      {images.slice(0, 3).map((file) => (
                        <img key={file.id} src={file.dataUrl} alt={file.name} className="w-8 h-8 rounded-lg object-cover border border-gray-200" />
                      ))}
                      {images.length > 3 && (
                        <span className="text-[10px] text-gray-400 font-semibold">+{images.length - 3}</span>
                      )}
                      {docs > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5 text-[#34A853] shrink-0" />
                          {docs} arquivo{docs > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  );
                })()}

                <p className="text-xs text-gray-600 flex items-start gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#1A73E8] shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{session.toolLearned || 'Nenhuma ferramenta registrada'}</span>
                </p>

                {session.score ? (
                  <p className="text-xs text-gray-600 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-[#FBBC04] shrink-0" />
                    <span>{session.score}</span>
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAddModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">

              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#34A853]/10 text-[#34A853] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {formData.id ? 'Editar Sessão' : 'Nova Sessão'}
                    </h3>
                    <p className="text-xs text-gray-500">Registre o que você fez e aprendeu</p>
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
                    Sessão *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#34A853]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Dia *
                  </label>
                  <DatePicker
                    id="session-form-date"
                    value={formData.date || ''}
                    onChange={(date) => setFormData({ ...formData, date })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Desafio proposto (se tiver)
                  </label>
                  <input
                    type="text"
                    value={formData.challenge || ''}
                    onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 mb-2"
                  />

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleChallengeFilesDrop}
                    onClick={() => challengeFileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-[#34A853] bg-[#F8FAFD] rounded-2xl p-4 text-center cursor-pointer transition-all space-y-2"
                  >
                    <input
                      ref={challengeFileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleChallengeFileChange}
                    />
                    <div className="w-9 h-9 rounded-full bg-[#34A853]/10 text-[#34A853] flex items-center justify-center mx-auto">
                      <Paperclip className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">Arraste ou clique para anexar (pode selecionar vários)</p>
                  </div>

                  {challengeFileError && (
                    <p role="alert" className="mt-2 text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5">
                      {challengeFileError}
                    </p>
                  )}

                  {formData.challengeFiles && formData.challengeFiles.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {formData.challengeFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
                        >
                          {isImageFile(file) ? (
                            <img src={file.dataUrl} alt={file.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-[#34A853] shrink-0" />
                          )}
                          <span className="text-xs font-medium text-gray-700 truncate flex-1">{file.name}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">{formatFileSize(file.fileSize)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveChallengeFile(file.id)}
                            aria-label="Remover arquivo"
                            className="p-1 rounded-lg text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Ferramenta que aprendeu
                    </label>
                    <input
                      type="text"
                      value={formData.toolLearned || ''}
                      onChange={(e) => setFormData({ ...formData, toolLearned: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Pontuação
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.score ?? ''}
                      onChange={(e) => setFormData({ ...formData, score: e.target.value === '' ? undefined : Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Foto de comprovação
                  </label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-[#34A853] bg-[#F8FAFD] rounded-2xl p-6 text-center cursor-pointer transition-all space-y-3"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {formData.proofImage ? (
                      <div className="flex items-center justify-center gap-4">
                        <img src={formData.proofImage} alt="Prévia" className="h-24 max-w-xs object-contain rounded-lg shadow-xs" />
                        <p className="text-xs text-green-600 font-medium">Foto carregada com sucesso!</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-[#34A853]/10 text-[#34A853] flex items-center justify-center mx-auto">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Arraste ou clique para selecionar</p>
                      </>
                    )}
                  </div>

                  {fileError && (
                    <p role="alert" className="mt-2 text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5">
                      {fileError}
                    </p>
                  )}
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
                    disabled={isSaving || !formData.title?.trim() || !formData.date}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#34A853] hover:bg-[#1E8E3E] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {viewingSession && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            <div className="overflow-y-auto">
              {viewingSession.proofImage ? (
                <div className="relative bg-gray-900">
                  <img src={viewingSession.proofImage} alt={viewingSession.title} className="w-full max-h-[50vh] object-contain" />
                  <button
                    onClick={() => setViewingSession(null)}
                    aria-label="Fechar"
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-5 pb-0">
                  <div />
                  <button
                    onClick={() => setViewingSession(null)}
                    aria-label="Fechar"
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-gray-900 text-lg">{viewingSession.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    {viewingSession.score ? (
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-[#FBBC04]" />
                        {viewingSession.score}
                      </span>
                    ) : null}
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateBR(viewingSession.date)}
                    </span>
                  </div>
                </div>

                {viewingSession.challenge && (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <Flag className="w-4 h-4 text-[#FBBC04] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Desafio proposto</p>
                      <p>{viewingSession.challenge}</p>
                    </div>
                  </div>
                )}

                {viewingSession.challengeFiles && viewingSession.challengeFiles.length > 0 && (() => {
                  const images = viewingSession.challengeFiles.filter(isImageFile);
                  const docs = viewingSession.challengeFiles.filter((f) => !isImageFile(f));
                  return (
                    <div className="space-y-2">
                      {images.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Imagens do desafio</p>
                          <div className="grid grid-cols-3 gap-2">
                            {images.map((file) => (
                              <a
                                key={file.id}
                                href={file.dataUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:opacity-90 transition-opacity"
                              >
                                <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {docs.length > 0 && (
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <Paperclip className="w-4 h-4 text-[#34A853] shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Anexos do desafio</p>
                            <div className="space-y-1.5">
                              {docs.map((file) => (
                                <a
                                  key={file.id}
                                  href={file.dataUrl}
                                  download={file.name}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#34A853] shrink-0" />
                                  <span className="text-xs font-medium text-gray-700 truncate flex-1">{file.name}</span>
                                  <span className="text-[10px] text-gray-400 shrink-0">{formatFileSize(file.fileSize)}</span>
                                  <Download className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <Wrench className="w-4 h-4 text-[#1A73E8] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ferramenta aprendida</p>
                    <p>{viewingSession.toolLearned || 'Não informado'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleEditSession(viewingSession)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-xl"
                    aria-label="Editar sessão"
                    title="Editar Sessão"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(viewingSession)}
                    disabled={deletingId === viewingSession.id}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA4335] hover:bg-[#EA4335]/10 px-3 py-2 rounded-xl disabled:opacity-50"
                    aria-label="Excluir sessão"
                    title="Excluir Sessão"
                  >
                    {deletingId === viewingSession.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};