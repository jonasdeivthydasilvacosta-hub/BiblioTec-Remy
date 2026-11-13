import { useEffect, useState } from 'react';
import {
  BookOpenCheck,
  GraduationCap,
  HelpCircle,
  KeyRound,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import {
  LOAN_DAYS_BY_ROLE,
  SECURITY_QUESTIONS,
  type UserProfile,
} from '../types/library';
import {
  generateRegistrationCode,
  loadAdminPinLockout,
  normalizeSecurityAnswer,
} from '../utils/storage';
import { validateRealFullName } from '../utils/nameValidation';

export interface AdminPinCheckResult {
  ok: boolean;
  remainingAttempts: number;
  lockSecondsRemaining: number;
}

export interface ReaderLoginResult {
  ok: boolean;
  error?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'register' | 'login' | 'admin';
  onClose: () => void;
  onLoginReader: (params: {
    fullName: string;
    method: 'pin' | 'question';
    secretValue: string;
    securityQuestion?: string;
  }) => ReaderLoginResult;
  onCreateUser: (profile: UserProfile) => { ok: boolean; error?: string };
  onVerifyAdminPassword: (password: string) => boolean;
  onVerifyAdminPin: (pin: string) => AdminPinCheckResult;
}

export function AuthModal({
  isOpen,
  initialTab = 'login',
  onClose,
  onLoginReader,
  onCreateUser,
  onVerifyAdminPassword,
  onVerifyAdminPin,
}: AuthModalProps) {
  const [mode, setMode] = useState<'register' | 'login' | 'admin'>(initialTab);

  // Private manual login state (zero account lists or user hints)
  const [loginFullName, setLoginFullName] = useState('');
  const [loginMethod, setLoginMethod] = useState<'pin' | 'question'>('pin');
  const [loginPin, setLoginPin] = useState('');
  const [loginQuestion, setLoginQuestion] = useState<string>(SECURITY_QUESTIONS[0]);
  const [loginAnswer, setLoginAnswer] = useState('');

  // Register state (Aluno / Professor)
  const [role, setRole] = useState<'aluno' | 'professor'>('aluno');
  const [name, setName] = useState('');
  const [departmentOrClass, setDepartmentOrClass] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [email, setEmail] = useState('');
  const [registerPin, setRegisterPin] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState<string>(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [nameError, setNameError] = useState('');

  // Admin 2FA state
  const [adminStep, setAdminStep] = useState<'password' | 'pin'>('password');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState<number>(() => {
    const { lockUntil } = loadAdminPinLockout();
    return lockUntil > Date.now() ? Math.ceil((lockUntil - Date.now()) / 1000) : 0;
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || mode !== 'admin' || adminStep !== 'pin') return;

    const syncCountdown = () => {
      const { lockUntil } = loadAdminPinLockout();
      const remaining = lockUntil > Date.now() ? Math.ceil((lockUntil - Date.now()) / 1000) : 0;
      setLockSecondsRemaining(remaining);
    };

    syncCountdown();
    const interval = window.setInterval(syncCountdown, 250);
    return () => window.clearInterval(interval);
  }, [isOpen, mode, adminStep]);

  if (!isOpen) return null;

  const resetLoginForm = () => {
    setLoginFullName('');
    setLoginMethod('pin');
    setLoginPin('');
    setLoginQuestion(SECURITY_QUESTIONS[0]);
    setLoginAnswer('');
    setError('');
  };

  const resetAdminFlow = () => {
    setAdminStep('password');
    setAdminPassword('');
    setAdminPin('');
    setError('');
  };

  const handlePrivateLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = loginFullName.trim();
    if (!cleanName) {
      setError('Digite seu nome completo real.');
      return;
    }

    if (loginMethod === 'pin') {
      if (!/^\d{4}$/.test(loginPin)) {
        setError('Nome ou código PIN incorretos.');
        return;
      }
      const res = onLoginReader({
        fullName: cleanName,
        method: 'pin',
        secretValue: loginPin,
      });
      if (!res.ok) {
        setError(res.error ?? 'Nome ou código PIN incorretos.');
        setLoginPin('');
        return;
      }
    } else {
      if (loginAnswer.trim().length < 2) {
        setError('Nome, pergunta ou resposta de segurança incorretos.');
        return;
      }
      const res = onLoginReader({
        fullName: cleanName,
        method: 'question',
        secretValue: loginAnswer,
        securityQuestion: loginQuestion,
      });
      if (!res.ok) {
        setError(res.error ?? 'Nome, pergunta ou resposta de segurança incorretos.');
        setLoginAnswer('');
        return;
      }
    }

    resetLoginForm();
    onClose();
  };

  const handleSubmitReaderRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const nameCheck = validateRealFullName(name);
    if (!nameCheck.valid || !nameCheck.formattedName) {
      const msg =
        nameCheck.error ??
        'Por favor, informe seu nome e sobrenome completos sem abreviações ou números.';
      setNameError(msg);
      setError(msg);
      return;
    }

    const cleanDept = departmentOrClass.trim();
    if (!cleanDept) {
      setNameError('');
      setError('Informe sua turma ou disciplina.');
      return;
    }

    if (!/^\d{4}$/.test(registerPin)) {
      setNameError('');
      setError('Crie um Código PIN pessoal com exatamente 4 dígitos numéricos.');
      return;
    }

    const normalizedAnswer = normalizeSecurityAnswer(securityAnswer);
    if (normalizedAnswer.length < 2) {
      setNameError('');
      setError('Informe uma resposta válida para a pergunta de segurança.');
      return;
    }

    const selectedRole: 'aluno' | 'professor' = role === 'professor' ? 'professor' : 'aluno';
    const newProfile: UserProfile = {
      id: `user-${Date.now()}`,
      name: nameCheck.formattedName,
      role: selectedRole,
      departmentOrClass: cleanDept,
      registrationCode: registrationCode.trim() || generateRegistrationCode(selectedRole),
      email: email.trim() || undefined,
      pinCode: registerPin,
      securityQuestion,
      securityAnswer: normalizedAnswer,
      status: 'ativo',
      createdAt: new Date().toISOString(),
    };

    const createResult = onCreateUser(newProfile);
    if (!createResult.ok) {
      setError(createResult.error ?? 'Não foi possível criar a conta.');
      return;
    }

    setName('');
    setDepartmentOrClass('');
    setRegistrationCode('');
    setEmail('');
    setRegisterPin('');
    setSecurityQuestion(SECURITY_QUESTIONS[0]);
    setSecurityAnswer('');
    setNameError('');
    setError('');
    onClose();
  };

  const handleAdminPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onVerifyAdminPassword(adminPassword);
    if (!ok) {
      setError('Senha de administrador incorreta.');
      setAdminPassword('');
      return;
    }
    setAdminPassword('');
    setAdminPin('');
    setError('');
    setAdminStep('pin');
  };

  const handleAdminPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockSecondsRemaining > 0) return;

    if (!/^\d{6}$/.test(adminPin)) {
      setError('Digite os 6 dígitos numéricos do PIN de administrador.');
      return;
    }

    const result = onVerifyAdminPin(adminPin);
    if (!result.ok) {
      setAdminPin('');
      if (result.lockSecondsRemaining > 0) {
        setLockSecondsRemaining(result.lockSecondsRemaining);
        setError('');
      } else {
        setError(
          `PIN de administrador incorreto. Restam ${result.remainingAttempts} ${
            result.remainingAttempts === 1 ? 'tentativa' : 'tentativas'
          }.`,
        );
      }
      return;
    }

    resetAdminFlow();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1D33]/60 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-xl overflow-y-auto max-h-[92vh] rounded-lg border border-[#DED4C3] bg-[#FBF8F1] p-6 sm:p-8 shadow-2xl">
        <button
          type="button"
          onClick={() => {
            resetAdminFlow();
            resetLoginForm();
            onClose();
          }}
          aria-label="Fechar janela de acesso"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-md text-[#4A596E] hover:bg-[#EAE0CE] hover:text-[#12233B] transition-colors focus-visible:outline-2 focus-visible:outline-[#162B49]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pr-8">
          <p className="text-xs font-medium tracking-wider text-[#8C6820] uppercase">
            BiblioTec · Biblioteca Escolar Remy Soares
          </p>
          <h2
            id="auth-modal-title"
            className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#12233B]"
          >
            {mode === 'admin'
              ? 'Área do Administrador'
              : mode === 'register'
                ? 'Criar Conta na BiblioTec'
                : 'Entrar na BiblioTec'}
          </h2>
          <p className="mt-1.5 text-sm text-[#4A596E]">
            {mode === 'admin'
              ? adminStep === 'pin'
                ? 'Etapa 2 de 2 · Verificação em Duas Etapas obrigatória.'
                : 'Acesso restrito protegido por verificação em duas etapas.'
              : 'Acesso privado e individual protegido por verificação em duas etapas (2FA).'}
          </p>
        </div>

        <div className="mt-6 flex overflow-x-auto border-b border-[#DED4C3]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              resetLoginForm();
              resetAdminFlow();
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              mode === 'login'
                ? 'border-[#162B49] text-[#12233B]'
                : 'border-transparent text-[#4A596E] hover:text-[#12233B]'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
              resetAdminFlow();
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              mode === 'register'
                ? 'border-[#162B49] text-[#12233B]'
                : 'border-transparent text-[#4A596E] hover:text-[#12233B]'
            }`}
          >
            Novo Cadastro
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('admin');
              resetAdminFlow();
              resetLoginForm();
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              mode === 'admin'
                ? 'border-[#B68930] text-[#12233B]'
                : 'border-transparent text-[#4A596E] hover:text-[#12233B]'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#8C6820]" />
            <span>Área do Administrador</span>
          </button>
        </div>

        {/* PRIVATE MANUAL LOGIN (ZERO ACCOUNT LISTS) */}
        {mode === 'login' && (
          <form onSubmit={handlePrivateLoginSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="login-full-name"
                className="block text-sm font-medium text-[#12233B] mb-1.5"
              >
                Nome completo real
              </label>
              <input
                id="login-full-name"
                type="text"
                autoComplete="name"
                value={loginFullName}
                onChange={(e) => {
                  setLoginFullName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Digite seu nome e sobrenome completos"
                className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:outline-none"
                required
              />
            </div>

            {loginMethod === 'pin' ? (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="login-reader-pin"
                    className="block text-sm font-medium text-[#12233B] mb-1.5"
                  >
                    Código PIN pessoal (4 dígitos)
                  </label>
                  <input
                    id="login-reader-pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    value={loginPin}
                    onChange={(e) => {
                      setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                      if (error) setError('');
                    }}
                    placeholder="••••"
                    className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 font-mono text-base tracking-[0.35em] text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('question');
                    setLoginPin('');
                    setError('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#162B49] underline underline-offset-4 hover:text-[#8C6820]"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Esqueci meu PIN · Usar Pergunta de Segurança</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="login-security-question"
                    className="block text-sm font-medium text-[#12233B] mb-1.5"
                  >
                    Pergunta de Segurança cadastrada
                  </label>
                  <select
                    id="login-security-question"
                    value={loginQuestion}
                    onChange={(e) => {
                      setLoginQuestion(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full rounded-md border border-[#DED4C3] bg-white px-3 py-2.5 text-sm text-[#12233B] focus:border-[#162B49] focus:outline-none"
                  >
                    {SECURITY_QUESTIONS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="login-reader-answer"
                    className="block text-sm font-medium text-[#12233B] mb-1.5"
                  >
                    Resposta da Pergunta de Segurança
                  </label>
                  <input
                    id="login-reader-answer"
                    type="password"
                    autoComplete="off"
                    value={loginAnswer}
                    onChange={(e) => {
                      setLoginAnswer(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('pin');
                    setLoginAnswer('');
                    setError('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#162B49] underline underline-offset-4 hover:text-[#8C6820]"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Voltar para login com Código PIN</span>
                </button>
              </div>
            )}

            {error && (
              <p className="text-sm font-medium text-[#8C3B2B]" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetLoginForm();
                  onClose();
                }}
                className="px-4 py-2.5 text-sm font-medium text-[#4A596E] hover:text-[#12233B] transition-colors whitespace-nowrap shrink-0"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-[#162B49] px-5 py-2.5 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors whitespace-nowrap shrink-0"
              >
                <UserCheck className="h-4 w-4 text-[#E4C57D]" />
                <span>{loginMethod === 'pin' ? 'Entrar' : 'Verificar e Entrar'}</span>
              </button>
            </div>
          </form>
        )}

        {/* REGISTER WITH 2FA (ALUNO / PROFESSOR) */}
        {mode === 'register' && (
          <form onSubmit={handleSubmitReaderRegister} className="mt-6 space-y-5">
            <div>
              <span className="block text-sm font-medium text-[#12233B] mb-2">
                Selecione seu perfil escolar
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('aluno')}
                  className={`flex flex-col items-start rounded-md border p-4 text-left transition-colors ${
                    role === 'aluno'
                      ? 'border-[#162B49] bg-[#162B49] text-[#FBF8F1]'
                      : 'border-[#DED4C3] bg-white text-[#12233B] hover:border-[#B68930]'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <GraduationCap className="h-5 w-5" />
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        role === 'aluno' ? 'text-[#E4C57D]' : 'text-[#8C6820]'
                      }`}
                    >
                      {LOAN_DAYS_BY_ROLE.aluno} dias
                    </span>
                  </div>
                  <span className="mt-2 font-serif text-lg font-semibold">Aluno</span>
                  <span
                    className={`mt-0.5 text-xs ${
                      role === 'aluno' ? 'text-[#DCE3EE]' : 'text-[#4A596E]'
                    }`}
                  >
                    Prazo padrão de empréstimo: 14 dias
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('professor')}
                  className={`flex flex-col items-start rounded-md border p-4 text-left transition-colors ${
                    role === 'professor'
                      ? 'border-[#162B49] bg-[#162B49] text-[#FBF8F1]'
                      : 'border-[#DED4C3] bg-white text-[#12233B] hover:border-[#B68930]'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <BookOpenCheck className="h-5 w-5" />
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        role === 'professor' ? 'text-[#E4C57D]' : 'text-[#8C6820]'
                      }`}
                    >
                      {LOAN_DAYS_BY_ROLE.professor} dias
                    </span>
                  </div>
                  <span className="mt-2 font-serif text-lg font-semibold">Professor</span>
                  <span
                    className={`mt-0.5 text-xs ${
                      role === 'professor' ? 'text-[#DCE3EE]' : 'text-[#4A596E]'
                    }`}
                  >
                    Prazo estendido de empréstimo: 30 dias
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="auth-name" className="block text-sm font-medium text-[#12233B] mb-1.5">
                Nome completo
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError('');
                  if (error) setError('');
                }}
                placeholder={
                  role === 'aluno' ? 'Ex.: Lucas Oliveira Santos' : 'Ex.: Beatriz Almeida'
                }
                aria-describedby="auth-name-hint"
                aria-invalid={Boolean(nameError)}
                className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-[#12233B] placeholder:text-[#7D8A9C] focus:outline-none ${
                  nameError
                    ? 'border-[#8C3B2B] focus:border-[#8C3B2B]'
                    : 'border-[#DED4C3] focus:border-[#162B49]'
                }`}
                required
              />
              <p id="auth-name-hint" className="mt-1.5 text-xs text-[#4A596E]">
                Digite seu nome e sobrenome reais, sem abreviações, números ou apelidos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="auth-dept"
                  className="block text-sm font-medium text-[#12233B] mb-1.5"
                >
                  {role === 'aluno' ? 'Turma / Série' : 'Disciplina / Área'}
                </label>
                <input
                  id="auth-dept"
                  type="text"
                  value={departmentOrClass}
                  onChange={(e) => setDepartmentOrClass(e.target.value)}
                  placeholder={
                    role === 'aluno' ? 'Ex.: 1º Ano A · Manhã' : 'Ex.: História e Sociologia'
                  }
                  className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="auth-reg" className="block text-sm font-medium text-[#12233B] mb-1.5">
                  Matrícula (opcional)
                </label>
                <input
                  id="auth-reg"
                  type="text"
                  value={registrationCode}
                  onChange={(e) => setRegistrationCode(e.target.value)}
                  placeholder={role === 'aluno' ? 'Gerada automaticamente' : 'Ex.: 2026-PR-0091'}
                  className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 font-mono text-sm text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-[#12233B] mb-1.5">
                E-mail escolar (opcional)
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@escola.edu.br"
                className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:outline-none"
              />
            </div>

            {/* 2FA Setup Section */}
            <div className="border-t border-[#DED4C3] pt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6820]">
                  Verificação em Duas Etapas (2FA) da Carteirinha
                </p>
                <p className="mt-0.5 text-xs text-[#4A596E]">
                  Crie um PIN de 4 dígitos e uma pergunta de segurança para confirmar seus próximos
                  acessos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="register-pin"
                    className="block text-sm font-medium text-[#12233B] mb-1.5"
                  >
                    PIN de 4 dígitos
                  </label>
                  <input
                    id="register-pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={4}
                    value={registerPin}
                    onChange={(e) => {
                      setRegisterPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                      if (error) setError('');
                    }}
                    placeholder="••••"
                    className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 font-mono text-base tracking-[0.35em] text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="register-question"
                    className="block text-sm font-medium text-[#12233B] mb-1.5"
                  >
                    Pergunta de Segurança
                  </label>
                  <select
                    id="register-question"
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    className="w-full rounded-md border border-[#DED4C3] bg-white px-3 py-2.5 text-sm text-[#12233B] focus:border-[#162B49] focus:outline-none"
                  >
                    {SECURITY_QUESTIONS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-answer"
                  className="block text-sm font-medium text-[#12233B] mb-1.5"
                >
                  Resposta da Pergunta de Segurança
                </label>
                <input
                  id="register-answer"
                  type="password"
                  autoComplete="off"
                  value={securityAnswer}
                  onChange={(e) => {
                    setSecurityAnswer(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium text-[#8C3B2B]" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-[#4A596E] hover:text-[#12233B] transition-colors whitespace-nowrap shrink-0"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#162B49] px-5 py-2.5 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors whitespace-nowrap shrink-0"
              >
                Emitir Carteirinha e Entrar
              </button>
            </div>
          </form>
        )}

        {/* ADMIN 2FA (PASSWORD -> 6-DIGIT PIN WITH 30s LOCKOUT) */}
        {mode === 'admin' && adminStep === 'password' && (
          <form onSubmit={handleAdminPasswordSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="admin-master-password"
                className="block text-sm font-medium text-[#12233B] mb-1.5"
              >
                Etapa 1 de 2 · Senha do Administrador
              </label>
              <input
                id="admin-master-password"
                type="password"
                autoComplete="current-password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:outline-none"
                required
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-[#8C3B2B]" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetAdminFlow();
                  onClose();
                }}
                className="px-4 py-2.5 text-sm font-medium text-[#4A596E] hover:text-[#12233B] transition-colors whitespace-nowrap shrink-0"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-[#162B49] px-5 py-2.5 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors whitespace-nowrap shrink-0"
              >
                <KeyRound className="h-4 w-4 text-[#E4C57D]" />
                <span>Continuar</span>
              </button>
            </div>
          </form>
        )}

        {mode === 'admin' && adminStep === 'pin' && (
          <form onSubmit={handleAdminPinSubmit} className="mt-6 space-y-5">
            <div className="rounded-md border border-[#DED4C3] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6820]">
                Etapa 2 de 2 · Verificação em Duas Etapas
              </p>
              <p className="mt-1 text-sm text-[#4A596E]">
                Senha confirmada. Digite o PIN Secreto de 6 dígitos para desbloquear o painel
                administrativo.
              </p>
            </div>

            <div>
              <label
                htmlFor="admin-secret-pin"
                className="block text-sm font-medium text-[#12233B] mb-1.5"
              >
                PIN Secreto de 6 dígitos
              </label>
              <input
                id="admin-secret-pin"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                disabled={lockSecondsRemaining > 0}
                value={adminPin}
                onChange={(e) => {
                  setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                  if (error) setError('');
                }}
                placeholder="••••••"
                className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 font-mono text-lg tracking-[0.4em] text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:outline-none disabled:bg-[#EAE0CE]/60 disabled:cursor-not-allowed"
                required
              />
            </div>

            {lockSecondsRemaining > 0 && (
              <div
                role="alert"
                className="rounded-md border border-[#8C3B2B]/40 bg-[#FDF3F1] px-4 py-3 text-sm text-[#8C3B2B]"
              >
                <p className="font-semibold">Tentativas temporariamente bloqueadas.</p>
                <p className="mt-0.5 text-xs">
                  Aguarde{' '}
                  <strong className="font-mono tabular-nums">{lockSecondsRemaining}s</strong> para
                  tentar o PIN novamente.
                </p>
              </div>
            )}

            {error && lockSecondsRemaining === 0 && (
              <p className="text-sm font-medium text-[#8C3B2B]" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetAdminFlow}
                className="px-4 py-2.5 text-sm font-medium text-[#4A596E] hover:text-[#12233B] transition-colors whitespace-nowrap shrink-0"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={lockSecondsRemaining > 0}
                className="inline-flex items-center gap-2 rounded-md bg-[#162B49] px-5 py-2.5 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="h-4 w-4 text-[#E4C57D]" />
                <span>Verificar PIN e Entrar</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
