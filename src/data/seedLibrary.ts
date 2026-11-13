import type { Book, LoanRecord, SupportTicket, UserProfile } from '../types/library';
import { DEFAULT_COVER_BY_COLLECTION } from './coverAssets';
import { SEED_BOOK_CHAPTERS } from './bookChapters';

export const ADMIN_MASTER_PASSWORD = 'Remy@Biblio2026#Admin!';
export const ADMIN_SECRET_PIN = '849271';

export const SEED_ADMIN_USER: UserProfile = {
  id: 'user-admin-demo',
  name: 'Direção & Coordenação (Dono)',
  role: 'admin',
  departmentOrClass: 'Administração da Biblioteca · Escola Remy Soares',
  registrationCode: '2026-ADM-0001',
  email: 'biblioteca@remysoares.edu.br',
  createdAt: '2026-01-15T08:00:00.000Z',
};

export const SEED_USERS: UserProfile[] = [
  {
    id: 'user-aluno-demo',
    name: 'Clara Mendes Ribeiro',
    role: 'aluno',
    departmentOrClass: '2º Ano B · Ensino Médio',
    registrationCode: '2026-AL-0184',
    email: 'clara.ribeiro@escola.edu.br',
    pinCode: '2026',
    securityQuestion: 'Qual sua matéria favorita na escola?',
    securityAnswer: 'literatura',
    createdAt: '2026-02-10T10:00:00.000Z',
  },
  {
    id: 'user-prof-demo',
    name: 'Prof. Henrique Vasconcelos',
    role: 'professor',
    departmentOrClass: 'Literatura & Língua Portuguesa',
    registrationCode: '2026-PR-0042',
    email: 'henrique.vasconcelos@escola.edu.br',
    pinCode: '4230',
    securityQuestion: 'Qual o nome do seu primeiro animal de estimação?',
    securityAnswer: 'bento',
    createdAt: '2026-02-05T08:30:00.000Z',
  },
  SEED_ADMIN_USER,
];

