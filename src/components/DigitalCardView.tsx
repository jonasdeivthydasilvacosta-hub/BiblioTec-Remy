import { BookOpenCheck, GraduationCap, LogOut, ShieldCheck } from 'lucide-react';
import { LOAN_DAYS_BY_ROLE, type UserProfile } from '../types/library';
import { formatShortDate } from '../utils/storage';

interface DigitalCardViewProps {
  currentUser: UserProfile | null;
  activeLoansCount: number;
  returnedLoansCount: number;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function DigitalCardView({
  currentUser,
  activeLoansCount,
  returnedLoansCount,
  onOpenAuth,
  onLogout,
}: DigitalCardViewProps) {
  if (!currentUser) {
    return (
      <section className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-[#8C6820]">
          Identificação Escolar
        </p>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-[#12233B]">
          Emita sua Carteirinha Digital
        </h2>
        <p className="mt-3 text-base text-[#4A596E]">
          Cadastre-se gratuitamente como Aluno (14 dias por empréstimo) ou Professor (30 dias por
          empréstimo) para retirar livros no acervo.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onOpenAuth}
            className="rounded-md bg-[#162B49] px-6 py-3 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors"
          >
            Criar Conta ou Entrar
          </button>
        </div>
      </section>
    );
  }

  const loanDays = LOAN_DAYS_BY_ROLE[currentUser.role] ?? 14;
  const isTeacher = currentUser.role === 'professor';
  const isAdmin = currentUser.role === 'admin';

  return (
    <section className="space-y-8">
      <div className="border-b border-[#DED4C3] pb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-[#8C6820]">
          Credencial da Biblioteca Escolar
        </p>
        <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#12233B]">
          Carteirinha Digital
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-xl border border-[#D7B46A]/50 bg-[#162B49] p-6 sm:p-8 text-[#FBF8F1] shadow-[0_14px_34px_-12px_rgba(14,29,51,0.45)]">
            <div className="pointer-events-none absolute inset-3 rounded-lg border border-[#D7B46A]/25" />

            <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 border-b border-[#D7B46A]/25 pb-5">
              <div>
                <p className="font-serif text-xl font-semibold tracking-tight text-[#FBF8F1]">
                  BiblioTec
                </p>
                <p className="mt-0.5 text-xs text-[#D7B46A]">
                  Biblioteca Escolar Remy Soares · Credencial Gratuita
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#E4C57D]">
                {isAdmin ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : isTeacher ? (
                  <BookOpenCheck className="h-4 w-4" />
                ) : (
                  <GraduationCap className="h-4 w-4" />
                )}
                <span>
                  {isAdmin
                    ? 'Dono / Administrador'
                    : isTeacher
                      ? 'Perfil Professor'
                      : 'Perfil Aluno'}
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <span className="block text-[11px] uppercase tracking-widest text-[#B8C4D4]">
                  Nome do Leitor
                </span>
                <p className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#FBF8F1]">
                  {currentUser.name}
                </p>
              </div>

              <div>
                <span className="block text-[11px] uppercase tracking-widest text-[#B8C4D4]">
                  {isAdmin ? 'Função / Acesso' : isTeacher ? 'Disciplina / Área' : 'Turma / Série'}
                </span>
                <p className="mt-1 text-sm font-medium text-[#FBF8F1]">
                  {currentUser.departmentOrClass}
                </p>
              </div>

              <div>
                <span className="block text-[11px] uppercase tracking-widest text-[#B8C4D4]">
                  Matrícula
                </span>
                <p className="mt-1 font-mono text-base font-semibold tabular-nums text-[#E4C57D]">
                  {currentUser.registrationCode}
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#D7B46A]/25 pt-4 text-xs text-[#DCE3EE]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#D7B46A]" />
                Prazo de empréstimo: <strong className="font-mono tabular-nums text-white">{loanDays} dias</strong>
              </span>
              <span className="font-mono tabular-nums text-[#B8C4D4]">
                Emitida em {formatShortDate(currentUser.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6 rounded-lg border border-[#DED4C3] bg-white p-6">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#12233B]">
              Resumo da Conta
            </h3>
            <dl className="mt-4 divide-y divide-[#DED4C3] text-sm">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-[#4A596E]">Livros em posse atual</dt>
                <dd className="font-mono font-semibold tabular-nums text-[#12233B]">
                  {activeLoansCount}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-[#4A596E]">Obras já devolvidas</dt>
                <dd className="font-mono font-semibold tabular-nums text-[#12233B]">
                  {returnedLoansCount}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-[#4A596E]">Custo de empréstimo</dt>
                <dd className="font-medium text-[#155E42]">100% Gratuito</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#8C3B2B]/40 bg-white px-4 py-2.5 text-sm font-medium text-[#8C3B2B] hover:bg-[#F3ECE0] transition-colors whitespace-nowrap"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair da Conta (Encerrar Sessão)</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
