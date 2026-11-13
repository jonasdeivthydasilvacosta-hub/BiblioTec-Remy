export type UserRole = 'aluno' | 'professor' | 'admin';

export type CollectionId =
  | 'literatura-brasileira'
  | 'ficcao-fantasia'
  | 'ciencias-tecnologia'
  | 'historia'
  | 'material-didatico'
  | 'quadrinhos';

export interface CollectionMeta {
  id: CollectionId;
  name: string;
  shortName: string;
  corridor: string;
  description: string;
  accentHex: string;
}

export const COLLECTION_META: CollectionMeta[] = [
  {
    id: 'literatura-brasileira',
    name: 'Literatura Brasileira',
    shortName: 'Lit. Brasileira',
    corridor: 'Corredor A',
    description: 'Clássicos consagrados, crônicas modernas, poesia e autores contemporâneos do Brasil.',
    accentHex: '#162B49',
  },
  {
    id: 'ficcao-fantasia',
    name: 'Ficção & Fantasia',
    shortName: 'Ficção & Fantasia',
    corridor: 'Corredor B',
    description: 'Narrativas de imaginação, mistério, mundos fantásticos e ficção especulativa.',
    accentHex: '#1F3A5F',
  },
  {
    id: 'ciencias-tecnologia',
    name: 'Ciências & Tecnologia',
    shortName: 'Ciências & Tec.',
    corridor: 'Corredor C',
    description: 'Divulgação científica, astronomia, biologia, programação e pensamento lógico.',
    accentHex: '#19454E',
  },
  {
    id: 'historia',
    name: 'História',
    shortName: 'História',
    corridor: 'Corredor D',
    description: 'História do Brasil e do mundo, biografias, movimentos sociais e documentos de época.',
    accentHex: '#4A3623',
  },
  {
    id: 'material-didatico',
    name: 'Material Didático',
    shortName: 'Didáticos',
    corridor: 'Corredor E',
    description: 'Obras de apoio escolar, preparação para vestibulares, gramática, matemática e redação.',
    accentHex: '#283F5E',
  },
  {
    id: 'quadrinhos',
    name: 'Quadrinhos',
    shortName: 'Quadrinhos',
    corridor: 'Corredor F',
    description: 'Histórias em quadrinhos, graphic novels premiadas e adaptações literárias ilustradas.',
    accentHex: '#633A28',
  },
];

export const LOAN_DAYS_BY_ROLE: Record<UserRole, number> = {
  aluno: 14,
  professor: 30,
  admin: 30,
};

export const RENEW_DAYS_BY_ROLE: Record<UserRole, number> = {
  aluno: 7,
  professor: 15,
  admin: 15,
};

export const MAX_RENEWALS = 2;

export const SECURITY_QUESTIONS = [
  'Qual o nome do seu primeiro animal de estimação?',
  'Qual sua matéria favorita na escola?',
  'Em que cidade você nasceu?',
  'Qual foi o primeiro livro que marcou você?',
  'Qual o nome do seu melhor amigo de infância?',
] as const;

export type AccountStatus = 'ativo' | 'banido';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  departmentOrClass: string; // Turma (aluno) ou Disciplina (professor)
  registrationCode: string; // Matrícula
  email?: string;
  pinCode?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  status?: AccountStatus;
  createdAt: string;
}

export interface BookChapter {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  collection: CollectionId;
  year: number;
  pages: number;
  publisher: string;
  location: string; // Ex: Corredor A · Estante 02 · Prateleira 3
  subjects: string[];
  synopsis: string;
  chapters?: BookChapter[];
  coverUrl?: string; // Bundled asset URL or uploaded data URL
  coverTone: 'navy' | 'burgundy' | 'forest' | 'ochre' | 'slate';
  addedAt: string;
  addedBy?: string;
}

export interface LoanRecord {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  borrowedAt: string; // ISO date
  dueAt: string; // ISO date
  returnedAt?: string; // ISO date if returned
  renewCount: number;
}

export type SupportTicketStatus = 'aguardando' | 'respondido' | 'concluido';

export interface SupportTicketMessage {
  id: string;
  sender: 'user' | 'admin' | 'system';
  senderName: string;
  text: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userRole: 'aluno' | 'professor';
  departmentOrClass: string;
  registrationCode: string;
  subject: string;
  status: SupportTicketStatus;
  messages: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
  hasUnreadAdminReply: boolean;
}

export type AppSection =
  | 'acervo'
  | 'colecoes'
  | 'alugados'
  | 'carteirinha'
  | 'atendimentos'
  | 'usuarios';
export type AvailabilityFilter = 'todos' | 'disponivel' | 'emprestado';

