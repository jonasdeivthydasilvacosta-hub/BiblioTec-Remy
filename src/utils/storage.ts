import {
  COLLECTION_META,
  LOAN_DAYS_BY_ROLE,
  RENEW_DAYS_BY_ROLE,
  type Book,
  type BookChapter,
  type CollectionId,
  type LoanRecord,
  type SupportTicket,
  type SupportTicketMessage,
  type SupportTicketStatus,
  type UserProfile,
  type UserRole,
} from '../types/library';
import {
  createSeedLoans,
  createSeedSupportTickets,
  SEED_ADMIN_USER,
  SEED_BOOKS,
  SEED_USERS,
} from '../data/seedLibrary';

export const STORAGE_KEY_PREFIX = 'minerva_';

const STORAGE_KEYS = {
  users: 'minerva_users_v1',
  currentUserId: 'minerva_current_user_id_v1',
  books: 'minerva_books_v1',
  loans: 'minerva_loans_v1',
  supportTickets: 'minerva_support_tickets_v1',
  adminPinLockout: 'minerva_admin_pin_lockout_v1',
} as const;

const VALID_COLLECTIONS = new Set<CollectionId>(COLLECTION_META.map((c) => c.id));
const VALID_COVER_TONES = new Set<Book['coverTone']>([
  'navy',
  'burgundy',
  'forest',
  'ochre',
  'slate',
]);
const VALID_ROLES = new Set<UserRole>(['aluno', 'professor', 'admin']);
const VALID_TICKET_STATUS = new Set<SupportTicketStatus>([
  'aguardando',
  'respondido',
  'concluido',
]);

