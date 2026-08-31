import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Copy,
  Check,
  User,
  HelpCircle,
  BookOpen,
  Calendar,
  Mail,
  Code,
  Zap,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2
} from 'lucide-react';
import { GeminiApiService } from '../services/geminiApi';
import { usePersistedState } from '../hooks/usePersistedState';
import { SupabaseStorageService } from '../services/supabaseStorage';
import { ChatSession } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  sender: 'gemini',
  text: `Olá, Embaixadora Estudantil Google 2026! 🚀💙

Sou sua mentora de inteligência artificial dedicada. Como posso te apoiar hoje?

- Planejamento de workshops de IA e Google Cloud
- Roteiros para apresentações e Study Jams
- Resolução de dúvidas técnicas sobre o Gemini e APIs Google
- Estratégias de engajamento e comunicação com o campus!`,
  timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
};

const QUICK_STARTERS = [
  {
    title: 'Roteiro de Workshop Gemini',
    icon: Sparkles,
    prompt: 'Crie uma proposta de workshop de 1h30 para estudantes de TI sobre como construir aplicações com a API do Gemini 3.7 no Google AI Studio.',
  },
  {
    title: 'Plano de Certificação Google Cloud',
    icon: BookOpen,
    prompt: 'Estruture um cronograma de estudos de 4 semanas para a certificação Google Cloud Associate Cloud Engineer com foco em estudantes.',
  },
  {
    title: 'E-mail para Coordenação Universitária',
    icon: Mail,
    prompt: 'Escreva um e-mail formal e persuasivo para o coordenador do curso solicitando o auditório da faculdade para um evento oficial de Embaixadores do Google 2026.',
  },
  {
    title: 'Dinâmica de Hackathon com IA',
    icon: Zap,
    prompt: 'Sugira 3 desafios práticos e critérios de avaliação para um mini-hackathon de 1 dia utilizando o ecossistema Google para Estudantes.',
  },
];

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export const GeminiCopilotModule: React.FC = () => {
  const [messages, setMessages] = usePersistedState<Message[]>('gsa_copilot_messages', [WELCOME_MESSAGE]);
  const [inputMessage, setInputMessage] = usePersistedState('gsa_copilot_input_draft', '');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [persistenceAvailable, setPersistenceAvailable] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = usePersistedState<string | null>('gsa_copilot_session_id', null);
  const [isSidebarOpen, setIsSidebarOpen] = usePersistedState('gsa_copilot_sidebar_open', true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isSwitchingSession, setIsSwitchingSession] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await SupabaseStorageService.listChatSessions();
        if (cancelled) return;
        setSessions(list);

        const sessionStillExists = currentSessionId && list.some((s) => s.id === currentSessionId);
        if (sessionStillExists) {
          const records = await SupabaseStorageService.getChatMessages(currentSessionId!);
          if (cancelled) return;
          if (records.length > 0) {
            setMessages(
              records.map((r) => ({ id: r.id, sender: r.sender, text: r.text, timestamp: timeLabel(r.createdAt) }))
            );
          }
        } else if (currentSessionId) {
          setCurrentSessionId(null);
        }
      } catch {
        if (!cancelled) setPersistenceAvailable(false);
      } finally {
        if (!cancelled) setIsLoadingSessions(false);
      }
    })();
  }, []);

  const refreshSessions = async () => {
    try {
      setSessions(await SupabaseStorageService.listChatSessions());
    } catch {
    }
  };

  const handleNewConversation = () => {
    setCurrentSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    setInputMessage('');
  };

  const handleSelectSession = async (session: ChatSession) => {
    if (session.id === currentSessionId) return;
    setIsSwitchingSession(true);
    try {
      const records = await SupabaseStorageService.getChatMessages(session.id);
      setCurrentSessionId(session.id);
      setMessages(
        records.length > 0
          ? records.map((r) => ({ id: r.id, sender: r.sender, text: r.text, timestamp: timeLabel(r.createdAt) }))
          : [WELCOME_MESSAGE]
      );
    } catch {
    } finally {
      setIsSwitchingSession(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    if (!confirm(`Excluir a conversa "${session.title}"?`)) return;
    try {
      await SupabaseStorageService.deleteChatSession(session.id);
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      if (session.id === currentSessionId) {
        handleNewConversation();
      }
    } catch {
      alert('Não foi possível excluir a conversa.');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    const historyForRequest = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ sender: m.sender, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    let sessionId = currentSessionId;

    if (persistenceAvailable && !sessionId) {
      try {
        const title = userMsg.text.slice(0, 60) + (userMsg.text.length > 60 ? '…' : '');
        const created = await SupabaseStorageService.createChatSession(title);
        sessionId = created.id;
        setCurrentSessionId(created.id);
        setSessions((prev) => [created, ...prev]);
      } catch {
        setPersistenceAvailable(false);
      }
    }
    if (persistenceAvailable && sessionId) {
      SupabaseStorageService.appendChatMessage(sessionId, 'user', userMsg.text).catch(() => setPersistenceAvailable(false));
    }

    try {
      const reply = await GeminiApiService.sendChatMessage(text, historyForRequest);
      const geminiMsg: Message = {
        id: `gemini-${Date.now()}`,
        sender: 'gemini',
        text: reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, geminiMsg]);

      if (persistenceAvailable && sessionId) {
        SupabaseStorageService.appendChatMessage(sessionId, 'gemini', reply)
          .then(refreshSessions)
          .catch(() => setPersistenceAvailable(false));
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'gemini',
        text: `Desculpe, ocorreu uma falha ao conectar com o Gemini: ${err.message || 'Verifique sua conexão.'}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex gap-4 h-[78vh] mt-15">
      {persistenceAvailable && isSidebarOpen && (
        <div className="hidden sm:flex flex-col w-64 shrink-0 bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Conversas</h4>
            <button
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Recolher histórico"
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleNewConversation}
            className="m-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#1A73E8]/10 hover:bg-[#1A73E8]/20 text-[#1A73E8] text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova conversa</span>
          </button>
          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-6 text-gray-300">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-[11px] text-gray-400 text-center px-3 py-4">Suas conversas aparecerão aqui.</p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className={`w-full group flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    session.id === currentSessionId ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="flex-1 min-w-0 text-xs font-medium text-gray-700 truncate">{session.title}</span>
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => handleDeleteSession(e, session)}
                    className="shrink-0 p-1 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 hover:text-[#EA4335] hover:bg-[#EA4335]/10 transition-all"
                    aria-label="Excluir conversa"
                  >
                    <Trash2 className="w-3 h-3" />
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 bg-white rounded-3xl border border-gray-200/90 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-[#F8FAFD] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {persistenceAvailable && !isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Expandir histórico"
                className="hidden sm:flex p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 shrink-0"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-[#1A73E8] to-[#34A853] flex items-center justify-center text-white shadow-xs shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Assistente IA</h3>
              <p className="text-xs text-gray-500 truncate">Mentoria inteligente para liderança acadêmica e tech</p>
            </div>
          </div>

          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34A853]/10 text-[#34A853] shrink-0">
            Online
          </span>
        </div>

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 relative">
          {isSwitchingSession && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
              <Loader2 className="w-5 h-5 animate-spin text-[#1A73E8]" />
            </div>
          )}

          {messages.length <= 1 && (
            <div className="space-y-6 mb-6">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Sugestões Rápidas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {QUICK_STARTERS.map((qs, i) => {
                  const Icon = qs.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(qs.prompt)}
                      className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 hover:bg-[#1A73E8]/5 border border-gray-200 text-left transition-all hover:border-[#1A73E8]/30 group"
                    >
                      <Icon className="w-4 h-4 text-[#1A73E8] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-800">{qs.title}</h4>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{qs.prompt}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'gemini' && (
                <div className="w-8 h-8 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 text-[#FBBC04]" />
                </div>
              )}

              <div
                className={`relative group max-w-2xl rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#1A73E8] text-white rounded-br-xs shadow-xs'
                    : 'bg-gray-50 text-gray-800 border border-gray-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                <div className="mt-2 flex items-center justify-between text-[10px] opacity-70">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'gemini' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="p-1 rounded-md hover:bg-gray-200 text-gray-500 transition-colors flex items-center gap-1"
                      aria-label="Copiar resposta"
                      title="Copiar resposta"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center shrink-0 mt-1 text-xs font-bold">
                  M
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#FBBC04]" />
              </div>
              <div className="bg-[#F8FAFD] border border-gray-200 rounded-3xl rounded-bl-xs p-4 flex items-center gap-2 text-xs text-gray-600">
                <div className="w-2 h-2 rounded-full bg-[#1A73E8] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#EA4335] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[#FBBC04] animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-gray-500 font-medium">Gemini está pensando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Pergunte ao Gemini Copilot (ex: Como estruturar um Study Jam de Gemini?)..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-2xl text-xs sm:text-sm border border-gray-200 bg-[#F8FAFD] focus:ring-2 focus:ring-[#1A73E8]/30 focus:outline-none"
            />

            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-3 rounded-2xl bg-[#1A73E8] hover:bg-[#1A73E8] text-white disabled:opacity-50 transition-all active:scale-95 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};