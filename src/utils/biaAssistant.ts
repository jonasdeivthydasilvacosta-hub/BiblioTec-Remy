import { COLLECTION_META, type Book, type UserProfile } from '../types/library';

export interface BiaConversationTurn {
  role: 'user' | 'assistant';
  text: string;
}

export const QUICK_SUPPORT_QUESTIONS = [
  'Como alugar um livro?',
  'Não consigo ler o livro',
  'Prazo de devolução',
  'Sugerir um livro',
] as const;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatCollectionName(collectionId: Book['collection']): string {
  return COLLECTION_META.find((c) => c.id === collectionId)?.name ?? 'Acervo Geral';
}

export function generateBiaLocalReply(
  question: string,
  user: UserProfile,
  books: Book[],
  borrowedBookIds: Set<string>,
): string {
  const q = normalizeText(question);
  const firstName = user.name.split(' ')[0] || 'Leitor(a)';
  const isTeacher = user.role === 'professor';

  // 1. Leitor bloqueado / não consegue ler o livro
  if (
    q.includes('nao consigo ler') ||
    q.includes('ler o livro') ||
    q.includes('leitor') ||
    q.includes('bloqueado') ||
    q.includes('abrir o livro') ||
    q.includes('ler completo')
  ) {
    return (
      `Para liberar a leitura completa na BiblioTec, ${firstName}, você precisa primeiro alugar o livro gratuitamente na sua conta:\n\n` +
      `1. Abra a obra desejada no Acervo e clique em "Pegar Emprestado" (custo zero).\n` +
      `2. Assim que o empréstimo for confirmado, o botão "Ler Livro Completo" será liberado no próprio card e também na aba "Meus Alugados".\n` +
      `3. No leitor, você pode ajustar a fonte (A− / A+), alternar entre Modo Papel e Modo Noturno e navegar pelos capítulos. Ao devolver o exemplar, o acesso de leitura volta a ser bloqueado.`
    );
  }

  // 2. Prazo de devolução e renovação
  if (
    q.includes('prazo') ||
    q.includes('devoluc') ||
    q.includes('renovar') ||
    q.includes('renovacao') ||
    q.includes('dias') ||
    q.includes('atraso')
  ) {
    return (
      `Os empréstimos da Escola Remy Soares são 100% gratuitos e os prazos funcionam assim:\n\n` +
      `• Alunos: 14 dias por empréstimo, com até 2 renovações de +7 dias cada.\n` +
      `• Professores: 30 dias por empréstimo, com até 2 renovações de +15 dias cada.\n\n` +
      `No seu perfil atual (${isTeacher ? 'Professor' : 'Aluno'}), você recebe ${
        isTeacher ? '30 dias' : '14 dias'
      } automaticamente ao retirar qualquer obra. Você pode acompanhar datas, renovar ou devolver na aba "Meus Alugados".`
    );
  }

  // 3. Como alugar / pegar emprestado
  if (
    q.includes('como alugar') ||
    q.includes('pegar emprestado') ||
    q.includes('alugar') ||
    q.includes('emprestar') ||
    q.includes('emprestimo') ||
    q.includes('gratuito') ||
    q.includes('custa')
  ) {
    return (
      `Alugar um livro na BiblioTec é gratuito e leva apenas um clique, ${firstName}:\n\n` +
      `1. Pesquise pelo título, autor ou coleção na aba "Acervo" (use o filtro "Disponível" se quiser ver apenas livros livres agora).\n` +
      `2. Clique em "Pegar Emprestado" no card ou na ficha do livro.\n` +
      `3. O prazo de ${isTeacher ? '30 dias' : '14 dias'} começa na hora e o livro aparece em "Meus Alugados" com leitura completa liberada.`
    );
  }

  // 4. Regras de cadastro e nome real
  if (
    q.includes('cadastro') ||
    q.includes('nome real') ||
    q.includes('nome completo') ||
    q.includes('carteirinha') ||
    q.includes('conta') ||
    q.includes('abreviac')
  ) {
    return (
      `Para garantir a segurança da biblioteca escolar, o cadastro exige nome e sobrenome reais e completos:\n\n` +
      `• Informe pelo menos duas palavras (nome e sobrenome).\n` +
      `• Não use abreviações ou iniciais (como "João S."), números, símbolos ou apelidos.\n` +
      `• Após o cadastro, sua Carteirinha Digital é emitida automaticamente na aba "Carteirinha".`
    );
  }

  // 5. Sugestões de leitura ou busca no acervo
  if (
    q.includes('sugerir') ||
    q.includes('sugest') ||
    q.includes('recomenda') ||
    q.includes('indicacao') ||
    q.includes('indica') ||
    q.includes('livro bom') ||
    q.includes('ler hoje') ||
    q.includes('acervo') ||
    q.includes('literatura') ||
    q.includes('fantasia') ||
    q.includes('ciencia') ||
    q.includes('historia') ||
    q.includes('quadrinho') ||
    q.includes('didatico')
  ) {
    const availableBooks = books.filter((b) => !borrowedBookIds.has(b.id));
    const pool = availableBooks.length > 0 ? availableBooks : books;

    let matched = pool;
    if (q.includes('literatura') || q.includes('brasileir') || q.includes('machado')) {
      matched = pool.filter((b) => b.collection === 'literatura-brasileira');
    } else if (q.includes('fantasia') || q.includes('ficcao') || q.includes('misterio')) {
      matched = pool.filter((b) => b.collection === 'ficcao-fantasia');
    } else if (q.includes('ciencia') || q.includes('tecnologia') || q.includes('astronomia')) {
      matched = pool.filter((b) => b.collection === 'ciencias-tecnologia');
    } else if (q.includes('historia')) {
      matched = pool.filter((b) => b.collection === 'historia');
    } else if (q.includes('didatico') || q.includes('vestibular') || q.includes('enem')) {
      matched = pool.filter((b) => b.collection === 'material-didatico');
    } else if (q.includes('quadrinho') || q.includes('hq')) {
      matched = pool.filter((b) => b.collection === 'quadrinhos');
    }

    const picks = (matched.length > 0 ? matched : pool).slice(0, 3);
    if (picks.length === 0) {
      return 'No momento não há livros cadastrados no catálogo. Clique em "Falar com o Administrador" para enviar sua sugestão de acervo!';
    }

    const lines = picks
      .map(
        (b) =>
          `• "${b.title}" (${b.author}) — ${formatCollectionName(b.collection)} · ${
            borrowedBookIds.has(b.id) ? 'Emprestado no momento' : 'Disponível agora'
          }`,
      )
      .join('\n');

    return (
      `Separei estas sugestões do acervo da Escola Remy Soares para você, ${firstName}:\n\n` +
      `${lines}\n\n` +
      `Se quiser sugerir a compra ou inclusão de um novo livro que ainda não temos, clique no botão "Falar com o Administrador" logo abaixo!`
    );
  }

  // 6. Resposta geral orientando e oferecendo atendimento humano
  return (
    `Olá, ${firstName}! Posso ajudar você com empréstimos gratuitos, prazos (14 dias para alunos e 30 para professores), liberação do leitor completo, regras da carteirinha ou sugestões do acervo.\n\n` +
    `Se você precisar de ajuda específica com sua conta, relatar algum problema ou sugerir novos livros, clique no botão "Falar com o Administrador" logo abaixo para registrar seu atendimento.`
  );
}

export async function askBiaAssistant(
  question: string,
  history: BiaConversationTurn[],
  user: UserProfile,
  books: Book[],
  borrowedBookIds: Set<string>,
  activeLoansCount: number,
): Promise<string> {
  try {
    const catalogSummary = books.map((b) => ({
      title: b.title,
      author: b.author,
      collection: formatCollectionName(b.collection),
      available: !borrowedBookIds.has(b.id),
      location: b.location,
    }));

    const response = await fetch('/api/support/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: question,
        history,
        userContext: {
          name: user.name,
          role: user.role,
          activeLoansCount,
        },
        catalogSummary,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as { reply?: string };
      if (data.reply && data.reply.trim().length > 0) {
        return data.reply.trim();
      }
    }
  } catch {
    // Fallback determinístico em caso de indisponibilidade de rede ou chave não configurada
  }

  return generateBiaLocalReply(question, user, books, borrowedBookIds);
}
