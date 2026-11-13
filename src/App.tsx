import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  BookText,
  CheckCircle2,
  Clock,
  CreditCard,
  Headset,
  Layers,
  Lock,
  LogOut,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Library,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  COLLECTION_META,
  type AppSection,
  type AvailabilityFilter,
  type Book,
  type CollectionId,
  type LoanRecord,
  type SupportTicket,
  type UserProfile,
} from './types/library';
import { HERO_LIBRARY_IMAGE } from './data/coverAssets';
import {
  ADMIN_MASTER_PASSWORD,
  ADMIN_SECRET_PIN,
  SEED_ADMIN_USER,
} from './data/seedLibrary';
import {
  calculateInitialDueDate,
  calculateRenewedDueDate,
  clearAdminPinLockout,
  formatDayMonth,
  loadAdminPinLockout,
  loadLibraryState,
  normalizeSecurityAnswer,
  saveAdminPinLockout,
  saveLibraryState,
  STORAGE_KEY_PREFIX,
} from './utils/storage';
import { BookCover } from './components/BookCover';
import {
  AuthModal,
  type AdminPinCheckResult,
  type ReaderLoginResult,
} from './components/AuthModal';
import { BookDetailModal } from './components/BookDetailModal';
import { AddBookModal } from './components/AddBookModal';
import { MyLoansView } from './components/MyLoansView';
import { DigitalCardView } from './components/DigitalCardView';
import { CollectionsView } from './components/CollectionsView';
import { BookReaderModal } from './components/BookReaderModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { SupportChatModal } from './components/SupportChatModal';
import { AdminSupportView } from './components/AdminSupportView';
import { AdminUsersView } from './components/AdminUsersView';

interface ToastMessage {
  id: number;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function App() {
  const initialState = useMemo(() => loadLibraryState(), []);

  const [users, setUsers] = useState<UserProfile[]>(initialState.users);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialState.currentUserId);
  const [books, setBooks] = useState<Book[]>(initialState.books);
  const [loans, setLoans] = useState<LoanRecord[]>(initialState.loans);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(
    initialState.supportTickets,
  );

