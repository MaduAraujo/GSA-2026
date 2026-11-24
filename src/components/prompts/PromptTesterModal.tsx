import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  History,
  Library,
  Link2,
  Paperclip,
  Play,
  RefreshCw,
  X,
} from 'lucide-react';
import { formatDateTimeBR } from '../../utils/date';
import { buttonClasses } from '../ui/buttonClasses';
import { Modal, ModalHeader } from '../ui/Modal';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useToast } from '../../app/ToastProvider';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { usePersistedState } from '../../hooks/usePersistedState';
import { AiApiService } from '../../services/aiApi';
import type { PromptDoc, PromptItem } from '../../types';
import { errorMessage } from '../../utils/errors';
import { isHttpUrl } from '../../utils/safeUrl';
import { MarkdownText } from '../MarkdownText';
import { fillPromptVariables, getPromptVariables } from './fillPromptVariables';
import {
  ACCEPTED_PROMPT_FILE_INPUT,
  ACCEPTED_PROMPT_FILE_TYPES,
  formatFileSize,
  formatMegabytes,
  getDocLabel,
  MAX_TEST_FILE_SIZE_BYTES,
} from './promptFiles';

interface PromptTesterModalProps {
  prompt: PromptItem;
  promptDocs?: PromptDoc[];
  onClose: () => void;
  onSavePrompt: (prompt: PromptItem) => Promise<void>;
}

interface TestAttachment {
  dataUrl: string;
  name: string;
  mimeType: string;
}

interface TestRun {
  id: string;
  at: string;
  text: string;
  isError: boolean;
}

const MAX_SAVED_RUNS = 5;

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(blob);
  });
}

