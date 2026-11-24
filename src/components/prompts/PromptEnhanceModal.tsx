import { ArrowLeft, Check, Copy, Lightbulb, RefreshCw, Wand2 } from 'lucide-react';
import { buttonClasses } from '../ui/buttonClasses';
import { Modal, ModalHeader } from '../ui/Modal';
import { useState } from 'react';
import { useToast } from '../../app/ToastProvider';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { AiApiService, type EnhancedPrompt } from '../../services/aiApi';
import type { PromptItem } from '../../types';
import { errorMessage } from '../../utils/errors';

interface PromptEnhanceModalProps {
  prompt: PromptItem;
  onClose: () => void;
  onSavePrompt: (prompt: PromptItem) => Promise<void>;
}

const ENHANCE_GOALS = [
  { id: 'clear', label: 'Mais claro e estruturado', objective: 'deixar o prompt mais claro e bem estruturado' },
  { id: 'concise', label: 'Mais conciso', objective: 'deixar o prompt mais curto e direto, sem perder o essencial' },
  { id: 'detailed', label: 'Mais detalhado', objective: 'adicionar contexto, restrições e exemplos' },
  { id: 'persona', label: 'Adicionar persona', objective: 'definir uma persona/papel adequado para a IA' },
  { id: 'format', label: 'Definir formato de saída', objective: 'especificar o formato exato da resposta' },
] as const;

type GoalId = (typeof ENHANCE_GOALS)[number]['id'];
type View = 'enhanced' | 'original';

export function PromptEnhanceModal({ prompt, onClose, onSavePrompt }: PromptEnhanceModalProps) {
  const toast = useToast();
  const { copied, copy } = useCopyToClipboard();

  const [goals, setGoals] = useState<Set<GoalId>>(() => new Set<GoalId>(['clear']));
  const [customGoal, setCustomGoal] = useState('');
  const [result, setResult] = useState<EnhancedPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<View>('enhanced');

  const objective = [...ENHANCE_GOALS.filter((g) => goals.has(g.id)).map((g) => g.objective), customGoal.trim()]
    .filter(Boolean)
    .join('; ');

  const toggleGoal = (id: GoalId) =>
    setGoals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const enhance = async () => {
    setIsEnhancing(true);
    setError(null);
    try {
      setResult(await AiApiService.enhancePrompt({ prompt: prompt.promptText, section: prompt.section, objective }));
      setView('enhanced');
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível aprimorar o prompt. Tente novamente.'));
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    if (!(await copy(result.enhanced))) {
      toast.show({ message: 'Não foi possível copiar o prompt.', tone: 'error' });
    }
  };

  const save = async (next: PromptItem, onSaved: () => void) => {
    setIsSaving(true);
    try {
      await onSavePrompt(next);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.show({ message: 'Não foi possível salvar o prompt. Tente novamente.', tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const replaceOriginal = () =>
    result &&
    save({ ...prompt, promptText: result.enhanced }, () =>
      toast.show({
        message: 'Prompt substituído pela versão aprimorada',
        tone: 'success',
        action: {
          label: 'Desfazer',
          onClick: () =>
            void onSavePrompt(prompt).catch(() =>
              toast.show({ message: 'Não foi possível restaurar o prompt original.', tone: 'error' }),
            ),
        },
      }),
    );

  const saveAsNew = () =>
    result &&
    save(
      {
        ...prompt,
        id: crypto.randomUUID(),
        title: `${prompt.title} (aprimorado)`,
        promptText: result.enhanced,
        isFavorite: false,
        usageCount: 0,
        lastUsed: undefined,
        createdAt: new Date().toISOString(),
      },
      () => toast.show({ message: 'Versão aprimorada salva como novo prompt', tone: 'success' }),
    );

  const goalChip = (selected: boolean) =>
    `px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
      selected ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <Modal onClose={onClose} labelledBy="prompt-enhance-title" size="3xl">
      <ModalHeader
        titleId="prompt-enhance-title"
        title="Aprimorar com IA"
        subtitle={prompt.title}
        icon={Wand2}
        iconClassName="bg-primary/10 text-primary"
        onClose={onClose}
      />
      <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
        {isEnhancing ? (
          <div className="py-16 text-center space-y-4" role="status">
            <div className="w-12 h-12 border-3 border-warning border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-gray-700">A IA está aprimorando o seu prompt...</p>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div role="tablist" aria-label="Comparar versões" className="inline-flex p-1 rounded-xl bg-gray-100">
              {(['enhanced', 'original'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => setView(v)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    view === v ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {v === 'enhanced' ? 'Aprimorado' : 'Original'}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              aria-label={view === 'enhanced' ? 'Prompt aprimorado' : 'Prompt original'}
              className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 font-mono whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed"
            >
              {view === 'enhanced' ? result.enhanced : prompt.promptText}
            </div>

            {(result.improvements.length > 0 || result.tip) && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 text-xs text-gray-700">
                {result.improvements.length > 0 && (
                  <>
                    <h4 className="font-semibold text-gray-800">O que mudou</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {result.improvements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
                {result.tip && (
                  <p className="flex items-start gap-1.5 pt-1">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-warning-700" />
                    <span>{result.tip}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void enhance()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Gerar outra versão</span>
              </button>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Mudar objetivo</span>
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                {copied === result.enhanced ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === result.enhanced ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => void saveAsNew()}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Salvar como novo
              </button>
              <button
                type="button"
                onClick={() => void replaceOriginal()}
                disabled={isSaving}
                className={buttonClasses({ variant: 'primary' })}
              >
                Substituir original
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-gray-700 mb-2">O que você quer melhorar?</legend>
              <div className="flex flex-wrap gap-2">
                {ENHANCE_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    aria-pressed={goals.has(goal.id)}
                    onClick={() => toggleGoal(goal.id)}
                    className={goalChip(goals.has(goal.id))}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="prompt-enhance-custom" className="block text-sm font-medium text-gray-700 mb-1">
                Outro objetivo (opcional)
              </label>
              <input
                id="prompt-enhance-custom"
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="Ex.: adaptar para iniciantes em programação"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="text-xs font-semibold text-danger-600 bg-danger/10 border border-danger/20 rounded-xl px-3.5 py-2.5"
              >
                {error}
              </p>
            )}

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button type="button" onClick={onClose} className={buttonClasses({ variant: 'ghost' })}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void enhance()}
                disabled={!objective}
                className={buttonClasses({ variant: 'primary' })}
              >
                <Wand2 className="w-4 h-4" />
                <span>Aprimorar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
