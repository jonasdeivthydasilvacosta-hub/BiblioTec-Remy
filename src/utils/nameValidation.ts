const PORTUGUESE_CONNECTORS = new Set(['da', 'de', 'do', 'das', 'dos']);

const BLOCKED_WORDS = new Set([
  // Termos genéricos, falsos e de sistema
  'teste',
  'testando',
  'test',
  'admin',
  'administrador',
  'dono',
  'user',
  'usuario',
  'aluno',
  'aluna',
  'professor',
  'professora',
  'ninguem',
  'desconhecido',
  'desconhecida',
  'anonimo',
  'anonima',
  'semnome',
  'fulano',
  'beltrano',
  'ciclano',
  'sicrano',
  'exemplo',
  'nome',
  'sobrenome',
  'fake',
  'falso',
  'null',
  'undefined',
  'xpto',
  'biblio',
  'bibliotec',
  'escola',
  // Sequências de teclado e apelidos de jogos
  'abcd',
  'abcde',
  'abcdef',
  'asdf',
  'asdfg',
  'asdfgh',
  'qwer',
  'qwerty',
  'zxcv',
  'zxcvb',
  'player',
  'gamer',
  'proplayer',
  'noob',
  'bot',
  'hacker',
  'shadow',
  'dark',
  'killer',
  'king',
  'queen',
  'master',
  'ninja',
  'legend',
  'mitinho',
  'mito',
  'zueira',
  'troll',
  // Palavras impróprias e ofensivas (normalizadas sem acento)
  'porra',
  'merda',
  'caralho',
  'cacete',
  'bosta',
  'puta',
  'puto',
  'putaria',
  'foda',
  'foder',
  'fodase',
  'cuzao',
  'arrombado',
  'arrombada',
  'babaca',
  'idiota',
  'imbecil',
  'otario',
  'otaria',
  'trouxa',
  'vagabundo',
  'vagabunda',
  'piranha',
  'desgraca',
  'fdp',
  'vsf',
  'pqp',
  'kct',
  'corno',
  'corna',
  'viado',
  'bicha',
  'sapatao',
  'retardado',
  'retardada',
  'lixo',
  'verme',
  'escroto',
  'escrota',
  'buceta',
  'xoxota',
  'pau',
  'rola',
  'piroca',
  'punheta',
  'siririca',
]);

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export interface NameValidationResult {
  valid: boolean;
  error?: string;
  formattedName?: string;
}

export function formatRealName(rawName: string): string {
  const words = rawName.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  return words
    .map((word, idx) => {
      const lower = word.toLocaleLowerCase('pt-BR');
      const normalized = normalizeText(lower);
      if (idx > 0 && idx < words.length - 1 && PORTUGUESE_CONNECTORS.has(normalized)) {
        return lower;
      }
      return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1);
    })
    .join(' ');
}

export function validateRealFullName(rawName: string): NameValidationResult {
  const collapsed = rawName.trim().replace(/\s+/g, ' ');

  if (!collapsed) {
    return {
      valid: false,
      error: 'Por favor, informe seu nome e sobrenome completos.',
    };
  }

  // Apenas letras (incluindo acentos e cedilha) e espaços
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(collapsed)) {
    return {
      valid: false,
      error:
        'Por favor, informe seu nome e sobrenome completos sem abreviações, números ou símbolos.',
    };
  }

  const words = collapsed.split(' ').filter(Boolean);

  if (words.length < 2) {
    return {
      valid: false,
      error: 'Digite nome e sobrenome obrigatórios (pelo menos duas palavras).',
    };
  }

  const normalizedWords = words.map((w) => normalizeText(w));

  // Primeiro e último nome não podem ser conectivos
  if (
    PORTUGUESE_CONNECTORS.has(normalizedWords[0]) ||
    PORTUGUESE_CONNECTORS.has(normalizedWords[normalizedWords.length - 1])
  ) {
    return {
      valid: false,
      error: 'Informe seu nome e sobrenome completos, sem iniciar ou terminar com abreviações.',
    };
  }

  // Verificar partes não-conectivas (pelo menos 3 letras reais e sem abreviações)
  const nonConnectorWords = normalizedWords.filter((w) => !PORTUGUESE_CONNECTORS.has(w));
  if (nonConnectorWords.length < 2) {
    return {
      valid: false,
      error: 'Informe pelo menos um nome e um sobrenome completos.',
    };
  }

  for (const word of nonConnectorWords) {
    if (word.length < 3) {
      return {
        valid: false,
        error:
          'Evite iniciais ou abreviações (como "S." ou "Ana B"). Escreva cada parte do nome com pelo menos 3 letras.',
      };
    }

    // Bloquear sequências repetidas de letras (ex.: "aaaa", "mariaaa")
    if (/(.)\1{2,}/.test(word)) {
      return {
        valid: false,
        error: 'O nome informado contém sequências repetidas de letras inválidas.',
      };
    }

    // Bloquear palavras compostas por apenas uma ou duas letras alternadas sem vogal ou repetição óbvia
    const uniqueChars = new Set(word.split(''));
    if (uniqueChars.size <= 1) {
      return {
        valid: false,
        error: 'Por favor, informe um nome real válido.',
      };
    }

    // Exigir ao menos uma vogal em cada parte real do nome (evita "bcdf", "qwrty")
    if (!/[aeiouy]/.test(word)) {
      return {
        valid: false,
        error: 'Cada parte do nome deve ser uma palavra real legível.',
      };
    }

    if (BLOCKED_WORDS.has(word)) {
      return {
        valid: false,
        error:
          'Não use apelidos genéricos, palavras de teste ou termos impróprios. Informe seu nome real.',
      };
    }
  }

  // Bloquear nome completo igual a termos compostos ou concatenação suspeita
  const joinedNormalized = normalizedWords.join('');
  if (BLOCKED_WORDS.has(joinedNormalized)) {
    return {
      valid: false,
      error: 'Por favor, informe seu nome e sobrenome reais para emitir a carteirinha.',
    };
  }

  return {
    valid: true,
    formattedName: formatRealName(collapsed),
  };
}