export function PromptTesterModal({ prompt, promptDocs = [], onClose, onSavePrompt }: PromptTesterModalProps) {
  const toast = useToast();
  const { copied, copy } = useCopyToClipboard();

  const variables = getPromptVariables(prompt);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(variables.map((v) => [v, ''])),
  );
  const [runs, setRuns] = usePersistedState<TestRun[]>(`gsa_prompt_runs_${prompt.id}`, []);
  const [isExecuting, setIsExecuting] = useState(false);
  const [attachment, setAttachment] = useState<TestAttachment | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usageCount = useRef(prompt.usageCount || 0);

  const latestRun = runs[0] ?? null;
  const previousRuns = runs.slice(1);
  const finalPrompt = fillPromptVariables(prompt.promptText, variableValues);
  const emptyVariables = variables.filter((v) => !variableValues[v]?.trim());
  const sectionLabel = prompt.section.trim();

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
    void readAsDataUrl(file).then((dataUrl) => setAttachment({ dataUrl, name: file.name, mimeType: file.type }));
  };

  const attachFromLibrary = async (doc: PromptDoc) => {
    const url = doc.fileData;
    if (!url) return;
    setFileError(null);
    setLoadingDocId(doc.id);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const dataUrl = await readAsDataUrl(await res.blob());
      setAttachment({ dataUrl, name: doc.name, mimeType: doc.fileType });
      setIsLibraryOpen(false);
    } catch (err) {
      console.error(err);
      setFileError(`Não foi possível carregar "${doc.name}" da biblioteca. Tente novamente.`);
    } finally {
      setLoadingDocId(null);
    }
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

  const addRun = (text: string, isError: boolean) =>
    setRuns((prev) =>
      [{ id: crypto.randomUUID(), at: new Date().toISOString(), text, isError }, ...prev].slice(0, MAX_SAVED_RUNS),
    );

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      const reply = await AiApiService.sendChatMessage(
        finalPrompt,
        undefined,
        attachment
          ? { dataUrl: attachment.dataUrl, mimeType: attachment.mimeType, fileName: attachment.name }
          : undefined,
      );
      addRun(reply, false);
      usageCount.current += 1;
      void onSavePrompt({ ...prompt, usageCount: usageCount.current, lastUsed: new Date().toISOString() }).catch(
        console.error,
      );
    } catch (err) {
      addRun(`Erro ao executar prompt: ${errorMessage(err, 'Verifique sua conexão.')}`, true);
    } finally {
      setIsExecuting(false);
    }
  };

  const copyRun = async (run: TestRun) => {
    if (!(await copy(run.text))) toast.show({ message: 'Não foi possível copiar a resposta.', tone: 'error' });
  };

  return (
    <Modal onClose={onClose} labelledBy="prompt-tester-title" size="3xl">
      <ModalHeader
        titleId="prompt-tester-title"
        title="Testar Prompt"
        subtitle={[prompt.title, sectionLabel].filter(Boolean).join(' • ')}
        icon={Play}
        iconClassName="bg-primary/10 text-primary"
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-6">
        {prompt.sharedDocs && prompt.sharedDocs.length > 0 && (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
            <h4 className="text-xs font-semibold text-gray-700">Documentos de Apoio</h4>
            <div className="flex flex-col gap-1.5">
              {prompt.sharedDocs.filter(isHttpUrl).map((doc) => (
                <a
                  key={doc}
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-primary/50 text-xs font-semibold text-primary transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 min-w-0 truncate">{getDocLabel(doc)}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                </a>
              ))}
            </div>
          </div>
        )}

        {variables.length > 0 && (
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <h4 className="text-xs font-semibold text-gray-700">Preencher variáveis</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {variables.map((v) => (
                <div key={v}>
                  <label htmlFor={`prompt-var-${v}`} className="block text-2xs font-bold text-gray-600 mb-1">
                    [{v}]
                  </label>
                  <input
                    id={`prompt-var-${v}`}
                    type="text"
                    placeholder={`Digite o valor para ${v}...`}
                    value={variableValues[v] || ''}
                    onChange={(e) => setVariableValues({ ...variableValues, [v]: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-gray-300 bg-white focus-visible:ring-2 focus-visible:ring-primary/30 focus:border-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="block text-sm font-medium text-gray-700 mb-1">
            {variables.length > 0 ? 'Prompt que será enviado' : 'Prompt'}
          </span>
          <div
            aria-label="Prompt que será enviado"
            className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-mono text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto"
          >
            {finalPrompt}
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-gray-700 mb-1">Anexar (opcional)</span>
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
                  <FileText className="w-6 h-6 text-danger" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-800 truncate">{attachment.name}</p>
                <p className="text-2xs text-success-800 font-medium">Anexo pronto para o teste</p>
              </div>
              <button
                type="button"
                onClick={removeAttachment}
                aria-label="Remover anexo"
                className="p-1.5 rounded-lg text-gray-500 hover:text-danger hover:bg-danger/10 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`w-full flex items-center gap-2.5 p-3 rounded-2xl border-2 border-dashed bg-surface-muted text-left transition-all ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
                }`}
              >
                <Paperclip className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-xs text-gray-600">
                  Anexe imagem (PNG/JPG) ou um documento (PDF/DOCX/XLSX) se a IA precisar de contexto.
                </span>
              </button>

              {promptDocs.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsLibraryOpen((v) => !v)}
                    aria-expanded={isLibraryOpen}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <Library className="w-3.5 h-3.5" />
                    <span>Anexar da biblioteca ({promptDocs.length})</span>
                  </button>
                  {isLibraryOpen && (
                    <ul aria-label="Documentos da biblioteca" className="mt-2 space-y-1.5">
                      {promptDocs.map((doc) => {
                        const tooBig = (doc.fileSize ?? 0) > MAX_TEST_FILE_SIZE_BYTES;
                        return (
                          <li key={doc.id}>
                            <button
                              type="button"
                              onClick={() => void attachFromLibrary(doc)}
                              disabled={tooBig || !doc.fileData || loadingDocId !== null}
                              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white text-left hover:border-primary/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-gray-200"
                            >
                              <FileText className="w-4 h-4 text-danger shrink-0" />
                              <span className="flex-1 min-w-0 text-xs font-semibold text-gray-800 truncate">
                                {doc.name}
                              </span>
                              <span className="shrink-0 text-2xs text-gray-500">
                                {loadingDocId === doc.id
                                  ? 'Carregando...'
                                  : tooBig
                                    ? 'Acima de 4MB'
                                    : formatFileSize(doc.fileSize)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          {fileError && (
            <p
              role="alert"
              className="mt-2 text-xs font-semibold text-danger-600 bg-danger/10 border border-danger/20 rounded-xl px-3.5 py-2.5"
            >
              {fileError}
            </p>
          )}
        </div>

        {latestRun && (
          <section aria-label="Resposta" className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              {latestRun.isError ? (
                <span className="text-xs font-bold text-danger-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>A execução falhou</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-success-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resposta da IA</span>
                </span>
              )}
              {!latestRun.isError && (
                <button
                  type="button"
                  onClick={() => void copyRun(latestRun)}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  {copied === latestRun.text ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === latestRun.text ? 'Copiado!' : 'Copiar resposta'}</span>
                </button>
              )}
            </div>
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed max-h-96 overflow-y-auto ${
                latestRun.isError
                  ? 'bg-danger/5 border-danger/20 text-danger-800'
                  : 'bg-white border-gray-300 shadow-inner text-gray-800'
              }`}
            >
              {latestRun.isError ? latestRun.text : <MarkdownText text={latestRun.text} />}
            </div>
          </section>
        )}

        {previousRuns.length > 0 && (
          <details className="group rounded-2xl border border-gray-200">
            <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-xs font-bold text-gray-700 select-none">
              <History className="w-3.5 h-3.5" />
              <span>Execuções anteriores ({previousRuns.length})</span>
            </summary>
            <ul className="px-4 pb-4 space-y-2">
              {previousRuns.map((run) => (
                <li key={run.id} className="rounded-xl bg-gray-50 border border-gray-200">
                  <details>
                    <summary className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer text-xs">
                      <span className="font-semibold text-gray-700">{formatDateTimeBR(run.at)}</span>
                      <span className="flex-1 min-w-0 truncate text-gray-500">{run.text}</span>
                    </summary>
                    <div className="px-3 pb-3 text-xs text-gray-800 space-y-2">
                      {run.isError ? <p>{run.text}</p> : <MarkdownText text={run.text} />}
                      {!run.isError && (
                        <button
                          type="button"
                          onClick={() => void copyRun(run)}
                          className="inline-flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copied === run.text ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      )}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <div className="px-6 sm:px-8 py-4 border-t border-gray-100 space-y-3">
        {emptyVariables.length > 0 && (
          <p className="flex items-start gap-1.5 text-2xs text-warning-900">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>
              {emptyVariables.length === 1 ? 'A variável ' : 'As variáveis '}
              <span className="font-mono font-semibold">{emptyVariables.map((v) => `[${v}]`).join(', ')}</span>
              {emptyVariables.length === 1 ? ' está vazia e será enviada' : ' estão vazias e serão enviadas'} como está
              no texto.
            </span>
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className={buttonClasses({ variant: 'ghost' })}>
            Fechar
          </button>
          <button
            type="button"
            onClick={() => void handleExecute()}
            disabled={isExecuting}
            className={buttonClasses({ variant: 'primary' })}
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Executando...</span>
              </>
            ) : latestRun ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Executar novamente</span>
              </>
            ) : (
              <span>Executar</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