export interface LibraryStateSnapshot {
  users: UserProfile[];
  currentUserId: string | null;
  books: Book[];
  loans: LoanRecord[];
  supportTickets: SupportTicket[];
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeReadStorageJson<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return fallback;
    }
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw.trim() === '') {
      return fallback;
    }
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || parsed === undefined) {
      return fallback;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

function toSafeIsoDate(value: unknown, fallbackIso?: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return fallbackIso ?? new Date().toISOString();
}

function sanitizeUsers(raw: unknown): UserProfile[] {
  const sourceList = Array.isArray(raw) ? raw : SEED_USERS;
  const seedUserById = new Map(SEED_USERS.map((u) => [u.id, u]));
  const hydrated: UserProfile[] = [];

  for (const item of sourceList) {
    if (!isPlainRecord(item)) continue;
    const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : '';
    const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : '';
    if (!id || !name) continue;

    const rawRole = item.role;
    const role: UserRole =
      typeof rawRole === 'string' && VALID_ROLES.has(rawRole as UserRole)
        ? (rawRole as UserRole)
        : 'aluno';

    const seeded = seedUserById.get(id);
    const status = item.status === 'banido' ? 'banido' : 'ativo';
    const baseUser: UserProfile = {
      id,
      name,
      role,
      departmentOrClass:
        typeof item.departmentOrClass === 'string' && item.departmentOrClass.trim()
          ? item.departmentOrClass.trim()
          : seeded?.departmentOrClass ?? 'Turma Escolar',
      registrationCode:
        typeof item.registrationCode === 'string' && item.registrationCode.trim()
          ? item.registrationCode.trim()
          : seeded?.registrationCode ?? generateRegistrationCode(role),
      email: typeof item.email === 'string' && item.email.trim() ? item.email.trim() : undefined,
      status,
      createdAt: toSafeIsoDate(item.createdAt),
    };

    if (role === 'admin') {
      hydrated.push(baseUser);
      continue;
    }

    hydrated.push({
      ...baseUser,
      pinCode:
        typeof item.pinCode === 'string' && item.pinCode.trim()
          ? item.pinCode.trim()
          : seeded?.pinCode ?? '2026',
      securityQuestion:
        typeof item.securityQuestion === 'string' && item.securityQuestion.trim()
          ? item.securityQuestion.trim()
          : seeded?.securityQuestion ?? 'Qual sua matéria favorita na escola?',
      securityAnswer:
        typeof item.securityAnswer === 'string' && item.securityAnswer.trim()
          ? item.securityAnswer.trim()
          : seeded?.securityAnswer ?? 'leitura',
    });
  }

  const fallbackUsers = hydrated.length > 0 ? hydrated : SEED_USERS.map((u) => ({ ...u }));
  const hasAdmin = fallbackUsers.some((u) => u.id === SEED_ADMIN_USER.id || u.role === 'admin');
  return (hasAdmin ? fallbackUsers : [...fallbackUsers, SEED_ADMIN_USER]).map((u) => ({
    ...u,
    status: u.status === 'banido' ? 'banido' : 'ativo',
  }));
}

function sanitizeChapters(rawChapters: unknown, fallbackChapters?: BookChapter[]): BookChapter[] | undefined {
  if (!Array.isArray(rawChapters) || rawChapters.length === 0) {
    return fallbackChapters;
  }
  const clean: BookChapter[] = [];
  for (let i = 0; i < rawChapters.length; i += 1) {
    const ch = rawChapters[i];
    if (!isPlainRecord(ch)) continue;
    const paragraphs = Array.isArray(ch.paragraphs)
      ? ch.paragraphs.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
      : [];
    if (paragraphs.length === 0) continue;
    clean.push({
      id: typeof ch.id === 'string' && ch.id.trim() ? ch.id : `cap-${i + 1}`,
      title: typeof ch.title === 'string' && ch.title.trim() ? ch.title.trim() : `Capítulo ${i + 1}`,
      paragraphs,
    });
  }
  return clean.length > 0 ? clean : fallbackChapters;
}

function sanitizeBooks(raw: unknown): Book[] {
  const sourceList = Array.isArray(raw) ? raw : SEED_BOOKS;
  const seedById = new Map(SEED_BOOKS.map((b) => [b.id, b]));
  const sanitized: Book[] = [];

  for (const item of sourceList) {
    if (!isPlainRecord(item)) continue;
    const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : '';
    const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : '';
    if (!id || !title) continue;

    const seeded = seedById.get(id);
    const collection: CollectionId =
      typeof item.collection === 'string' && VALID_COLLECTIONS.has(item.collection as CollectionId)
        ? (item.collection as CollectionId)
        : seeded?.collection ?? 'literatura-brasileira';

    const coverTone: Book['coverTone'] =
      typeof item.coverTone === 'string' && VALID_COVER_TONES.has(item.coverTone as Book['coverTone'])
        ? (item.coverTone as Book['coverTone'])
        : seeded?.coverTone ?? 'navy';

    const subjects = Array.isArray(item.subjects)
      ? item.subjects.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : seeded?.subjects ?? [];

    const year =
      typeof item.year === 'number' && Number.isFinite(item.year)
        ? item.year
        : seeded?.year ?? new Date().getFullYear();

    const pages =
      typeof item.pages === 'number' && Number.isFinite(item.pages) && item.pages > 0
        ? item.pages
        : seeded?.pages ?? 180;

    sanitized.push({
      id,
      title,
      author:
        typeof item.author === 'string' && item.author.trim()
          ? item.author.trim()
          : seeded?.author ?? 'Autor Escolar',
      collection,
      year,
      pages,
      publisher:
        typeof item.publisher === 'string' && item.publisher.trim()
          ? item.publisher.trim()
          : seeded?.publisher ?? 'Acervo Escolar',
      location:
        typeof item.location === 'string' && item.location.trim()
          ? item.location.trim()
          : seeded?.location ?? 'Corredor A · Estante 01 · Prateleira 1',
      subjects,
      synopsis:
        typeof item.synopsis === 'string' && item.synopsis.trim()
          ? item.synopsis.trim()
          : seeded?.synopsis ?? 'Obra disponível para leitura na BiblioTec — Escola Remy Soares.',
      chapters: sanitizeChapters(item.chapters, seeded?.chapters),
      coverUrl:
        typeof item.coverUrl === 'string' && item.coverUrl.trim() ? item.coverUrl : undefined,
      coverTone,
      addedAt: toSafeIsoDate(item.addedAt, seeded?.addedAt),
      addedBy: typeof item.addedBy === 'string' ? item.addedBy : undefined,
    });
  }

  return sanitized.length > 0 ? sanitized : Array.isArray(raw) ? [] : SEED_BOOKS;
}

function sanitizeLoans(raw: unknown): LoanRecord[] {
  const sourceList = Array.isArray(raw) ? raw : createSeedLoans();
  const sanitized: LoanRecord[] = [];

  for (const item of sourceList) {
    if (!isPlainRecord(item)) continue;
    const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : '';
    const bookId = typeof item.bookId === 'string' && item.bookId.trim() ? item.bookId.trim() : '';
    const userId = typeof item.userId === 'string' && item.userId.trim() ? item.userId.trim() : '';
    if (!id || !bookId || !userId) continue;

    const userRole: UserRole =
      typeof item.userRole === 'string' && VALID_ROLES.has(item.userRole as UserRole)
        ? (item.userRole as UserRole)
        : 'aluno';

    const borrowedAt = toSafeIsoDate(item.borrowedAt);
    const dueAt = toSafeIsoDate(item.dueAt, calculateInitialDueDate(userRole, borrowedAt));
    const returnedAt =
      typeof item.returnedAt === 'string' && item.returnedAt.trim()
        ? toSafeIsoDate(item.returnedAt)
        : undefined;

    sanitized.push({
      id,
      bookId,
      userId,
      userName:
        typeof item.userName === 'string' && item.userName.trim()
          ? item.userName.trim()
          : 'Leitor Escolar',
      userRole,
      borrowedAt,
      dueAt,
      returnedAt,
      renewCount:
        typeof item.renewCount === 'number' &&
        Number.isFinite(item.renewCount) &&
        item.renewCount >= 0
          ? item.renewCount
          : 0,
    });
  }

  return sanitized;
}

function sanitizeSupportTickets(raw: unknown): SupportTicket[] {
  const sourceList = Array.isArray(raw) ? raw : createSeedSupportTickets();
  const sanitized: SupportTicket[] = [];

  for (const item of sourceList) {
    if (!isPlainRecord(item)) continue;
    const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : '';
    const userId = typeof item.userId === 'string' && item.userId.trim() ? item.userId.trim() : '';
    if (!id || !userId) continue;

    const status: SupportTicketStatus =
      typeof item.status === 'string' && VALID_TICKET_STATUS.has(item.status as SupportTicketStatus)
        ? (item.status as SupportTicketStatus)
        : 'aguardando';

    const rawMessages = Array.isArray(item.messages) ? item.messages : [];
    const messages: SupportTicketMessage[] = [];
    for (let i = 0; i < rawMessages.length; i += 1) {
      const m = rawMessages[i];
      if (!isPlainRecord(m)) continue;
      if (typeof m.text !== 'string' || !m.text.trim()) continue;
      const sender =
        m.sender === 'admin' || m.sender === 'system' || m.sender === 'user'
          ? m.sender
          : 'user';
      messages.push({
        id: typeof m.id === 'string' && m.id.trim() ? m.id : `msg-${i}-${Date.now()}`,
        sender,
        senderName:
          typeof m.senderName === 'string' && m.senderName.trim()
            ? m.senderName.trim()
            : sender === 'admin'
              ? 'Administrador · Escola Remy Soares'
              : 'Leitor(a)',
        text: m.text,
        createdAt: toSafeIsoDate(m.createdAt),
      });
    }

    sanitized.push({
      id,
      userId,
      userName:
        typeof item.userName === 'string' && item.userName.trim()
          ? item.userName.trim()
          : 'Leitor Escolar',
      userRole: item.userRole === 'professor' ? 'professor' : 'aluno',
      departmentOrClass:
        typeof item.departmentOrClass === 'string' && item.departmentOrClass.trim()
          ? item.departmentOrClass.trim()
          : 'Turma Escolar',
      registrationCode:
        typeof item.registrationCode === 'string' && item.registrationCode.trim()
          ? item.registrationCode.trim()
          : '—',
      subject:
        typeof item.subject === 'string' && item.subject.trim()
          ? item.subject.trim()
          : 'Atendimento BiblioTec',
      status,
      messages,
      createdAt: toSafeIsoDate(item.createdAt),
      updatedAt: toSafeIsoDate(item.updatedAt),
      hasUnreadAdminReply: Boolean(item.hasUnreadAdminReply),
    });
  }

  return sanitized;
}

export function loadLibraryState(): LibraryStateSnapshot {
  const rawUsers = safeReadStorageJson<unknown>(STORAGE_KEYS.users, null);
  const rawCurrentUserId = safeReadStorageJson<unknown>(STORAGE_KEYS.currentUserId, null);
  const rawBooks = safeReadStorageJson<unknown>(STORAGE_KEYS.books, null);
  const rawLoans = safeReadStorageJson<unknown>(STORAGE_KEYS.loans, null);
  const rawTickets = safeReadStorageJson<unknown>(STORAGE_KEYS.supportTickets, null);

  const users = sanitizeUsers(rawUsers);
  const books = sanitizeBooks(rawBooks);
  const loans = sanitizeLoans(rawLoans);
  const supportTickets = sanitizeSupportTickets(rawTickets);

  const parsedCurrentUserId =
    typeof rawCurrentUserId === 'string' && rawCurrentUserId.trim() ? rawCurrentUserId : null;
  const matchedCurrentUser = parsedCurrentUserId
    ? users.find((u) => u.id === parsedCurrentUserId)
    : null;
  const currentUserId: string | null =
    matchedCurrentUser && matchedCurrentUser.status !== 'banido' ? matchedCurrentUser.id : null;

  return { users, currentUserId, books, loans, supportTickets };
}

export function parseBookContentToChapters(rawText: string, fallbackTitle: string): BookChapter[] {
  const safeText = typeof rawText === 'string' ? rawText : '';
  const safeTitle = typeof fallbackTitle === 'string' && fallbackTitle.trim() ? fallbackTitle : 'Obra Escolar';
  const normalized = safeText.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [
      {
        id: 'cap-1',
        title: 'Capítulo 1 · Nota de Leitura',
        paragraphs: [
          `Esta edição de "${safeTitle}" foi cadastrada no acervo digital da BiblioTec — Escola Remy Soares.`,
          'Nenhum texto integral adicional foi anexado durante o cadastro deste exemplar.',
        ],
      },
    ];
  }

  const lines = normalized.split('\n');
  const headingRegex = /^(?:#{1,3}\s+|cap[ií]tulo\s+\d+[\s.:—-]*|parte\s+\d+[\s.:—-]*)/i;
  const hasExplicitHeadings = lines.some((line) => headingRegex.test(line.trim()));

  if (hasExplicitHeadings) {
    const chapters: BookChapter[] = [];
    let currentTitle = 'Introdução';
    let buffer: string[] = [];

    const flushChapter = () => {
      const paragraphs = buffer
        .join('\n')
        .split(/\n\s*\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (paragraphs.length > 0) {
        chapters.push({
          id: `cap-${chapters.length + 1}`,
          title: currentTitle,
          paragraphs,
        });
      }
      buffer = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (headingRegex.test(trimmed)) {
        flushChapter();
        currentTitle = trimmed.replace(/^#{1,3}\s+/, '').trim() || `Capítulo ${chapters.length + 1}`;
      } else {
        buffer.push(line);
      }
    }
    flushChapter();

    if (chapters.length > 0) {
      return chapters;
    }
  }

  const allParagraphs = normalized
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (allParagraphs.length <= 4) {
    return [
      {
        id: 'cap-1',
        title: 'Texto Integral',
        paragraphs: allParagraphs,
      },
    ];
  }

  const chunkSize = 4;
  const chapters: BookChapter[] = [];
  for (let i = 0; i < allParagraphs.length; i += chunkSize) {
    chapters.push({
      id: `cap-${chapters.length + 1}`,
      title: `Parte ${chapters.length + 1}`,
      paragraphs: allParagraphs.slice(i, i + chunkSize),
    });
  }
  return chapters;
}

export function saveLibraryState(snapshot: LibraryStateSnapshot): void {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(snapshot.users ?? []));
    window.localStorage.setItem(
      STORAGE_KEYS.currentUserId,
      JSON.stringify(snapshot.currentUserId ?? null),
    );
    window.localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(snapshot.books ?? []));
    window.localStorage.setItem(STORAGE_KEYS.loans, JSON.stringify(snapshot.loans ?? []));
    window.localStorage.setItem(
      STORAGE_KEYS.supportTickets,
      JSON.stringify(snapshot.supportTickets ?? []),
    );
  } catch {
    // Ignorar falha de cota do armazenamento local sem interromper a sessão
  }
}

