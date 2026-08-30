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
  Zap
} from 'lucide-react';
import { GeminiApiService } from '../services/geminiApi';

interface Message {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

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

export const GeminiCopilotModule: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'gemini',
      text: `Olá, Embaixadora Estudantil Google 2026! 🚀💙

Sou sua **Gemini Ambassador Copilot**, sua mentora de inteligência artificial dedicada. Como posso te apoiar hoje?

- Planejamento de workshops de IA e Google Cloud
- Roteiros para apresentações e Study Jams
- Resolução de dúvidas técnicas sobre o Gemini e APIs Google
- Estratégias de engajamento e comunicação com o campus!`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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

    try {
      const reply = await GeminiApiService.sendChatMessage(text, historyForRequest);
      const geminiMsg: Message = {
        id: `gemini-${Date.now()}`,
        sender: 'gemini',
        text: reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, geminiMsg]);
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
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm flex flex-col h-[78vh] overflow-hidden">
      
      {/* Copilot Header */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-[#F8FAFD] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-[#1A73E8] to-[#34A853] flex items-center justify-center text-white shadow-xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Gemini Ambassador Copilot</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34A853]/10 text-[#34A853]">
                Online • Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-xs text-gray-500">Mentoria inteligente para liderança acadêmica e tech</p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        
        {/* Quick Starters Row if few messages */}
        {messages.length <= 1 && (
          <div className="space-y-2 mb-6">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Sugestões Rápidas de Ação:
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

        {/* Message Bubbles */}
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

      {/* Input Area */}
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
  );
};
