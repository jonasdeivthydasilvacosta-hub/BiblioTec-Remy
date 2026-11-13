import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Headset,
  RotateCcw,
  Send,
  UserCheck,
} from 'lucide-react';
import type { SupportTicket, SupportTicketStatus } from '../types/library';
import { formatDateTime } from '../utils/storage';

interface AdminSupportViewProps {
  tickets: SupportTicket[];
  onReplyTicket: (ticketId: string, replyText: string) => void;
  onConcludeTicket: (ticketId: string) => void;
  onReopenTicket: (ticketId: string) => void;
}

type TicketFilter = 'todos' | SupportTicketStatus;

export function AdminSupportView({
  tickets,
  onReplyTicket,
  onConcludeTicket,
  onReopenTicket,
}: AdminSupportViewProps) {
  const safeTickets = useMemo(() => (Array.isArray(tickets) ? tickets : []), [tickets]);
  const [filter, setFilter] = useState<TicketFilter>('todos');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    () => safeTickets[0]?.id ?? null,
  );
  const [replyDraft, setReplyDraft] = useState('');
  const [replyError, setReplyError] = useState('');

  const waitingCount = useMemo(
    () => safeTickets.filter((t) => t.status === 'aguardando').length,
    [safeTickets],
  );
  const answeredCount = useMemo(
    () => safeTickets.filter((t) => t.status === 'respondido').length,
    [safeTickets],
  );
  const concludedCount = useMemo(
    () => safeTickets.filter((t) => t.status === 'concluido').length,
    [safeTickets],
  );

  const sortedTickets = useMemo(() => {
    const priority: Record<SupportTicketStatus, number> = {
      aguardando: 0,
      respondido: 1,
      concluido: 2,
    };
    return [...safeTickets].sort((a, b) => {
      const pa = priority[a.status] ?? 1;
      const pb = priority[b.status] ?? 1;
      if (pa !== pb) {
        return pa - pb;
      }
      const ta = new Date(a.updatedAt).getTime();
      const tb = new Date(b.updatedAt).getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });
  }, [safeTickets]);

  const filteredTickets = useMemo(() => {
    if (filter === 'todos') return sortedTickets;
    return sortedTickets.filter((t) => t.status === filter);
  }, [sortedTickets, filter]);

  const selectedTicket = useMemo(() => {
    const found = filteredTickets.find((t) => t.id === selectedTicketId);
    return found ?? filteredTickets[0] ?? null;
  }, [filteredTickets, selectedTicketId]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    const trimmed = replyDraft.trim();
    if (!trimmed) {
      setReplyError('Digite sua resposta antes de enviar.');
      return;
    }
    onReplyTicket(selectedTicket.id, trimmed);
    setReplyDraft('');
    setReplyError('');
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DED4C3] pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#8C6820]">
            BiblioTec · Atendimento Escolar
          </p>
          <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#12233B]">
            Atendimentos / Suporte
          </h2>
          <p className="mt-1.5 text-sm text-[#4A596E]">
            Visualize solicitações de alunos e professores, responda diretamente no chat e conclua
            chamados resolvidos.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm shrink-0">
          <div>
            <span className="block text-xs text-[#4A596E]">Aguardando resposta</span>
            <span className="font-mono text-2xl font-semibold tabular-nums text-[#8C3B2B]">
              {waitingCount}
            </span>
          </div>
          <div className="h-8 w-px bg-[#DED4C3]" />
          <div>
            <span className="block text-xs text-[#4A596E]">Respondidos</span>
            <span className="font-mono text-2xl font-semibold tabular-nums text-[#162B49]">
              {answeredCount}
            </span>
          </div>
          <div className="h-8 w-px bg-[#DED4C3]" />
          <div>
            <span className="block text-xs text-[#4A596E]">Concluídos</span>
            <span className="font-mono text-2xl font-semibold tabular-nums text-[#155E42]">
              {concludedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'todos', label: `Todos (${safeTickets.length})` },
            { id: 'aguardando', label: `Aguardando (${waitingCount})` },
            { id: 'respondido', label: `Respondidos (${answeredCount})` },
            { id: 'concluido', label: `Concluídos (${concludedCount})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-md px-3.5 py-2 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
              filter === tab.id
                ? 'border-[#162B49] bg-[#162B49] text-[#FBF8F1]'
                : 'border-[#DED4C3] bg-white text-[#4A596E] hover:border-[#B68930] hover:text-[#12233B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Master-Detail Conversation Area */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-lg border border-[#DED4C3] bg-white p-12 text-center">
          <Headset className="mx-auto h-8 w-8 text-[#8C6820]" />
          <h3 className="mt-3 font-serif text-2xl font-semibold text-[#12233B]">
            Nenhum atendimento nesta categoria
          </h3>
          <p className="mt-2 text-sm text-[#4A596E]">
            Quando alunos ou professores clicarem em &ldquo;Falar com o Administrador&rdquo;, as
            mensagens aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Ticket List */}
          <div className="lg:col-span-5 space-y-3">
            {filteredTickets.map((ticket) => {
              const isSelected = selectedTicket?.id === ticket.id;
              const ticketMessages = Array.isArray(ticket.messages) ? ticket.messages : [];
              const lastMsg = ticketMessages[ticketMessages.length - 1];
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => {
                    setSelectedTicketId(ticket.id);
                    setReplyError('');
                  }}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    isSelected
                      ? 'border-[#162B49] bg-[#F3ECE0]'
                      : 'border-[#DED4C3] bg-white hover:border-[#B68930]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[#8C6820]">
                      {ticket.userRole === 'professor' ? 'Professor' : 'Aluno'} ·{' '}
                      <span className="font-mono tabular-nums">{ticket.registrationCode}</span>
                    </span>
                    {ticket.status === 'aguardando' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#8C3B2B]">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Aguardando</span>
                      </span>
                    ) : ticket.status === 'respondido' ? (
                      <span className="inline-flex items-center gap-1 font-medium text-[#162B49]">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Respondido</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-[#155E42]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Concluído</span>
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 font-serif text-lg font-semibold text-[#12233B] truncate">
                    {ticket.userName}
                  </p>
                  <p className="text-xs text-[#4A596E] truncate">{ticket.departmentOrClass}</p>

                  {lastMsg && (
                    <p className="mt-2.5 text-xs text-[#12233B] line-clamp-2 leading-relaxed">
                      {lastMsg.text}
                    </p>
                  )}

                  <p className="mt-2 font-mono text-[11px] text-[#4A596E]">
                    Atualizado em {formatDateTime(ticket.updatedAt)}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Conversation */}
          {selectedTicket && (
            <div className="lg:col-span-7 rounded-lg border border-[#DED4C3] bg-white overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DED4C3] bg-[#FBF8F1] px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#8C6820] font-medium">
                    <span>{selectedTicket.userRole === 'professor' ? 'Professor' : 'Aluno'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedTicket.departmentOrClass}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{selectedTicket.registrationCode}</span>
                  </div>
                  <h3 className="mt-1 font-serif text-2xl font-semibold text-[#12233B]">
                    {selectedTicket.userName}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedTicket.status !== 'concluido' ? (
                    <button
                      type="button"
                      onClick={() => onConcludeTicket(selectedTicket.id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#155E42] bg-[#EFF7F3] px-3.5 py-2 text-xs font-semibold text-[#155E42] hover:bg-[#DFEFE7] transition-colors whitespace-nowrap"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Marcar como Concluído</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onReopenTicket(selectedTicket.id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#DED4C3] bg-white px-3.5 py-2 text-xs font-medium text-[#12233B] hover:border-[#B68930] transition-colors whitespace-nowrap"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reabrir Atendimento</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Message Thread */}
              <div className="max-h-[400px] overflow-y-auto px-5 py-5 space-y-4 bg-[#FBF8F1]/40">
                {(Array.isArray(selectedTicket.messages) ? selectedTicket.messages : []).map((msg) => {
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
                  const isAdminMsg = msg.sender === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                          isAdminMsg
                            ? 'bg-[#162B49] text-[#FBF8F1]'
                            : 'border border-[#DED4C3] bg-white text-[#12233B]'
                        }`}
                      >
                        <p
                          className={`mb-1 text-[11px] font-semibold ${
                            isAdminMsg ? 'text-[#E4C57D]' : 'text-[#8C6820]'
                          }`}
                        >
                          {isAdminMsg
                            ? 'Administrador · Escola Remy Soares'
                            : `${msg.senderName} (${
                                selectedTicket.userRole === 'professor' ? 'Professor' : 'Aluno'
                              })`}
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

              {/* Reply Box */}
              <form
                onSubmit={handleSendReply}
                className="border-t border-[#DED4C3] bg-white px-5 py-4 space-y-3"
              >
                <label
                  htmlFor="admin-ticket-reply"
                  className="block text-xs font-semibold text-[#12233B]"
                >
                  {selectedTicket.status === 'concluido'
                    ? 'Atendimento concluído (enviar nova mensagem reabrirá o chamado)'
                    : `Responder diretamente para ${selectedTicket.userName}`}
                </label>
                <textarea
                  id="admin-ticket-reply"
                  rows={3}
                  value={replyDraft}
                  onChange={(e) => {
                    setReplyDraft(e.target.value);
                    if (replyError) setReplyError('');
                  }}
                  placeholder="Escreva a resposta que aparecerá na janela de suporte deste usuário..."
                  className="w-full rounded-md border border-[#DED4C3] bg-[#FBF8F1] px-3.5 py-2.5 text-sm text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:bg-white focus:outline-none"
                />
                {replyError && (
                  <p className="text-xs font-medium text-[#8C3B2B]" role="alert">
                    {replyError}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-[#4A596E]">
                    A resposta fica visível imediatamente na aba Suporte / Ajuda do leitor.
                  </span>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-md bg-[#162B49] px-4 py-2 text-xs font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors whitespace-nowrap"
                  >
                    <Send className="h-3.5 w-3.5 text-[#E4C57D]" />
                    <span>Enviar Resposta</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