export function addDaysIso(baseIso: string, days: number): string {
  const parsed = new Date(baseIso);
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  date.setDate(date.getDate() + (Number.isFinite(days) ? days : 0));
  return date.toISOString();
}

export function calculateInitialDueDate(role: UserRole, fromIso = new Date().toISOString()): string {
  const days = LOAN_DAYS_BY_ROLE[role] ?? 14;
  return addDaysIso(fromIso, days);
}

export function calculateRenewedDueDate(role: UserRole, currentDueIso: string): string {
  const now = new Date();
  const currentDue = new Date(currentDueIso);
  const isCurrentValid = !Number.isNaN(currentDue.getTime());
  const anchor = isCurrentValid && currentDue.getTime() > now.getTime() ? currentDueIso : now.toISOString();
  const renewDays = RENEW_DAYS_BY_ROLE[role] ?? 7;
  return addDaysIso(anchor, renewDays);
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDayMonth(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
    .format(date)
    .replace('.', '');
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getDaysRemaining(dueIso: string): number {
  const due = new Date(dueIso);
  if (Number.isNaN(due.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function serializeChaptersToText(chapters?: BookChapter[]): string {
  if (!Array.isArray(chapters) || chapters.length === 0) return '';
  return chapters
    .map((ch) => {
      const safeTitle = (ch?.title ?? 'Capítulo').trim();
      const safeParagraphs = Array.isArray(ch?.paragraphs) ? ch.paragraphs : [];
      const hasPrefix = /^(?:cap[ií]tulo|parte|#)/i.test(safeTitle);
      const heading = hasPrefix ? safeTitle : `Capítulo ${safeTitle}`;
      return `${heading}\n\n${safeParagraphs.join('\n\n')}`;
    })
    .join('\n\n');
}

export function generateRegistrationCode(role: UserRole): string {
  const prefix = role === 'admin' ? 'ADM' : role === 'professor' ? 'PR' : 'AL';
  const rand = Math.floor(1000 + Math.random() * 8999);
  return `2026-${prefix}-${rand}`;
}

export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem inválido.'));
      img.onload = () => {
        const maxW = 480;
        const maxH = 640;
        let { width, height } = img;
        if (!width || !height || width <= 0 || height <= 0) {
          resolve(String(reader.result ?? ''));
          return;
        }
        const scale = Math.min(1, maxW / width, maxH / height);
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result ?? ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result ?? '');
    };
    reader.readAsDataURL(file);
  });
}

export interface AdminPinLockoutState {
  attempts: number;
  lockUntil: number;
}

export function loadAdminPinLockout(): AdminPinLockoutState {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return { attempts: 0, lockUntil: 0 };
    }
    const raw = window.localStorage.getItem(STORAGE_KEYS.adminPinLockout);
    if (!raw) return { attempts: 0, lockUntil: 0 };
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainRecord(parsed)) return { attempts: 0, lockUntil: 0 };
    return {
      attempts:
        typeof parsed.attempts === 'number' && Number.isFinite(parsed.attempts)
          ? parsed.attempts
          : 0,
      lockUntil:
        typeof parsed.lockUntil === 'number' && Number.isFinite(parsed.lockUntil)
          ? parsed.lockUntil
          : 0,
    };
  } catch {
    return { attempts: 0, lockUntil: 0 };
  }
}

export function saveAdminPinLockout(state: AdminPinLockoutState): void {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.adminPinLockout, JSON.stringify(state));
  } catch {
    // Ignorar falha de armazenamento local
  }
}

export function clearAdminPinLockout(): void {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return;
    }
    window.localStorage.removeItem(STORAGE_KEYS.adminPinLockout);
  } catch {
    // Ignorar falha de armazenamento local
  }
}

export function normalizeSecurityAnswer(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}
