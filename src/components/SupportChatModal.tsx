import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Headset,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import type { Book, SupportTicket, UserProfile } from '../types/library';
import {
  askBiaAssistant,
  QUICK_SUPPORT_QUESTIONS,
  type BiaConversationTurn,
} from '../utils/biaAssistant';
import { formatDateTime } from '../utils/storage';

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  books: Book[];
  borrowedBookIds: Set<string>;
  activeLoansCount: number;
  userTickets: SupportTicket[];
  onSubmitAdminTicket: (messageText: string) => void;
}

interface BiaMessage {
  id: string;
  sender: 'bia' | 'user';
  text: string;
  createdAt: string;
}

export function SupportChatModal({
  isOpen,
  onClose,
  currentUser,
  books,
  borrowedBookIds,
  activeLoansCount,
  userTickets,
  onSubmitAdminTicket,
}: SupportChatModalProps) {
  const firstName = (currentUser.name || 'Leitor(a)').split(' ')[0] || 'Leitor(a)';

  const [biaMessages, setBiaMessages] = useState<BiaMessage[]>(() => [
    {
      id: 'bia-welcome',
      sender: 'bia',
      text: `Olá, ${firstName}! Sou a Bia, Assistente BiblioTec da Escola Remy Soares. Posso explicar como alugar livros gratuitamente, prazos de devolução, liberação do leitor completo, regras do cadastro ou indicar obras do nosso acervo.`,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [biaInput, setBiaInput] = useState('');
  const [isBiaTyping, setIsBiaTyping] = useState(false);
  const [composerMode, setComposerMode] = useState<'bia' | 'admin-request'>('bia');
  const [adminDraft, setAdminDraft] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showSentBanner, setShowSentBanner] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const adminInputRef = useRef<HTMLTextAreaElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const sortedTickets = useMemo(() => {
    const safeTickets = Array.isArray(userTickets) ? userTickets : [];
    return [...safeTickets].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return (Number.isFinite(ta) ? ta : 0) - (Number.isFinite(tb) ? tb : 0);
    });
  }, [userTickets]);

  useEffect(() => {
    if (!isOpen) return;
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [isOpen, biaMessages, sortedTickets, isBiaTyping, showSentBanner, composerMode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (composerMode === 'admin-request' && adminInputRef.current) {
      adminInputRef.current.focus();
    }
  }, [composerMode]);

  if (!isOpen) return null;

  const handleSendToBia = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isBiaTyping) return;

    const userMsg: BiaMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    const historyForModel: BiaConversationTurn[] = biaMessages
      .filter((m) => m.id !== 'bia-welcome')
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text,
      }));

    setBiaMessages((prev) => [...prev, userMsg]);
    setBiaInput('');
    setIsBiaTyping(true);

    const replyText = await askBiaAssistant(
      trimmed,
      historyForModel,
      currentUser,
      books,
      borrowedBookIds,
      activeLoansCount,
    );

    setBiaMessages((prev) => [
      ...prev,
      {
        id: `bia-${Date.now()}`,
        sender: 'bia',
        text: replyText,
        createdAt: new Date().toISOString(),
      },
    ]);
    setIsBiaTyping(false);
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adminDraft.trim();
    if (trimmed.length < 4) {
      setAdminError('Por favor, escreva sua dúvida ou solicitação para o Administrador.');
      return;
    }
    onSubmitAdminTicket(trimmed);
    setAdminDraft('');
    setAdminError('');
    setComposerMode('bia');
    setShowSentBanner(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-end justify-end bg-[#0E1D33]/40 p-3 sm:p-6 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-chat-title"
    >
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#DED4C3] bg-[#FBF8F1] shadow-2xl h-[86vh] max-h-[680px]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#D7B46A]/35 bg-[#162B49] px-5 py-4 text-[#FBF8F1]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#E4C57D]">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Bia · Assistente BiblioTec</span>
            </div>
            <h2
              id="support-chat-title"
              className="mt-1 font-serif text-lg sm:text-xl font-semibold text-[#FBF8F1] leading-snug"
            >
              Suporte BiblioTec — Escola Remy Soares
            </h2>
            <p className="mt-0.5 text-xs text-[#DCE3EE] truncate">
              {currentUser.name} · {currentUser.role === 'professor' ? 'Professor' : 'Aluno'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de suporte"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#DCE3EE] hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Chat History */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 bg-[#FBF8F1]"
        >
          {/* Bia Conversation */}
          {biaMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    isUser
                      ? 'bg-[#162B49] text-[#FBF8F1]'
                      : 'border border-[#DED4C3] bg-white text-[#12233B]'
                  }`}
                >
                  <p
                    className={`mb-1 text-[11px] font-medium ${
                      isUser ? 'text-[#E4C57D]' : 'text-[#8C6820]'
                    }`}
                  >
                    {isUser ? currentUser.name : 'Bia · Assistente BiblioTec'}
                  </p>
                  <p>{msg.text}</p>
                </div>
                <span className="mt-1 px-1 font-mono text-[10px] text-[#4A596E]">
                  {formatDateTime(msg.createdAt)}
                </span>
              </div>
            );
          })}

          {isBiaTyping && (
            <div className="flex items-start">
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#DED4C3] bg-white px-4 py-2.5 text-xs text-[#4A596E]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8C6820]" />
                <span>Bia está consultando o acervo...</span>
              </div>
            </div>
          )}

          {/* Quick Questions */}
          <div className="pt-1">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#4A596E]">
              Perguntas rápidas
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUPPORT_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isBiaTyping}
                  onClick={() => {
                    setComposerMode('bia');
                    void handleSendToBia(q);
                  }}
                  className="rounded-md border border-[#DED4C3] bg-white px-3 py-1.5 text-xs font-medium text-[#162B49] hover:border-[#B68930] hover:bg-[#F3ECE0] disabled:opacity-50 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Human Admin Support Thread */}
          {sortedTickets.length > 0 && (
            <div className="border-t border-[#DED4C3] pt-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#162B49]">
                  <Headset className="h-3.5 w-3.5 text-[#8C6820]" />
                  <span>Atendimento com o Administrador</span>
                </span>
              </div>

              {sortedTickets.map((ticket) => (
                <div key={ticket.id} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A596E]">
                    <span className="font-mono text-[11px]">
                      Chamado #{ticket.id.slice(-5).toUpperCase()}
                    </span>
                    {ticket.status === 'aguardando' ? (
                      <span className="inline-flex items-center gap-1 font-medium text-[#8C6820]">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Aguardando resposta</span>
                      </span>
                    ) : ticket.status === 'respondido' ? (
                      <span className="inline-flex items-center gap-1 font-medium text-[#162B49]">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Respondido pelo Administrador</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-[#155E42]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Concluído</span>
                      </span>
                    )}
                  </div>

                  {(Array.isArray(ticket.messages) ? ticket.messages : []).map((msg) => {
                    if (msg.sender === 'system') {
                      return (
                        <div
                          key={msg.id}
                          className="rounded-md border border-[#DED4C3] bg-[#F3ECE0] px-3 py-2 text-center text-xs text-[#4A596E]"
                        >
                          {msg.text}
                        </div>
                      );
                    }
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                            isUser
                              ? 'bg-[#162B49] text-[#FBF8F1]'
                              : 'border border-[#B68930] bg-[#FFFDF8] text-[#12233B]'
                          }`}
                        >
                          <p
                            className={`mb-1 text-[11px] font-semibold ${
                              isUser ? 'text-[#E4C57D]' : 'text-[#8C6820]'
                            }`}
                          >
                            {isUser
                              ? `${msg.senderName} (${
                                  ticket.userRole === 'professor' ? 'Professor' : 'Aluno'
                                })`
                              : 'Administrador · Escola Remy Soares'}
                          </p>
                          <p>{msg.text}</p>
                        </div>
                        <span className="mt-1 px-1 font-mono text-[10px] text-[#4A596E]">
                          {formatDateTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {showSentBanner && (
            <div
              role="status"
              className="rounded-lg border border-[#155E42]/40 bg-[#EFF7F3] px-4 py-3 text-xs leading-relaxed text-[#155E42]"
            >
              <p className="font-semibold">Solicitação registrada com sucesso.</p>
              <p className="mt-0.5">
                Sua solicitação foi enviada ao Administrador da Biblioteca Remy Soares. Aguarde a
                resposta aqui mesmo.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions + Input Area */}
        <div className="border-t border-[#DED4C3] bg-white px-4 sm:px-5 py-3.5 space-y-3">
          {composerMode === 'bia' ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setComposerMode('admin-request');
                    setAdminError('');
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#B68930] bg-[#FBF8F1] px-3.5 py-2 text-xs font-semibold text-[#12233B] hover:bg-[#F3ECE0] transition-colors"
                >
                  <Headset className="h-4 w-4 text-[#8C6820]" />
                  <span>Falar com o Administrador</span>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendToBia(biaInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={biaInput}
                  onChange={(e) => setBiaInput(e.target.value)}
                  placeholder="Digite sua dúvida para a Bia..."
                  aria-label="Digite sua dúvida para a Bia"
                  className="flex-1 rounded-md border border-[#DED4C3] bg-[#FBF8F1] px-3.5 py-2.5 text-sm text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!biaInput.trim() || isBiaTyping}
                  aria-label="Enviar mensagem para a Bia"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#162B49] text-[#FBF8F1] hover:bg-[#0E1D33] disabled:opacity-45 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="admin-support-message"
                  className="text-xs font-semibold text-[#12233B]"
                >
                  Mensagem ao Administrador da Escola Remy Soares
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setComposerMode('bia');
                    setAdminError('');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#4A596E] hover:text-[#12233B]"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Voltar para a Bia</span>
                </button>
              </div>

              <p className="text-[11px] text-[#4A596E]">
                Enviando como <strong className="text-[#12233B]">{currentUser.name}</strong> (
                {currentUser.role === 'professor' ? 'Professor' : 'Aluno'} ·{' '}
                {currentUser.departmentOrClass})
              </p>

              <textarea
                ref={adminInputRef}
                id="admin-support-message"
                rows={3}
                value={adminDraft}
                onChange={(e) => {
                  setAdminDraft(e.target.value);
                  if (adminError) setAdminError('');
                }}
                placeholder="Escreva aqui sua dúvida, problema ou pedido para o Administrador..."
                className="w-full rounded-md border border-[#DED4C3] bg-[#FBF8F1] px-3.5 py-2.5 text-sm text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:bg-white focus:outline-none"
                required
              />

              {adminError && (
                <p className="text-xs font-medium text-[#8C3B2B]" role="alert">
                  {adminError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setComposerMode('bia');
                    setAdminError('');
                  }}
                  className="rounded-md px-3 py-2 text-xs font-medium text-[#4A596E] hover:text-[#12233B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#162B49] px-4 py-2 text-xs font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors"
                >
                  <Send className="h-3.5 w-3.5 text-[#E4C57D]" />
                  <span>Enviar ao Administrador</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