const RAW_SEED_BOOKS: Book[] = [
  {
    id: 'book-01',
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    collection: 'literatura-brasileira',
    year: 1899,
    pages: 256,
    publisher: 'Edições Ateliê Escolar',
    location: 'Corredor A · Estante 01 · Prateleira 2',
    subjects: ['Realismo', 'Clássico Nacional', 'Memória', 'Vestibular'],
    synopsis:
      'Bento Santiago narra em primeira pessoa as lembranças de sua juventude e o amor por Capitu, construindo um dos romances mais instigantes da língua portuguesa sobre ciúme, dúvida e perspectiva narrativa.',
    coverUrl: DEFAULT_COVER_BY_COLLECTION['literatura-brasileira'],
    coverTone: 'navy',
    addedAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'book-02',
    title: 'A Hora da Estrela',
    author: 'Clarice Lispector',
    collection: 'literatura-brasileira',
    year: 1977,
    pages: 96,
    publisher: 'Rocco Escolar',
    location: 'Corredor A · Estante 02 · Prateleira 1',
    subjects: ['Modernismo', 'Prosa Poética', 'Literatura Contemporânea'],
    synopsis:
      'Por meio do narrador Rodrigo S.M., acompanhamos a trajetória silenciosa de Macabéa, datilógrafa nordestina no Rio de Janeiro, em uma reflexão comovente sobre invisibilidade social, linguagem e existência.',
    coverTone: 'ochre',
    addedAt: '2026-02-02T09:00:00.000Z',
  },
  {
    id: 'book-03',
    title: 'O Feiticeiro de Terramar',
    author: 'Ursula K. Le Guin',
    collection: 'ficcao-fantasia',
    year: 1968,
    pages: 240,
    publisher: 'Arqueiro Jovem',
    location: 'Corredor B · Estante 01 · Prateleira 3',
    subjects: ['Fantasia Clássica', 'Amadurecimento', 'Magia', 'Arquipélago'],
    synopsis:
      'Gavião, um jovem impetuoso com dom para a magia nas ilhas de Terramar, precisa enfrentar as consequências de seu próprio orgulho quando liberta uma sombra antiga que atravessa o oceano.',
    coverUrl: DEFAULT_COVER_BY_COLLECTION['ficcao-fantasia'],
    coverTone: 'navy',
    addedAt: '2026-02-03T09:00:00.000Z',
  },
  {
    id: 'book-04',
    title: 'A Biblioteca Invisível',
    author: 'Genevieve Cogman',
    collection: 'ficcao-fantasia',
    year: 2015,
    pages: 336,
    publisher: 'Morro Branco',
    location: 'Corredor B · Estante 03 · Prateleira 2',
    subjects: ['Aventura Literária', 'Mundos Paralelos', 'Mistério'],
    synopsis:
      'Irene é uma bibliotecária que viaja entre realidades alternativas para resgatar livros raros. Sua nova missão a leva a uma Londres vitoriana onde um volume cobiçado desapareceu antes que forças rivais o encontrem.',
    coverTone: 'burgundy',
    addedAt: '2026-02-04T09:00:00.000Z',
  },
  {
    id: 'book-05',
    title: 'Cosmos',
    author: 'Carl Sagan',
    collection: 'ciencias-tecnologia',
    year: 1980,
    pages: 432,
    publisher: 'Companhia das Letras',
    location: 'Corredor C · Estante 01 · Prateleira 1',
    subjects: ['Astronomia', 'Física', 'História da Ciência', 'Universo'],
    synopsis:
      'Uma jornada clara e inspiradora pela evolução cósmica, pelas grandes descobertas científicas desde a Biblioteca de Alexandria até as sondas espaciais e pelo papel da curiosidade humana no universo.',
    coverUrl: DEFAULT_COVER_BY_COLLECTION['ciencias-tecnologia'],
    coverTone: 'navy',
    addedAt: '2026-02-05T09:00:00.000Z',
  },
  {
    id: 'book-06',
    title: 'Algoritmos para Viver',
    author: 'Brian Christian & Tom Griffiths',
    collection: 'ciencias-tecnologia',
    year: 2016,
    pages: 488,
    publisher: 'Companhia das Letras',
    location: 'Corredor C · Estante 02 · Prateleira 4',
    subjects: ['Computação', 'Lógica', 'Tomada de Decisão', 'Matemática'],
    synopsis:
      'Como princípios da ciência da computação ajudam a organizar o tempo, ordenar informações, equilibrar escolhas e resolver problemas práticos do cotidiano escolar e profissional.',
    coverTone: 'forest',
    addedAt: '2026-02-06T09:00:00.000Z',
  },
  {
    id: 'book-07',
    title: 'Brasil: Uma Biografia',
    author: 'Lilia M. Schwarcz & Heloisa M. Starling',
    collection: 'historia',
    year: 2015,
    pages: 704,
    publisher: 'Companhia das Letras',
    location: 'Corredor D · Estante 01 · Prateleira 2',
    subjects: ['História do Brasil', 'Sociedade', 'Cultura', 'Pesquisa'],
    synopsis:
      'Narrativa abrangente que atravessa mais de cinco séculos da formação brasileira, conectando processos políticos, expressões culturais, resistência popular e transformações cotidianas.',
    coverUrl: DEFAULT_COVER_BY_COLLECTION.historia,
    coverTone: 'slate',
    addedAt: '2026-02-07T09:00:00.000Z',
  },
  {
    id: 'book-08',
    title: 'Sapiens: Uma Breve História da Humanidade',
    author: 'Yuval Noah Harari',
    collection: 'historia',
    year: 2011,
    pages: 464,
    publisher: 'L&PM Editores',
    location: 'Corredor D · Estante 02 · Prateleira 3',
    subjects: ['História Geral', 'Antropologia', 'Revolução Agrícola'],
    synopsis:
      'Panorama acessível sobre como o Homo sapiens desenvolveu a linguagem, organizou grandes sociedades, criou sistemas de escrita e transformou o planeta ao longo de milênios.',
    coverTone: 'ochre',
    addedAt: '2026-02-08T09:00:00.000Z',
  },
  {
    id: 'book-09',
    title: 'Gramática Reflexiva do Português',
    author: 'William Cereja & Thereza Cochar',
    collection: 'material-didatico',
    year: 2023,
    pages: 416,
    publisher: 'Atual Didáticos',
    location: 'Corredor E · Estante 01 · Prateleira 1',
    subjects: ['Língua Portuguesa', 'Redação', 'ENEM', 'Sintaxe'],
    synopsis:
      'Manual de consulta rápida com explicações contextualizadas sobre semântica, coesão textual, pontuação e análise sintática a partir de textos literários e jornalísticos atuais.',
    coverTone: 'navy',
    addedAt: '2026-02-09T09:00:00.000Z',
  },
  {
    id: 'book-10',
    title: 'Fundamentos da Matemática Elementar: Funções',
    author: 'Gelson Iezzi & Carlos Murakami',
    collection: 'material-didatico',
    year: 2021,
    pages: 384,
    publisher: 'Atual Didáticos',
    location: 'Corredor E · Estante 02 · Prateleira 2',
    subjects: ['Matemática', 'Funções', 'Gráficos', 'Vestibular'],
    synopsis:
      'Volume dedicado ao estudo estruturado de conjuntos, relações, funções afins, quadráticas e exponenciais com exercícios resolvidos passo a passo.',
    coverTone: 'forest',
    addedAt: '2026-02-10T09:00:00.000Z',
  },
  {
    id: 'book-11',
    title: 'Cumbe',
    author: 'Marcelo D’Salete',
    collection: 'quadrinhos',
    year: 2014,
    pages: 176,
    publisher: 'Veneta',
    location: 'Corredor F · Estante 01 · Prateleira 1',
    subjects: ['Graphic Novel', 'História Afro-Brasileira', 'Quilombo'],
    synopsis:
      'Coletânea de narrativas gráficas em preto e branco que retrata com vigor artístico a resistência negra, os quilombos e a luta por liberdade no Brasil colonial.',
    coverUrl: DEFAULT_COVER_BY_COLLECTION.quadrinhos,
    coverTone: 'burgundy',
    addedAt: '2026-02-11T09:00:00.000Z',
  },
  {
    id: 'book-12',
    title: 'O Alienista em Quadrinhos',
    author: 'Fábio Moon & Gabriel Bá',
    collection: 'quadrinhos',
    year: 2007,
    pages: 72,
    publisher: 'Agir Quadrinhos',
    location: 'Corredor F · Estante 01 · Prateleira 3',
    subjects: ['HQ Brasileira', 'Adaptação Literária', 'Machado de Assis'],
    synopsis:
      'Adaptação gráfica premiada do conto clássico de Machado de Assis sobre o Dr. Simão Bacamarte e a fundação da Casa Verde na pacata vila de Itaguaí.',
    coverTone: 'slate',
    addedAt: '2026-02-12T09:00:00.000Z',
  },
];

