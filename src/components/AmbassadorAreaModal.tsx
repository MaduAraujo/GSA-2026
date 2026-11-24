import React, { useEffect, useRef, useState } from 'react';
import { buttonClasses } from './ui/buttonClasses';
import { Modal, ModalHeader } from './ui/Modal';
import {
  ShieldCheck,
  Compass,
  Upload,
  Trash2,
  ImageOff,
  FlaskConical,
  Users,
  Rocket,
  Sparkles,
  MoreVertical,
} from 'lucide-react';
import { type AmbassadorProfile } from '../types';

interface AmbassadorAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AmbassadorProfile;
  onSaveProfile: (profile: AmbassadorProfile) => void;
}

const MAX_SEAL_SIZE_BYTES = 3 * 1024 * 1024;

const EXPECTATIONS = [
  {
    icon: FlaskConical,
    title: 'Testar e Compartilhar',
    text: 'Experimente os prompts, ferramentas e desafios propostos ao longo das semanas e leve os aprendizados para colegas, grupos de estudo e outros espaços da universidade.',
  },
  {
    icon: Users,
    title: 'Aprender e Colaborar',
    text: 'Participe das atividades do programa, troque experiências com a comunidade e compartilhe dicas, descobertas e hacks que possam ajudar outros Embaixadores e Embaixadoras.',
  },
  {
    icon: Rocket,
    title: 'Movimentar o Campus',
    text: 'Crie oportunidades para que mais pessoas conheçam e experimentem o Google Gemini. Pode ser uma conversa com colegas, um grupo de estudos, um conteúdo, um template de prompt ou uma ação no campus.',
  },
  {
    icon: Sparkles,
    title: 'Do Seu Jeito, Com Impacto',
    text: 'Não existe uma única forma de ser Embaixador(a). Cada participante pode conectar o programa à própria realidade, aos seus interesses e às pessoas que fazem parte da sua rotina universitária do seu jeito.',
  },
];

export const AmbassadorAreaModal: React.FC<AmbassadorAreaModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [seal, setSeal] = useState(profile.ambassadorSealUrl || '');
  const [sealError, setSealError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sealMenuOpen, setSealMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sealMenuRef = useRef<HTMLDivElement>(null);

  const wasOpenRef = useRef(isOpen);
  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (justOpened) {
      setSeal(profile.ambassadorSealUrl || '');
      setSealError(null);
      setSaved(false);
      setSealMenuOpen(false);
    }
  }, [isOpen, profile.ambassadorSealUrl]);

  useEffect(() => {
    if (!sealMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sealMenuRef.current && !sealMenuRef.current.contains(e.target as Node)) {
        setSealMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sealMenuOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSealError(null);
    if (file.size > MAX_SEAL_SIZE_BYTES) {
      setSealError(`Imagem muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O limite é 3MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSeal(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    onSaveProfile({ ...profile, ambassadorSealUrl: seal });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <Modal labelledBy="ambassador-area-heading" onClose={onClose} size="xl">
      <ModalHeader
        titleId="ambassador-area-heading"
        title="Área do Embaixador(a)"
        subtitle="Seu papel no programa e o seu selo oficial."
        icon={ShieldCheck}
        iconClassName="bg-primary/10 text-primary"
        onClose={onClose}
      />
      <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-primary flex items-center justify-center shrink-0">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">O Papel do(a) Embaixador(a)</h4>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              O que esperamos de quem faz parte do programa?
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Ser Embaixador(a) é participar ativamente da jornada, experimentar novas possibilidades com o Google
              Gemini e ajudar esse conhecimento a circular.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Ao longo do programa, a proposta é simples: aprender, compartilhar, colaborar e gerar impacto.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">Ou seja, esperamos de você:</p>
          </div>

          <div className="space-y-3">
            {EXPECTATIONS.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-start gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            O mais importante é manter a curiosidade, participar da comunidade e transformar os aprendizados da jornada
            em experiências que possam impactar mais pessoas.
          </p>
        </div>

        <div className="relative p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Selo Embaixador(a)</h4>
            </div>

            {seal && (
              <div className="relative shrink-0" ref={sealMenuRef}>
                <button
                  type="button"
                  onClick={() => setSealMenuOpen((v) => !v)}
                  aria-label="Opções do selo"
                  aria-expanded={sealMenuOpen}
                  className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {sealMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg py-1.5 z-10"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSealMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Trocar imagem</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSeal('');
                        setSealMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-danger-700 hover:bg-danger-50 dark:hover:bg-danger/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {seal ? (
            <div className="flex justify-center py-2">
              <img
                src={seal}
                alt="Selo Embaixador(a)"
                className="w-48 h-48 rounded-xl object-contain bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Upload className="w-6 h-6" />
              <span className="text-xs font-semibold">Faça upload do selo</span>
            </button>
          )}

          {sealError && (
            <p
              role="alert"
              className="text-xs font-semibold text-danger-700 bg-danger-50 dark:bg-danger/10 border border-danger/30 dark:border-danger/30 rounded-xl px-3.5 py-2.5 flex items-center gap-2"
            >
              <ImageOff className="w-3.5 h-3.5 shrink-0" />
              <span>{sealError}</span>
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
          <button type="button" onClick={handleSave} className={buttonClasses({ variant: 'primary' })}>
            {saved ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
