import { CheckCircle2, Copy, ExternalLink, FileText, Link2, Paperclip, Play, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { AiApiService } from '../../services/aiApi';
import type { PromptItem } from '../../types';
import { errorMessage } from '../../utils/errors';
import { isHttpUrl } from '../../utils/safeUrl';
import {
  ACCEPTED_PROMPT_FILE_INPUT,
  ACCEPTED_PROMPT_FILE_TYPES,
  formatMegabytes,
  getDocLabel,
  MAX_TEST_FILE_SIZE_BYTES,
} from './promptFiles';

interface PromptTesterModalProps {
  prompt: PromptItem;
  onClose: () => void;
  onSavePrompt: (prompt: PromptItem) => Promise<void>;
}

interface TestAttachment {
  dataUrl: string;
  name: string;
  mimeType: string;
}

export function PromptTesterModal({ prompt, onClose, onSavePrompt }: PromptTesterModalProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((prompt.variables ?? []).map((v) => [v, ''])),
  );
  const [result, setResult] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [attachment, setAttachment] = useState<TestAttachment | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = (file: File) => {
    setFileError(null);
    if (!ACCEPTED_PROMPT_FILE_TYPES.includes(file.type)) {
      setFileError('Formato não suportado. Anexe uma imagem (PNG/JPG), um PDF, um DOCX ou um XLSX.');
      return;
    }
    if (file.size > MAX_TEST_FILE_SIZE_BYTES) {
      setFileError(`Arquivo muito grande (${formatMegabytes(file.size)}MB). O limite é 4MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) =>
      setAttachment({ dataUrl: event.target?.result as string, name: file.name, mimeType: file.type });
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setResult(null);

    try {
      let finalPrompt = prompt.promptText;
      Object.entries(variableValues).forEach(([key, val]) => {
        if (val) {
          const regex = new RegExp(`\\[${key}\\]|\\[INSERIR ${key}[^\\]]*\\]`, 'gi');
          finalPrompt = finalPrompt.replace(regex, val);
        }
      });

      const reply = await AiApiService.sendChatMessage(
        finalPrompt,
        undefined,
        attachment
          ? { dataUrl: attachment.dataUrl, mimeType: attachment.mimeType, fileName: attachment.name }
          : undefined,
      );
      setResult(reply);

      await onSavePrompt({
        ...prompt,
        usageCount: (prompt.usageCount || 0) + 1,
        lastUsed: new Date().toISOString(),
      });
    } catch (err) {
      setResult(`Erro ao executar prompt: ${errorMessage(err, 'Verifique sua conexão.')}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center">
                <Play className="w-5 h-5 fill-[#1A73E8]" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Testar Prompt</h3>
                <p className="text-xs text-gray-500">
                  {prompt.title} • {prompt.section}
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

          {prompt.sharedDocs && prompt.sharedDocs.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#1A73E8]/5 border border-[#1A73E8]/20 space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Documentos de Apoio</h4>
              <div className="flex flex-col gap-1.5">
                {prompt.sharedDocs.filter(isHttpUrl).map((doc) => (
                  <a
                    key={doc}
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-[#1A73E8]/50 text-xs font-semibold text-[#1A73E8] transition-colors"
                  >
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1 min-w-0 truncate">{getDocLabel(doc)}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {prompt.variables && prompt.variables.length > 0 && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Preencher Parâmetros do Prompt:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {prompt.variables.map((v) => (
                  <div key={v}>
                    <label htmlFor={`prompt-var-${v}`} className="block text-[11px] font-bold text-gray-600 mb-1">
                      [{v}]
                    </label>
                    <input
                      id={`prompt-var-${v}`}
                      type="text"
                      placeholder={`Digite o valor para ${v}...`}
                      value={variableValues[v] || ''}
                      onChange={(e) => setVariableValues({ ...variableValues, [v]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-gray-300 bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Prompt</span>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-mono text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {prompt.promptText}
            </div>
          </div>

          <div>
            <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Anexar (opcional)
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_PROMPT_FILE_INPUT}
              className="hidden"
              onChange={handleFileChange}
            />
            {attachment ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200">
                {attachment.mimeType.startsWith('image/') ? (
                  <img
                    src={attachment.dataUrl}
                    alt="Anexo"
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-[#EA4335]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 truncate">{attachment.name}</p>
                  <p className="text-[11px] text-green-600 font-medium">Anexo pronto para o teste</p>
                </div>
                <button
                  type="button"
                  onClick={removeAttachment}
                  aria-label="Remover anexo"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`w-full flex items-center gap-2.5 p-3 rounded-2xl border-2 border-dashed bg-[#F8FAFD] text-left transition-all ${
                  isDragging ? 'border-[#1A73E8] bg-[#1A73E8]/5' : 'border-gray-300 hover:border-[#1A73E8]'
                }`}
              >
                <Paperclip className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-xs text-gray-600">
                  Anexe imagem (PNG/JPG) ou um documento (PDF/DOCX/XLSX) se a IA precisar de contexto.
                </span>
              </button>
            )}
            {fileError && (
              <p
                role="alert"
                className="mt-2 text-xs font-semibold text-[#D93025] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-3.5 py-2.5"
              >
                {fileError}
              </p>
            )}
          </div>

          {result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#34A853] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resposta Gerada pelo Gemini 3.7:</span>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                    alert('Resposta copiada para a área de transferência!');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Resposta</span>
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-300 shadow-inner text-xs sm:text-sm text-gray-800 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                {result}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Fechar
            </button>

            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#1A73E8] hover:bg-[#1A73E8] text-white shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processando no Gemini...</span>
                </>
              ) : (
                <span>Executar</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
