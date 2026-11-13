import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Type,
} from 'lucide-react';
import type { Book, BookChapter } from '../types/library';
import { parseBookContentToChapters } from '../utils/storage';

interface BookReaderModalProps {
  book: Book | null;
  isAllowedToRead: boolean;
  onClose: () => void;
}

const FONT_SIZES = [
  { label: 'Pequena', px: 16 },
  { label: 'Média', px: 18 },
  { label: 'Grande', px: 20 },
  { label: 'Extra Grande', px: 23 },
] as const;

export function BookReaderModal({ book, isAllowedToRead, onClose }: BookReaderModalProps) {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [fontSizeIdx, setFontSizeIdx] = useState(1);
  const [nightMode, setNightMode] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setChapterIndex(0);
  }, [book?.id]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      container.scrollTop = 0;
    }
  }, [chapterIndex]);

  useEffect(() => {
    if (!book || !isAllowedToRead) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [book, isAllowedToRead]);

  if (!book || !isAllowedToRead) return null;

  const chapters: BookChapter[] =
    Array.isArray(book.chapters) && book.chapters.length > 0
      ? book.chapters
      : parseBookContentToChapters(book.synopsis ?? '', book.title ?? 'Obra Escolar');

  const safeIndex = Math.min(Math.max(0, chapterIndex), Math.max(0, chapters.length - 1));
  const currentChapter = chapters[safeIndex] ?? {
    id: 'cap-1',
    title: 'Leitura',
    paragraphs: [],
  };
  const currentParagraphs = Array.isArray(currentChapter.paragraphs)
    ? currentChapter.paragraphs
    : [];
  const currentFont = FONT_SIZES[fontSizeIdx] ?? FONT_SIZES[1];

  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < chapters.length - 1;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-colors duration-200 ${
        nightMode
          ? 'bg-[#0E1726] text-[#EAE3D5]'
          : 'bg-[#FBF8F1] text-[#12233B]'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-book-title"
    >
      {/* Top Reader Toolbar */}
      <header
        className={`shrink-0 border-b transition-colors ${
          nightMode
            ? 'border-[#24344B] bg-[#121D2F]/95'
            : 'border-[#DED4C3] bg-[#F3ECE0]/90'
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                nightMode
                  ? 'border-[#2E425E] bg-[#162338] text-[#FBF8F1] hover:bg-[#1E304C]'
                  : 'border-[#DED4C3] bg-white text-[#12233B] hover:border-[#B68930]'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>

            <div className="min-w-0">
              <h2
                id="reader-book-title"
                className="font-serif text-sm sm:text-base font-semibold truncate"
              >
                {book.title}
              </h2>
              <p
                className={`text-xs truncate ${
                  nightMode ? 'text-[#A6B4C8]' : 'text-[#4A596E]'
                }`}
              >
                {book.author}
                <span aria-hidden="true"> · </span>
                <span className="font-mono tabular-nums">
                  Cap. {safeIndex + 1}/{chapters.length}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Font Size Controls */}
            <div
              role="group"
              aria-label="Tamanho da fonte"
              className={`inline-flex items-center rounded-md border p-0.5 ${
                nightMode
                  ? 'border-[#2E425E] bg-[#162338]'
                  : 'border-[#DED4C3] bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setFontSizeIdx((i) => Math.max(0, i - 1))}
                disabled={fontSizeIdx === 0}
                aria-label="Diminuir tamanho da fonte"
                className={`px-2.5 py-1.5 text-xs font-semibold rounded transition-colors disabled:opacity-40 ${
                  nightMode ? 'hover:bg-[#223452]' : 'hover:bg-[#F3ECE0]'
                }`}
              >
                A−
              </button>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[11px] tabular-nums opacity-75">
                <Type className="h-3 w-3" />
                {currentFont.px}
              </span>
              <button
                type="button"
                onClick={() => setFontSizeIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
                disabled={fontSizeIdx === FONT_SIZES.length - 1}
                aria-label="Aumentar tamanho da fonte"
                className={`px-2.5 py-1.5 text-xs font-semibold rounded transition-colors disabled:opacity-40 ${
                  nightMode ? 'hover:bg-[#223452]' : 'hover:bg-[#F3ECE0]'
                }`}
              >
                A+
              </button>
            </div>

            {/* Day / Night Theme Toggle */}
            <button
              type="button"
              onClick={() => setNightMode((prev) => !prev)}
              aria-label={nightMode ? 'Alternar para Modo Claro (Papel)' : 'Alternar para Modo Noturno'}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                nightMode
                  ? 'border-[#D7B46A]/45 bg-[#162338] text-[#E4C57D] hover:bg-[#1E304C]'
                  : 'border-[#DED4C3] bg-white text-[#12233B] hover:border-[#B68930]'
              }`}
            >
              {nightMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">
                {nightMode ? 'Modo Papel' : 'Modo Noturno'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Reading Canvas */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <article className="mx-auto max-w-[68ch] px-5 sm:px-8 py-10 sm:py-14">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-current/15">
            <span
              className={`font-mono text-xs uppercase tracking-widest ${
                nightMode ? 'text-[#D7B46A]' : 'text-[#8C6820]'
              }`}
            >
              Capítulo {safeIndex + 1} de {chapters.length}
            </span>

            {chapters.length > 1 && (
              <label className="flex items-center gap-2 text-xs">
                <span className={nightMode ? 'text-[#A6B4C8]' : 'text-[#4A596E]'}>Ir para:</span>
                <select
                  value={safeIndex}
                  onChange={(e) => setChapterIndex(Number(e.target.value))}
                  aria-label="Selecionar capítulo"
                  className={`rounded border px-2.5 py-1 text-xs font-medium focus:outline-none ${
                    nightMode
                      ? 'border-[#2E425E] bg-[#162338] text-[#EAE3D5]'
                      : 'border-[#DED4C3] bg-white text-[#12233B]'
                  }`}
                >
                  {chapters.map((ch, idx) => (
                    <option key={ch.id} value={idx}>
                      {ch.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <h1 className="mt-6 font-serif text-2xl sm:text-4xl font-semibold leading-tight">
            {currentChapter.title}
          </h1>

          <div
            className={`mt-8 space-y-6 font-serif leading-[1.85] ${
              nightMode ? 'tracking-[0.01em] text-[#EAE3D5]' : 'text-[#1B2B42]'
            }`}
            style={{ fontSize: `${currentFont.px}px` }}
          >
            {currentParagraphs.map((paragraph, pIdx) => (
              <p
                key={`${currentChapter.id}-p-${pIdx}`}
                className={
                  pIdx === 0
                    ? `first-letter:text-5xl first-letter:font-serif first-letter:font-semibold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none ${
                        nightMode ? 'first-letter:text-[#E4C57D]' : 'first-letter:text-[#162B49]'
                      }`
                    : ''
                }
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Bottom Chapter Navigation */}
          <nav
            aria-label="Navegação entre capítulos"
            className={`mt-14 flex flex-wrap items-center justify-between gap-4 border-t pt-6 ${
              nightMode ? 'border-[#24344B]' : 'border-[#DED4C3]'
            }`}
          >
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => setChapterIndex((i) => Math.max(0, i - 1))}
              className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${
                nightMode
                  ? 'border-[#2E425E] bg-[#162338] text-[#EAE3D5] hover:bg-[#1E304C]'
                  : 'border-[#DED4C3] bg-white text-[#12233B] hover:border-[#B68930]'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Capítulo Anterior</span>
            </button>

            <span
              className={`font-mono text-xs tabular-nums ${
                nightMode ? 'text-[#A6B4C8]' : 'text-[#4A596E]'
              }`}
            >
              Página {safeIndex + 1} de {chapters.length}
            </span>

            {hasNext ? (
              <button
                type="button"
                onClick={() => setChapterIndex((i) => Math.min(chapters.length - 1, i + 1))}
                className={`inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  nightMode
                    ? 'bg-[#D7B46A] text-[#0E1726] hover:bg-[#E4C57D]'
                    : 'bg-[#162B49] text-[#FBF8F1] hover:bg-[#0E1D33]'
                }`}
              >
                <span>Próximo Capítulo</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  nightMode
                    ? 'bg-[#D7B46A] text-[#0E1726] hover:bg-[#E4C57D]'
                    : 'bg-[#162B49] text-[#FBF8F1] hover:bg-[#0E1D33]'
                }`}
              >
                <span>Concluir Leitura</span>
              </button>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
