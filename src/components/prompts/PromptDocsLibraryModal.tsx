import { Download, FileText, Paperclip, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { SupabaseStorageService } from '../../services/supabaseStorage';
import type { PromptDoc } from '../../types';
import { errorMessage } from '../../utils/errors';
import {
  ACCEPTED_PROMPT_FILE_INPUT,
  ACCEPTED_PROMPT_FILE_TYPES,
  formatFileSize,
  formatMegabytes,
  MAX_DOC_FILE_SIZE_BYTES,
} from './promptFiles';

interface PromptDocsLibraryModalProps {
  promptDocs: PromptDoc[];
  onSavePromptDoc: (doc: PromptDoc) => Promise<void>;
  onDeletePromptDoc: (id: string) => Promise<void>;
  onClose: () => void;
}

export function PromptDocsLibraryModal({
  promptDocs,
  onSavePromptDoc,
  onDeletePromptDoc,
  onClose,
}: PromptDocsLibraryModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploadError(null);
    if (!ACCEPTED_PROMPT_FILE_TYPES.includes(file.type)) {
      setUploadError('Formato não suportado. Envie uma imagem (PNG/JPG), um PDF, um DOCX ou um XLSX.');
      return;
    }
    if (file.size > MAX_DOC_FILE_SIZE_BYTES) {
      setUploadError(`Arquivo muito grande (${formatMegabytes(file.size)}MB). O limite é 1GB.`);
      return;
    }

    setIsUploading(true);
    try {
      const docId = crypto.randomUUID();
      const filePath = await SupabaseStorageService.uploadPromptDocFile(file, docId);
      await onSavePromptDoc({
        id: docId,
        name: file.name,
        filePath,
        fileType: file.type,
        fileSize: file.size,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setUploadError(errorMessage(err, 'Não foi possível enviar o documento.'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void upload(file);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  };

  const handleDelete = async (doc: PromptDoc) => {
    if (confirm(`Excluir "${doc.name}" da biblioteca de documentos?`)) {
      await onDeletePromptDoc(doc.id);
      if (doc.filePath) {
        SupabaseStorageService.deletePromptDocFile(doc.filePath).catch(() => {});
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Documentos para teste"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#34A853]/15 text-[#2E7D32] flex items-center justify-center">
              <Paperclip className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Documentos</h3>
              <p className="text-xs text-gray-500">
                Envie arquivos de apoio para consultar enquanto testa seus prompts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_PROMPT_FILE_INPUT}
            className="hidden"
            onChange={handleInputChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            disabled={isUploading}
            className={`w-full flex items-center gap-2.5 p-4 rounded-2xl border-2 border-dashed bg-[#F8FAFD] text-left transition-all disabled:opacity-60 ${
              isDragging ? 'border-[#1A73E8] bg-[#1A73E8]/5' : 'border-gray-300 hover:border-[#1A73E8]'
            }`}
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <Upload className="w-5 h-5 text-gray-500 shrink-0" />
            )}
            <span className="text-xs text-gray-600">
              {isUploading ? 'Enviando documento...' : 'Clique ou arraste um arquivo'}
            </span>
          </button>
          {uploadError && (
            <p
              role="alert"
              className="text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5"
            >
              {uploadError}
            </p>
          )}

          {promptDocs.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">Nenhum documento enviado ainda.</p>
          ) : (
            <div className="space-y-2">
              {promptDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200">
                  {doc.fileType.startsWith('image/') ? (
                    <img
                      src={doc.fileData}
                      alt={doc.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-[#EA4335]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">{doc.name}</p>
                    <p className="text-[11px] text-gray-500">{formatFileSize(doc.fileSize)}</p>
                  </div>
                  <a
                    href={doc.downloadUrl ?? doc.fileData}
                    download={doc.name}
                    aria-label={`Baixar ${doc.name}`}
                    title="Baixar"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#1A73E8] hover:bg-[#1A73E8]/10 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    aria-label={`Excluir ${doc.name}`}
                    title="Excluir"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 pt-4 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
