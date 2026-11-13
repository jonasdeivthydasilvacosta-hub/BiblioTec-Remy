/// <reference types="node" />
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AssistantHistoryItem {
  role: 'user' | 'assistant';
  text: string;
}

interface CatalogSummaryItem {
  title: string;
  author: string;
  collection: string;
  available: boolean;
  location?: string;
}

interface SupportAssistantRequest {
  message?: string;
  history?: AssistantHistoryItem[];
  userContext?: {
    name?: string;
    role?: string;
    activeLoansCount?: number;
  };
  catalogSummary?: CatalogSummaryItem[];
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/support/assistant', async (req, res) => {
    const body = (req.body ?? {}) as SupportAssistantRequest;
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message) {
      res.status(400).json({ error: 'Mensagem vazia.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'API_KEY_UNAVAILABLE' });
      return;
    }

    try {
      const userName = body.userContext?.name || 'Leitor(a)';
      const userRoleLabel = body.userContext?.role === 'professor' ? 'Professor' : 'Aluno';
      const activeLoansCount =
        typeof body.userContext?.activeLoansCount === 'number'
          ? body.userContext.activeLoansCount
          : 0;

      const catalogLines = Array.isArray(body.catalogSummary)
        ? body.catalogSummary
            .slice(0, 24)
            .map(
              (b) =>
                `- "${b.title}" (${b.author}) | Coleção: ${b.collection} | Status: ${
                  b.available ? 'Disponível' : 'Emprestado no momento'
                }${b.location ? ` | Local: ${b.location}` : ''}`,
            )
            .join('\n')
        : '';

      const historyText = Array.isArray(body.history)
        ? body.history
            .slice(-6)
            .map((h) => `${h.role === 'user' ? 'Usuário' : 'Bia'}: ${h.text}`)
            .join('\n')
        : '';

      const systemInstruction = `Você é a Bia, Assistente Virtual oficial da BiblioTec — Biblioteca Escolar Remy Soares.
Responda sempre em português brasileiro claro, acolhedor, educado e objetivo (2 a 5 frases no máximo, podendo usar tópicos curtos quando útil).

Regras reais do aplicativo BiblioTec que você deve explicar com precisão:
1. Empréstimo gratuito: Todos os livros são 100% gratuitos. Para alugar, clique no livro desejado no Acervo e aperte "Pegar Emprestado" (se já estiver disponível).
2. Prazos e renovação: Alunos têm prazo padrão de 14 dias (renovável por +7 dias, até 2 vezes). Professores têm prazo estendido de 30 dias (renovável por +15 dias, até 2 vezes). Os empréstimos ativos e botões de "Devolver" ou "Renovar" ficam na aba "Meus Alugados".
3. Regra obrigatória de leitura ("Não consigo ler o livro"): Um livro só libera o botão "Ler Livro Completo" depois que o usuário o alugar na própria conta. Ao devolver o livro, a leitura volta a ser bloqueada até um novo empréstimo. No leitor completo existem controles de tamanho de fonte (A− / A+), Modo Papel / Modo Noturno e navegação por capítulos.
4. Cadastro e nome real: Alunos e professores devem se cadastrar usando nome e sobrenome reais e completos (mínimo 2 palavras, sem abreviações como "João S.", sem números, símbolos ou apelidos genéricos).
5. Sugestões de leitura: Recomende APENAS livros presentes na lista real do acervo abaixo, informando se estão disponíveis agora. Nunca invente títulos que não estejam no catálogo.
6. Atendimento humano: Se o usuário precisar falar com a gestão da biblioteca, sugerir a compra de novos exemplares, relatar erro em algum livro ou tratar de um caso específico, oriente a clicar no botão "Falar com o Administrador" aqui na janela de suporte.

Contexto do usuário atual:
- Nome: ${userName}
- Perfil: ${userRoleLabel}
- Empréstimos ativos no momento: ${activeLoansCount}

Acervo atual da Escola Remy Soares:
${catalogLines || '(Catálogo indisponível no momento)'}`;

      const contents = historyText
        ? `Histórico recente da conversa:\n${historyText}\n\nNova pergunta do usuário:\n${message}`
        : message;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        res.status(502).json({ error: 'EMPTY_MODEL_RESPONSE' });
        return;
      }

      res.json({ reply, source: 'gemini' });
    } catch (error) {
      console.error('Erro ao consultar Gemini para a Bia:', error);
      res.status(502).json({ error: 'GEMINI_REQUEST_FAILED' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`BiblioTec server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BiblioTec server:', err);
  process.exit(1);
});