export const SEED_BOOKS: Book[] = RAW_SEED_BOOKS.map((book) => ({
  ...book,
  chapters: book.chapters ?? SEED_BOOK_CHAPTERS[book.id],
}));

export function createSeedLoans(): LoanRecord[] {
  const now = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };
  const daysAhead = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d.toISOString();
  };

  return [
    {
      id: 'loan-seed-1',
      bookId: 'book-03',
      userId: 'user-aluno-demo',
      userName: 'Clara Mendes Ribeiro',
      userRole: 'aluno',
      borrowedAt: daysAgo(4),
      dueAt: daysAhead(10),
      renewCount: 0,
    },
    {
      id: 'loan-seed-2',
      bookId: 'book-07',
      userId: 'user-prof-demo',
      userName: 'Prof. Henrique Vasconcelos',
      userRole: 'professor',
      borrowedAt: daysAgo(9),
      dueAt: daysAhead(21),
      renewCount: 0,
    },
  ];
}

export function createSeedSupportTickets(): SupportTicket[] {
  const now = new Date();
  const hoursAgo = (h: number) => {
    const d = new Date(now);
    d.setHours(d.getHours() - h);
    return d.toISOString();
  };

  return [
    {
      id: 'ticket-seed-1',
      userId: 'user-prof-demo',
      userName: 'Prof. Henrique Vasconcelos',
      userRole: 'professor',
      departmentOrClass: 'Literatura & Língua Portuguesa',
      registrationCode: '2026-PR-0042',
      subject: 'Solicitação de novo título para o 3º Ano',
      status: 'aguardando',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
      hasUnreadAdminReply: false,
      messages: [
        {
          id: 'msg-seed-1',
          sender: 'user',
          senderName: 'Prof. Henrique Vasconcelos',
          text: 'Olá! Gostaria de solicitar a inclusão de "Quarto de Despejo", de Carolina Maria de Jesus, para trabalhar com as turmas do 3º Ano neste bimestre.',
          createdAt: hoursAgo(3),
        },
      ],
    },
  ];
}