  const [section, setSection] = useState<AppSection>('acervo');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<CollectionId | 'all'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('todos');

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [readingBookId, setReadingBookId] = useState<string | null>(null);
  const [pendingBorrowBookId, setPendingBorrowBookId] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'register' | 'login' | 'admin'>('login');
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookPendingDelete, setBookPendingDelete] = useState<Book | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    saveLibraryState({ users, currentUserId, books, loans, supportTickets });
  }, [users, currentUserId, books, loans, supportTickets]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const handleStorageSync = (event: StorageEvent) => {
      if (event.key && !event.key.startsWith(STORAGE_KEY_PREFIX)) {
        return;
      }
      const next = loadLibraryState();
      setUsers(next.users);
      setBooks(next.books);
      setLoans(next.loans);
      setSupportTickets(next.supportTickets);
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId],
  );
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (currentUser && currentUser.status === 'banido') {
      setReadingBookId(null);
      setSelectedBookId(null);
      setIsSupportOpen(false);
      setSection('acervo');
      setCurrentUserId(null);
      setToast({
        id: Date.now(),
        text: 'Esta conta foi suspensa pelo Administrador da Biblioteca Remy Soares.',
      });
    }
  }, [currentUser]);

  const activeLoans = useMemo(() => loans.filter((l) => !l.returnedAt), [loans]);

  const borrowedBookIds = useMemo(
    () => new Set(activeLoans.map((l) => l.bookId)),
    [activeLoans],
  );

  const waitingTicketsCount = useMemo(
    () => supportTickets.filter((t) => t.status === 'aguardando').length,
    [supportTickets],
  );

  const mySupportTickets = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin') return [];
    return supportTickets.filter((t) => t.userId === currentUser.id);
  }, [supportTickets, currentUser]);

  const unreadAdminRepliesCount = useMemo(
    () => mySupportTickets.filter((t) => t.hasUnreadAdminReply).length,
    [mySupportTickets],
  );

  const activeLoanByBookId = useMemo(() => {
    const map = new Map<string, LoanRecord>();
    for (const loan of activeLoans) {
      map.set(loan.bookId, loan);
    }
    return map;
  }, [activeLoans]);

  const myActiveLoansCount = useMemo(() => {
    if (!currentUser) return 0;
    return activeLoans.filter((l) => l.userId === currentUser.id).length;
  }, [activeLoans, currentUser]);

  const myReturnedLoansCount = useMemo(() => {
    if (!currentUser) return 0;
    return loans.filter((l) => l.userId === currentUser.id && Boolean(l.returnedAt)).length;
  }, [loans, currentUser]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((book) => {
      if (selectedCollection !== 'all' && book.collection !== selectedCollection) {
        return false;
      }
      const isLoaned = activeLoanByBookId.has(book.id);
      if (availabilityFilter === 'disponivel' && isLoaned) return false;
      if (availabilityFilter === 'emprestado' && !isLoaned) return false;

      if (!q) return true;
      const collectionLabel =
        COLLECTION_META.find((c) => c.id === book.collection)?.name.toLowerCase() ?? '';
      const subjects = Array.isArray(book.subjects) ? book.subjects : [];
      return (
        (book.title ?? '').toLowerCase().includes(q) ||
        (book.author ?? '').toLowerCase().includes(q) ||
        subjects.some((s) => (s ?? '').toLowerCase().includes(q)) ||
        (book.synopsis ?? '').toLowerCase().includes(q) ||
        collectionLabel.includes(q)
      );
    });
  }, [books, searchQuery, selectedCollection, availabilityFilter, activeLoanByBookId]);

  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId) ?? null,
    [books, selectedBookId],
  );

  const readingBook = useMemo(
    () => books.find((b) => b.id === readingBookId) ?? null,
    [books, readingBookId],
  );

  const canReadSelectedBook = useMemo(() => {
    if (!readingBook || !currentUser) return false;
    const loan = activeLoanByBookId.get(readingBook.id);
    return Boolean(loan && loan.userId === currentUser.id);
  }, [readingBook, currentUser, activeLoanByBookId]);

  const handleOpenReader = (book: Book) => {
    if (!currentUser) {
      setPendingBorrowBookId(book.id);
      openAuthModal('login');
      return;
    }
    const loan = activeLoanByBookId.get(book.id);
    if (!loan || loan.userId !== currentUser.id) {
      showToast('Alugue este livro gratuitamente para liberar a leitura.');
      return;
    }
    setSelectedBookId(null);
    setReadingBookId(book.id);
  };

  const showToast = (text: string, actionLabel?: string, onAction?: () => void) => {
    setToast({ id: Date.now(), text, actionLabel, onAction });
  };

  const executeBorrow = (bookId: string, user: UserProfile) => {
    if (activeLoanByBookId.has(bookId)) {
      showToast('Este exemplar já está emprestado no momento.');
      return;
    }
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    const nowIso = new Date().toISOString();
    const newLoan: LoanRecord = {
      id: `loan-${Date.now()}`,
      bookId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      borrowedAt: nowIso,
      dueAt: calculateInitialDueDate(user.role, nowIso),
      renewCount: 0,
    };

    setLoans((prev) => [newLoan, ...prev]);
    showToast(
      `Empréstimo confirmado: "${book.title}" até ${formatDayMonth(newLoan.dueAt)}.`,
      'Ver em Meus Alugados',
      () => {
        setSelectedBookId(null);
        setSection('alugados');
      },
    );
  };

  const handleBorrowBook = (bookId: string) => {
    if (!currentUser) {
      setPendingBorrowBookId(bookId);
      openAuthModal('login');
      return;
    }
    executeBorrow(bookId, currentUser);
  };

  const handleReturnLoan = (loanId: string) => {
    const target = loans.find((l) => l.id === loanId);
    const book = target ? books.find((b) => b.id === target.bookId) : null;
    if (target && readingBookId === target.bookId) {
      setReadingBookId(null);
    }
    setLoans((prev) =>
      prev.map((loan) =>
        loan.id === loanId ? { ...loan, returnedAt: new Date().toISOString() } : loan,
      ),
    );
    if (book) {
      showToast(`"${book.title}" devolvido e leitura bloqueada até novo empréstimo.`);
    }
  };

  const handleRenewLoan = (loanId: string) => {
    const target = loans.find((l) => l.id === loanId);
    if (!target) return;
    const nextDue = calculateRenewedDueDate(target.userRole, target.dueAt);
    setLoans((prev) =>
      prev.map((loan) =>
        loan.id === loanId
          ? { ...loan, dueAt: nextDue, renewCount: loan.renewCount + 1 }
          : loan,
      ),
    );
    showToast(`Prazo renovado com sucesso até ${formatDayMonth(nextDue)}.`);
  };

  const handleLogout = (customMessage?: string) => {
    setReadingBookId(null);
    setSelectedBookId(null);
    setPendingBorrowBookId(null);
    setIsSupportOpen(false);
    setIsAddBookOpen(false);
    setEditingBook(null);
    setBookPendingDelete(null);
    setSearchQuery('');
    setSection('acervo');
    setCurrentUserId(null);
    showToast(customMessage ?? 'Sessão encerrada com segurança.');
  };

  const handleCreateUser = (profile: UserProfile): { ok: boolean; error?: string } => {
    const normalizedNewName = normalizeSecurityAnswer(profile.name);
    const matchingBanned = users.find(
      (u) =>
        u.role !== 'admin' &&
        u.status === 'banido' &&
        normalizeSecurityAnswer(u.name) === normalizedNewName,
    );
    if (matchingBanned) {
      return {
        ok: false,
        error: 'Esta conta foi suspensa pelo Administrador da Biblioteca Remy Soares.',
      };
    }

    const safeProfile: UserProfile = {
      ...profile,
      role: profile.role === 'professor' ? 'professor' : 'aluno',
      status: 'ativo',
    };
    setUsers((prev) => [safeProfile, ...prev]);
    setCurrentUserId(safeProfile.id);
    setIsSupportOpen(false);
    setSection('acervo');
    if (pendingBorrowBookId) {
      const bookId = pendingBorrowBookId;
      setPendingBorrowBookId(null);
      executeBorrow(bookId, safeProfile);
    } else {
      showToast(`Bem-vindo(a), ${safeProfile.name.split(' ')[0]}! Carteirinha emitida.`);
    }
    return { ok: true };
  };

  const handleLoginReader = ({
    fullName,
    method,
    secretValue,
    securityQuestion,
  }: {
    fullName: string;
    method: 'pin' | 'question';
    secretValue: string;
    securityQuestion?: string;
  }): ReaderLoginResult => {
    const normalizedInputName = normalizeSecurityAnswer(fullName);
    const candidates = users.filter(
      (u) => u.role !== 'admin' && normalizeSecurityAnswer(u.name) === normalizedInputName,
    );

    const matchedUser = candidates.find((u) => {
      if (method === 'pin') {
        return secretValue.trim() === (u.pinCode ?? '');
      }
      return (
        securityQuestion === u.securityQuestion &&
        normalizeSecurityAnswer(secretValue) === normalizeSecurityAnswer(u.securityAnswer ?? '')
      );
    });

    if (!matchedUser) {
      return {
        ok: false,
        error:
          method === 'pin'
            ? 'Nome ou código PIN incorretos.'
            : 'Nome, pergunta ou resposta de segurança incorretos.',
      };
    }

    if (matchedUser.status === 'banido') {
      return {
        ok: false,
        error: 'Esta conta foi suspensa pelo Administrador da Biblioteca Remy Soares.',
      };
    }

    setCurrentUserId(matchedUser.id);
    setIsSupportOpen(false);
    setSection('acervo');
    if (pendingBorrowBookId) {
      const bookId = pendingBorrowBookId;
      setPendingBorrowBookId(null);
      executeBorrow(bookId, matchedUser);
    } else {
      showToast(`Sessão ativa como ${matchedUser.name}.`);
    }
    return { ok: true };
  };

  const handleVerifyAdminPassword = (password: string): boolean => {
    return password === ADMIN_MASTER_PASSWORD;
  };

  const handleVerifyAdminPin = (pin: string): AdminPinCheckResult => {
    const now = Date.now();
    const lockout = loadAdminPinLockout();

    if (lockout.lockUntil > now) {
      return {
        ok: false,
        remainingAttempts: 0,
        lockSecondsRemaining: Math.ceil((lockout.lockUntil - now) / 1000),
      };
    }

    const currentAttempts =
      lockout.lockUntil > 0 && lockout.lockUntil <= now ? 0 : lockout.attempts;

    if (pin === ADMIN_SECRET_PIN) {
      clearAdminPinLockout();
      const adminAccount = users.find((u) => u.role === 'admin') ?? SEED_ADMIN_USER;
      setUsers((prev) =>
        prev.some((u) => u.id === adminAccount.id) ? prev : [...prev, adminAccount],
      );
      setCurrentUserId(adminAccount.id);
      setPendingBorrowBookId(null);
      setIsSupportOpen(false);
      showToast('Acesso de Administrador liberado após verificação em duas etapas.');
      return { ok: true, remainingAttempts: 3, lockSecondsRemaining: 0 };
    }

    const nextAttempts = currentAttempts + 1;
    if (nextAttempts >= 3) {
      const lockUntil = now + 30_000;
      saveAdminPinLockout({ attempts: 0, lockUntil });
      return { ok: false, remainingAttempts: 0, lockSecondsRemaining: 30 };
    }

    saveAdminPinLockout({ attempts: nextAttempts, lockUntil: 0 });
    return {
      ok: false,
      remainingAttempts: 3 - nextAttempts,
      lockSecondsRemaining: 0,
    };
  };

  const handleOpenSupport = () => {
    if (!currentUser || currentUser.role === 'admin') return;
    setSupportTickets((prev) =>
      prev.map((t) =>
        t.userId === currentUser.id && t.hasUnreadAdminReply
          ? { ...t, hasUnreadAdminReply: false }
          : t,
      ),
    );
    setIsSupportOpen(true);
  };

  const handleSubmitAdminTicket = (messageText: string) => {
    if (!currentUser || currentUser.role === 'admin') return;
    const nowIso = new Date().toISOString();
    const readerRole: 'aluno' | 'professor' =
      currentUser.role === 'professor' ? 'professor' : 'aluno';

    const existingOpen = supportTickets.find(
      (t) => t.userId === currentUser.id && t.status !== 'concluido',
    );

    if (existingOpen) {
      setSupportTickets((prev) =>
        prev.map((t) =>
          t.id === existingOpen.id
            ? {
                ...t,
                status: 'aguardando',
                updatedAt: nowIso,
                hasUnreadAdminReply: false,
                messages: [
                  ...t.messages,
                  {
                    id: `msg-${Date.now()}`,
                    sender: 'user',
                    senderName: currentUser.name,
                    text: messageText,
                    createdAt: nowIso,
                  },
                ],
              }
            : t,
        ),
      );
      return;
    }

    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: readerRole,
      departmentOrClass: currentUser.departmentOrClass,
      registrationCode: currentUser.registrationCode,
      subject: messageText.slice(0, 60),
      status: 'aguardando',
      createdAt: nowIso,
      updatedAt: nowIso,
      hasUnreadAdminReply: false,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'user',
          senderName: currentUser.name,
          text: messageText,
          createdAt: nowIso,
        },
      ],
    };

    setSupportTickets((prev) => [newTicket, ...prev]);
  };

  const handleAdminReplyTicket = (ticketId: string, replyText: string) => {
    if (!isAdmin) return;
    const nowIso = new Date().toISOString();
    setSupportTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'respondido',
              updatedAt: nowIso,
              hasUnreadAdminReply: true,
              messages: [
                ...t.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender: 'admin',
                  senderName: 'Administrador · Escola Remy Soares',
                  text: replyText,
                  createdAt: nowIso,
                },
              ],
            }
          : t,
      ),
    );
    showToast('Resposta enviada para a janela de suporte do usuário.');
  };

  const handleAdminConcludeTicket = (ticketId: string) => {
    if (!isAdmin) return;
    const nowIso = new Date().toISOString();
    setSupportTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'concluido',
              updatedAt: nowIso,
              messages: [
                ...t.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender: 'system',
                  senderName: 'Sistema',
                  text: 'Atendimento marcado como concluído pelo Administrador.',
                  createdAt: nowIso,
                },
              ],
            }
          : t,
      ),
    );
    showToast('Atendimento marcado como concluído.');
  };

  const handleAdminReopenTicket = (ticketId: string) => {
    if (!isAdmin) return;
    const nowIso = new Date().toISOString();
    setSupportTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'aguardando',
              updatedAt: nowIso,
              messages: [
                ...t.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender: 'system',
                  senderName: 'Sistema',
                  text: 'Atendimento reaberto pelo Administrador.',
                  createdAt: nowIso,
                },
              ],
            }
          : t,
      ),
    );
  };

  const openAuthModal = (tab: 'register' | 'login' | 'admin' = 'login') => {
    setAuthInitialTab(tab);
    setIsAuthOpen(true);
  };

  const handleAddBook = (newBook: Book) => {
    if (!isAdmin) return;
    setBooks((prev) => [newBook, ...prev]);
    setSelectedCollection('all');
    setAvailabilityFilter('todos');
    setSection('acervo');
    showToast(`"${newBook.title}" adicionado ao acervo da escola.`);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    if (!isAdmin) return;
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
    showToast(`Alterações salvas em "${updatedBook.title}".`);
  };

  const handleConfirmDeleteBook = (bookId: string) => {
    if (!isAdmin) return;
    const target = books.find((b) => b.id === bookId);
    if (selectedBookId === bookId) setSelectedBookId(null);
    if (readingBookId === bookId) setReadingBookId(null);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    setLoans((prev) => prev.filter((l) => l.bookId !== bookId));
    setBookPendingDelete(null);
    if (target) {
      showToast(`"${target.title}" foi removido do catálogo escolar.`);
    }
  };

  const handleForceReturnLoan = (loanId: string) => {
    if (!isAdmin) return;
    const target = loans.find((l) => l.id === loanId);
    const book = target ? books.find((b) => b.id === target.bookId) : null;
    if (target && readingBookId === target.bookId) {
      setReadingBookId(null);
    }
    setLoans((prev) =>
      prev.map((loan) =>
        loan.id === loanId ? { ...loan, returnedAt: new Date().toISOString() } : loan,
      ),
    );
    if (book && target) {
      showToast(
        `Empréstimo de "${book.title}" removido da conta de ${target.userName} e devolvido ao catálogo.`,
      );
    }
  };

  const handleBanUser = (userId: string) => {
    if (!isAdmin) return;
    const target = users.find((u) => u.id === userId);
    if (!target || target.role === 'admin') return;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'banido' as const } : u)),
    );
    showToast(`Conta de ${target.name} foi suspensa e desconectada.`);
  };

  const handleReactivateUser = (userId: string) => {
    if (!isAdmin) return;
    const target = users.find((u) => u.id === userId);
    if (!target || target.role === 'admin') return;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'ativo' as const } : u)),
    );
    showToast(`Conta de ${target.name} foi reativada com sucesso.`);
  };

  const availableTotal = Math.max(0, books.length - activeLoans.length);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F1] text-[#12233B] pb-20 md:pb-0">
      {/* Top Bar Contract: [Brand title, one line] — [4 nav links] — [1 primary action] */}
      <header className="sticky top-0 z-30 border-b border-[#DED4C3] bg-[#FBF8F1]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
          <button
            type="button"
            onClick={() => setSection('acervo')}
            className="flex flex-col items-start text-left whitespace-nowrap shrink-0 leading-none focus-visible:outline-2 focus-visible:outline-[#162B49]"
          >
            <span className="font-serif text-xl sm:text-[22px] font-semibold tracking-tight text-[#12233B]">
              BiblioTec
            </span>
            <span className="mt-1 text-[10px] sm:text-[11px] font-medium tracking-wider uppercase text-[#8C6820]">
              Escola Remy Soares
            </span>
          </button>

          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-5 text-sm font-medium"
          >
            {(
              isAdmin
                ? ([
                    { id: 'acervo', label: 'Acervo' },
                    { id: 'colecoes', label: 'Coleções' },
                    { id: 'carteirinha', label: 'Carteirinha' },
                  ] as const)
                : ([
                    { id: 'acervo', label: 'Acervo' },
                    { id: 'colecoes', label: 'Coleções' },
                    {
                      id: 'alugados',
                      label:
                        myActiveLoansCount > 0
                          ? `Meus Alugados (${myActiveLoansCount})`
                          : 'Meus Alugados',
                    },
                    { id: 'carteirinha', label: 'Carteirinha' },
                  ] as const)
            ).map((item) => {
              const isActive = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-[#B68930] text-[#12233B]'
                      : 'border-transparent text-[#4A596E] hover:text-[#12233B]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setSection('atendimentos')}
                  className={`inline-flex items-center gap-2 py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    section === 'atendimentos'
                      ? 'border-[#B68930] text-[#12233B]'
                      : 'border-transparent text-[#4A596E] hover:text-[#12233B]'
                  }`}
                >
                  <span>Atendimentos / Suporte</span>
                  {waitingTicketsCount > 0 && (
                    <span className="rounded bg-[#B68930] px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-none tabular-nums text-[#12233B]">
                      {waitingTicketsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSection('usuarios')}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    section === 'usuarios'
                      ? 'border-[#B68930] text-[#12233B]'
                      : 'border-transparent text-[#4A596E] hover:text-[#12233B]'
                  }`}
                >
                  Gerenciar Usuários / Contas
                </button>
              </>
            )}
          </nav>

          <div className="flex items-center shrink-0">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setEditingBook(null);
                  setIsAddBookOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-md bg-[#162B49] px-4 py-2 text-xs sm:text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Cadastrar Livro</span>
              </button>
            ) : currentUser ? (
              <button
                type="button"
                onClick={() => handleLogout()}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#8C3B2B]/50 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-[#8C3B2B] hover:bg-[#F3ECE0] transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="rounded-md bg-[#162B49] px-4 py-2 text-xs sm:text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors whitespace-nowrap shrink-0"
              >
                Entrar / Cadastro
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {section === 'acervo' && (
          <div className="space-y-10">
            {/* Editorial Split Hero */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-between py-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-[#8C6820]">
                    BiblioTec · Biblioteca Escolar Remy Soares
                  </p>
                  <h1 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold tracking-tight text-[#12233B] leading-[1.12]">
                    Acervo escolar aberto para ler, pesquisar e levar para casa
                  </h1>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-[#4A596E]">
                    Consulte livros disponíveis nas estantes da escola e realize retiradas gratuitas
                    com prazo automático de 14 dias para alunos e 30 dias para professores.
                  </p>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <a
                    href="#catalogo-escolar"
                    className="inline-flex items-center gap-2 rounded-md bg-[#162B49] px-5 py-3 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors whitespace-nowrap shrink-0"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Pesquisar no Catálogo</span>
                  </a>

                  {currentUser ? (
                    <button
                      type="button"
                      onClick={() => setSection('carteirinha')}
                      className="inline-flex items-center gap-2 rounded-md border border-[#DED4C3] bg-white px-4 py-3 text-sm font-medium text-[#12233B] hover:border-[#B68930] transition-colors whitespace-nowrap shrink-0"
                    >
                      <CreditCard className="h-4 w-4 text-[#8C6820]" />
                      <span className="truncate max-w-[200px]">{currentUser.name}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAuthModal('register')}
                      className="inline-flex items-center gap-2 rounded-md border border-[#162B49] bg-white px-4 py-3 text-sm font-medium text-[#162B49] hover:bg-[#F3ECE0] transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Emitir Carteirinha</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="h-60 sm:h-72 lg:h-full min-h-[260px] overflow-hidden rounded-lg border border-[#DED4C3] bg-[#EAE0CE]">
                  <img
                    src={HERO_LIBRARY_IMAGE}
                    alt="Sala de leitura da Biblioteca Escolar com estantes em azul profundo e mesas de madeira clara"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </section>

            {/* Operational Utility Strip */}
            <section
              aria-label="Resumo do acervo"
              className="grid grid-cols-2 lg:grid-cols-4 border-y border-[#DED4C3] py-5 gap-6"
            >
              <div>
                <span className="block text-xs text-[#4A596E]">Obras catalogadas</span>
                <span className="mt-1 block font-mono text-2xl font-semibold tabular-nums text-[#12233B]">
                  {books.length}
                </span>
              </div>
              <div>
                <span className="block text-xs text-[#4A596E]">Disponíveis agora</span>
                <span className="mt-1 block font-mono text-2xl font-semibold tabular-nums text-[#155E42]">
                  {availableTotal}
                </span>
              </div>
              <div>
                <span className="block text-xs text-[#4A596E]">Emprestados</span>
                <span className="mt-1 block font-mono text-2xl font-semibold tabular-nums text-[#8C3B2B]">
                  {activeLoans.length}
                </span>
              </div>
              <div>
                <span className="block text-xs text-[#4A596E]">Prazo gratuito</span>
                <span className="mt-1 block font-mono text-lg sm:text-xl font-semibold tabular-nums text-[#12233B]">
                  14d / 30d
                </span>
              </div>
            </section>

            {/* Search, Collection Tabs & Availability Filters */}
            <section id="catalogo-escolar" className="space-y-5 scroll-mt-20">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-2xl">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A596E]"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por título, autor ou assunto (ex.: Machado, astronomia, vestibular)..."
                    aria-label="Pesquisar livros por título, autor ou assunto"
                    className="w-full rounded-md border border-[#DED4C3] bg-white pl-10 pr-10 py-3 text-sm text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Limpar busca"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A596E] hover:text-[#12233B]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div
                    role="group"
                    aria-label="Filtrar por disponibilidade"
                    className="inline-flex items-center rounded-md bg-[#EAE0CE] p-1"
                  >
                    {(
                      [
                        { id: 'todos', label: 'Todos' },
                        { id: 'disponivel', label: 'Disponível' },
                        { id: 'emprestado', label: 'Emprestado' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAvailabilityFilter(opt.id)}
                        className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          availabilityFilter === opt.id
                            ? 'bg-white text-[#12233B] shadow-xs'
                            : 'text-[#4A596E] hover:text-[#12233B]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSection('usuarios')}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#162B49] bg-white px-3.5 py-2 text-xs font-medium text-[#162B49] hover:bg-[#F3ECE0] transition-colors whitespace-nowrap shrink-0"
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>Gerenciar Usuários / Contas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSection('atendimentos')}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#B68930] bg-[#FFFDF8] px-3.5 py-2 text-xs font-medium text-[#12233B] hover:bg-[#F3ECE0] transition-colors whitespace-nowrap shrink-0"
                      >
                        <Headset className="h-3.5 w-3.5 text-[#8C6820]" />
                        <span>Atendimentos / Suporte</span>
                        {waitingTicketsCount > 0 && (
                          <span className="rounded bg-[#B68930] px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-none tabular-nums text-[#12233B]">
                            {waitingTicketsCount}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingBook(null);
                          setIsAddBookOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#162B49] px-3.5 py-2 text-xs font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors whitespace-nowrap shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Adicionar Novo Livro</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Collection Filter Strip */}
              <div
                aria-label="Filtrar por coleção"
                className="flex items-center gap-2 overflow-x-auto pb-1"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCollection('all')}
                  className={`rounded-md px-3.5 py-2 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    selectedCollection === 'all'
                      ? 'border-[#162B49] bg-[#162B49] text-[#FBF8F1]'
                      : 'border-[#DED4C3] bg-white text-[#4A596E] hover:border-[#B68930] hover:text-[#12233B]'
                  }`}
                >
                  Todos os Acervos
                </button>
                {COLLECTION_META.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedCollection(col.id)}
                    className={`rounded-md px-3.5 py-2 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                      selectedCollection === col.id
                        ? 'border-[#162B49] bg-[#162B49] text-[#FBF8F1]'
                        : 'border-[#DED4C3] bg-white text-[#4A596E] hover:border-[#B68930] hover:text-[#12233B]'
                    }`}
                  >
                    {col.name}
                  </button>
                ))}
              </div>

              {/* Results Header */}
              <div className="flex items-center justify-between text-xs text-[#4A596E] pt-1">
                <span>
                  Exibindo <strong className="font-mono tabular-nums text-[#12233B]">{filteredBooks.length}</strong>{' '}
                  {filteredBooks.length === 1 ? 'livro' : 'livros'}
                </span>
                {(searchQuery || selectedCollection !== 'all' || availabilityFilter !== 'todos') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCollection('all');
                      setAvailabilityFilter('todos');
                    }}
                    className="font-medium text-[#162B49] underline underline-offset-4 hover:text-[#8C6820]"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              {/* Books Grid */}
              {filteredBooks.length === 0 ? (
                <div className="rounded-lg border border-[#DED4C3] bg-white p-12 text-center">
                  <h3 className="font-serif text-2xl font-semibold text-[#12233B]">
                    Nenhum livro encontrado com esses critérios
                  </h3>
                  <p className="mt-2 text-sm text-[#4A596E]">
                    Tente buscar por outro autor ou limpe os filtros para ver todo o acervo.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCollection('all');
                      setAvailabilityFilter('todos');
                    }}
                    className="mt-5 rounded-md bg-[#162B49] px-5 py-2.5 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors"
                  >
                    Mostrar todo o acervo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredBooks.map((book) => {
                    const activeLoan = activeLoanByBookId.get(book.id) ?? null;
                    const isAvailable = !activeLoan;
                    const isMine = Boolean(
                      activeLoan && currentUser && activeLoan.userId === currentUser.id,
                    );
                    const colShort =
                      COLLECTION_META.find((c) => c.id === book.collection)?.shortName ?? 'Acervo';

                    return (
                      <article
                        key={book.id}
                        className="group flex flex-col justify-between rounded-lg border border-[#DED4C3] bg-white p-4 transition-colors hover:border-[#B68930]"
                      >
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedBookId(book.id)}
                            className="block w-full text-left focus-visible:outline-2 focus-visible:outline-[#162B49] rounded"
                          >
                            <BookCover
                              book={book}
                              size="md"
                              className="transition-transform duration-200 group-hover:-translate-y-0.5"
                            />
                          </button>

                          <div className="mt-3.5 flex items-center gap-2 text-xs text-[#4A596E]">
                            <span className="truncate">{colShort}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{book.year}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedBookId(book.id)}
                            className="mt-1 block text-left w-full"
                          >
                            <h3 className="font-serif text-lg font-semibold leading-snug text-[#12233B] group-hover:text-[#8C6820] transition-colors line-clamp-2">
                              {book.title}
                            </h3>
                          </button>
                          <p className="mt-0.5 text-sm text-[#4A596E] truncate">{book.author}</p>

                          <p className="mt-2 font-mono text-[11px] text-[#4A596E] truncate">
                            {book.location}
                          </p>
                        </div>

                        <div className="mt-4 border-t border-[#DED4C3] pt-3 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            {isAvailable ? (
                              <span className="inline-flex items-center gap-1.5 font-medium text-[#155E42]">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Disponível</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-medium text-[#8C3B2B]">
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                  {isMine
                                    ? `Com você · até ${formatDayMonth(activeLoan!.dueAt)}`
                                    : `Emprestado · até ${formatDayMonth(activeLoan!.dueAt)}`}
                                </span>
                              </span>
                            )}
                          </div>

                          {!isMine && (
                            <p className="flex items-start gap-1.5 text-[11px] leading-snug text-[#4A596E]">
                              <Lock className="h-3.5 w-3.5 text-[#8C6820] shrink-0 mt-0.5" />
                              <span>Alugue este livro gratuitamente para liberar a leitura.</span>
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            {isAvailable ? (
                              <button
                                type="button"
                                onClick={() => handleBorrowBook(book.id)}
                                className="flex-1 rounded-md bg-[#162B49] px-3 py-2 text-xs font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors whitespace-nowrap"
                              >
                                Pegar Emprestado
                              </button>
                            ) : isMine && activeLoan ? (
                              <button
                                type="button"
                                onClick={() => handleOpenReader(book)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#162B49] px-3 py-2 text-xs font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors whitespace-nowrap"
                              >
                                <BookText className="h-3.5 w-3.5 text-[#E4C57D]" />
                                <span>Ler Livro Completo</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedBookId(book.id)}
                                className="flex-1 rounded-md border border-[#DED4C3] bg-[#FBF8F1] px-3 py-2 text-xs font-medium text-[#4A596E] hover:text-[#12233B] transition-colors whitespace-nowrap"
                              >
                                Ver Ficha
                              </button>
                            )}

                            {isMine && activeLoan ? (
                              <button
                                type="button"
                                onClick={() => handleReturnLoan(activeLoan.id)}
                                className="rounded-md border border-[#DED4C3] px-3 py-2 text-xs font-medium text-[#8C3B2B] hover:border-[#8C3B2B] transition-colors whitespace-nowrap shrink-0"
                              >
                                Devolver
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedBookId(book.id)}
                                className="rounded-md border border-[#DED4C3] px-3 py-2 text-xs font-medium text-[#12233B] hover:border-[#B68930] transition-colors whitespace-nowrap shrink-0"
                              >
                                Detalhes
                              </button>
                            )}
                          </div>

                          {isAdmin && (
                            <div className="flex items-center justify-between gap-2 border-t border-[#DED4C3]/70 pt-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBook(book);
                                  setIsAddBookOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-medium text-[#162B49] hover:text-[#8C6820] transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setBookPendingDelete(book)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-[#8C3B2B] hover:underline transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Excluir / Retirar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {section === 'colecoes' && (
          <CollectionsView
            books={books}
            activeLoans={activeLoans}
            onSelectCollection={(colId) => {
              setSelectedCollection(colId);
              setAvailabilityFilter('todos');
              setSection('acervo');
            }}
          />
        )}

        {section === 'alugados' && (
          <MyLoansView
            currentUser={currentUser}
            books={books}
            loans={loans}
            onOpenAuth={() => openAuthModal('login')}
            onSelectBook={(book) => setSelectedBookId(book.id)}
            onReadBook={handleOpenReader}
            onReturn={handleReturnLoan}
            onRenew={handleRenewLoan}
            onGoToCatalog={() => setSection('acervo')}
          />
        )}

        {section === 'carteirinha' && (
          <DigitalCardView
            currentUser={currentUser}
            activeLoansCount={myActiveLoansCount}
            returnedLoansCount={myReturnedLoansCount}
            onOpenAuth={() => openAuthModal('login')}
            onLogout={() => handleLogout()}
          />
        )}

        {section === 'atendimentos' && isAdmin && (
          <AdminSupportView
            tickets={supportTickets}
            onReplyTicket={handleAdminReplyTicket}
            onConcludeTicket={handleAdminConcludeTicket}
            onReopenTicket={handleAdminReopenTicket}
          />
        )}

        {section === 'usuarios' && isAdmin && (
          <AdminUsersView
            users={users}
            books={books}
            loans={loans}
            onForceReturnLoan={handleForceReturnLoan}
            onBanUser={handleBanUser}
            onReactivateUser={handleReactivateUser}
          />
        )}
      </main>

      <footer className="border-t border-[#DED4C3] bg-[#F3ECE0]/60 py-6 mt-12">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 text-xs text-[#4A596E]">
          <p>
            <strong className="font-serif font-semibold text-[#12233B]">BiblioTec</strong>{' '}
            · Biblioteca Escolar Remy Soares · Empréstimo gratuito para alunos e professores
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Prazo padrão: 14 dias (Aluno) · 30 dias (Professor)</span>
            {!isAdmin && (
              <button
                type="button"
                onClick={() => openAuthModal('admin')}
                className="inline-flex items-center gap-1 font-medium text-[#162B49] hover:text-[#8C6820] underline underline-offset-4"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-[#8C6820]" />
                <span>Área do Administrador</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation (<= 60px, <15% viewport height) */}
      <nav
        aria-label="Navegação móvel"
        className={`md:hidden fixed bottom-0 inset-x-0 z-30 grid ${
          isAdmin ? 'grid-cols-5' : 'grid-cols-4'
        } border-t border-[#DED4C3] bg-[#FBF8F1]/98 backdrop-blur-sm h-[58px]`}
      >
        {(
          isAdmin
            ? ([
                { id: 'acervo', label: 'Acervo', Icon: Library },
                { id: 'colecoes', label: 'Coleções', Icon: Layers },
                { id: 'carteirinha', label: 'Conta', Icon: CreditCard },
              ] as const)
            : ([
                { id: 'acervo', label: 'Acervo', Icon: Library },
                { id: 'colecoes', label: 'Coleções', Icon: Layers },
                {
                  id: 'alugados',
                  label: myActiveLoansCount > 0 ? `Alugados (${myActiveLoansCount})` : 'Alugados',
                  Icon: BookOpen,
                },
                { id: 'carteirinha', label: 'Carteirinha', Icon: CreditCard },
              ] as const)
        ).map(({ id, label, Icon }) => {
          const active = section === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                active ? 'text-[#162B49]' : 'text-[#4A596E]'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-[#B68930]' : ''}`} />
              <span className="truncate max-w-full px-1">{label}</span>
            </button>
          );
        })}

        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => setSection('atendimentos')}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                section === 'atendimentos' ? 'text-[#162B49]' : 'text-[#4A596E]'
              }`}
            >
              <Headset className={`h-4 w-4 ${section === 'atendimentos' ? 'text-[#B68930]' : ''}`} />
              <span className="truncate max-w-full px-1">
                {waitingTicketsCount > 0 ? `Suporte (${waitingTicketsCount})` : 'Suporte'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSection('usuarios')}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                section === 'usuarios' ? 'text-[#162B49]' : 'text-[#4A596E]'
              }`}
            >
              <Users className={`h-4 w-4 ${section === 'usuarios' ? 'text-[#B68930]' : ''}`} />
              <span className="truncate max-w-full px-1">Usuários</span>
            </button>
          </>
        )}
      </nav>

      {/* Floating Support Button for Logged-in Students & Professors */}
      {currentUser && currentUser.role !== 'admin' && !readingBookId && (
        <button
          type="button"
          onClick={handleOpenSupport}
          className="fixed bottom-[70px] md:bottom-6 right-4 sm:right-6 z-30 inline-flex items-center gap-2 rounded-lg border border-[#D7B46A]/65 bg-[#162B49] px-4 py-2.5 text-xs sm:text-sm font-medium text-[#FBF8F1] shadow-lg hover:bg-[#0E1D33] transition-colors whitespace-nowrap"
        >
          <MessageSquare className="h-4 w-4 text-[#E4C57D]" />
          <span>Suporte / Ajuda</span>
          {unreadAdminRepliesCount > 0 && (
            <span className="rounded bg-[#D7B46A] px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-none tabular-nums text-[#12233B]">
              {unreadAdminRepliesCount}
            </span>
          )}
        </button>
      )}

      {/* Feedback Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[122px] md:bottom-6 left-4 right-4 sm:right-auto sm:left-6 sm:max-w-md z-40 flex items-center justify-between gap-4 rounded-lg border border-[#D7B46A]/50 bg-[#162B49] px-4 py-3 text-sm text-[#FBF8F1] shadow-xl"
        >
          <p className="leading-snug">{toast.text}</p>
          <div className="flex items-center gap-2 shrink-0">
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  setToast(null);
                }}
                className="text-xs font-semibold text-[#E4C57D] underline underline-offset-4 whitespace-nowrap"
              >
                {toast.actionLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Fechar aviso"
              className="text-[#B8C4D4] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AuthModal
        key={authInitialTab + String(isAuthOpen)}
        isOpen={isAuthOpen}
        initialTab={authInitialTab}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingBorrowBookId(null);
        }}
        onLoginReader={handleLoginReader}
        onCreateUser={handleCreateUser}
        onVerifyAdminPassword={handleVerifyAdminPassword}
        onVerifyAdminPin={handleVerifyAdminPin}
      />

      <BookDetailModal
        book={selectedBook}
        activeLoan={selectedBook ? activeLoanByBookId.get(selectedBook.id) ?? null : null}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onClose={() => setSelectedBookId(null)}
        onBorrow={handleBorrowBook}
        onReturn={handleReturnLoan}
        onRenew={handleRenewLoan}
        onReadBook={handleOpenReader}
        onEditBook={(book) => {
          setSelectedBookId(null);
          setEditingBook(book);
          setIsAddBookOpen(true);
        }}
        onRequestDeleteBook={(book) => {
          setSelectedBookId(null);
          setBookPendingDelete(book);
        }}
        onRequireAuth={() => {
          if (selectedBook) {
            setPendingBorrowBookId(selectedBook.id);
          }
          openAuthModal('login');
        }}
      />

      {isAdmin && (
        <AddBookModal
          isOpen={isAddBookOpen}
          bookToEdit={editingBook}
          onClose={() => {
            setIsAddBookOpen(false);
            setEditingBook(null);
          }}
          onAddBook={handleAddBook}
          onUpdateBook={handleUpdateBook}
          currentUserName={currentUser?.name}
        />
      )}

      {isAdmin && (
        <ConfirmDeleteModal
          book={bookPendingDelete}
          hasActiveLoan={Boolean(
            bookPendingDelete && activeLoanByBookId.has(bookPendingDelete.id),
          )}
          onCancel={() => setBookPendingDelete(null)}
          onConfirm={handleConfirmDeleteBook}
        />
      )}

      <BookReaderModal
        book={readingBook}
        isAllowedToRead={canReadSelectedBook}
        onClose={() => setReadingBookId(null)}
      />

      {currentUser && currentUser.role !== 'admin' && (
        <SupportChatModal
          key={currentUser.id}
          isOpen={isSupportOpen}
          onClose={() => setIsSupportOpen(false)}
          currentUser={currentUser}
          books={books}
          borrowedBookIds={borrowedBookIds}
          activeLoansCount={myActiveLoansCount}
          userTickets={mySupportTickets}
          onSubmitAdminTicket={handleSubmitAdminTicket}
        />
      )}
    </div>
  );
}
