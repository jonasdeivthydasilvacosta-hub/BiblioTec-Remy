import { useEffect, useState } from 'react';
import type { Book } from '../types/library';
import { COLLECTION_META } from '../types/library';

interface BookCoverProps {
  book: Pick<Book, 'title' | 'author' | 'collection' | 'coverUrl' | 'coverTone' | 'year'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TONE_PALETTES: Record<
  Book['coverTone'],
  { bg: string; innerBorder: string; title: string; muted: string; spine: string }
> = {
  navy: {
    bg: 'bg-[#162B49]',
    innerBorder: 'border-[#C9A24E]/45',
    title: 'text-[#FBF8F1]',
    muted: 'text-[#D7B46A]',
    spine: 'bg-[#0E1D33]',
  },
  burgundy: {
    bg: 'bg-[#4C232A]',
    innerBorder: 'border-[#DFBA6A]/45',
    title: 'text-[#FBF8F1]',
    muted: 'text-[#E7C986]',
    spine: 'bg-[#36161C]',
  },
  forest: {
    bg: 'bg-[#1A3B36]',
    innerBorder: 'border-[#C9A24E]/45',
    title: 'text-[#FBF8F1]',
    muted: 'text-[#D7B46A]',
    spine: 'bg-[#102824]',
  },
  ochre: {
    bg: 'bg-[#EDE3CF]',
    innerBorder: 'border-[#162B49]/25',
    title: 'text-[#12233B]',
    muted: 'text-[#7C5A1A]',
    spine: 'bg-[#D8CAAE]',
  },
  slate: {
    bg: 'bg-[#243447]',
    innerBorder: 'border-[#D7B46A]/40',
    title: 'text-[#FBF8F1]',
    muted: 'text-[#C8D3E0]',
    spine: 'bg-[#182330]',
  },
};

export function BookCover({ book, size = 'md', className = '' }: BookCoverProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [book.coverUrl]);

  const palette = TONE_PALETTES[book.coverTone] ?? TONE_PALETTES.navy;
  const collectionName =
    COLLECTION_META.find((c) => c.id === book.collection)?.shortName ?? 'Acervo';

  const hasValidImage = Boolean(book.coverUrl) && !imgFailed;

  const titleSizeClass =
    size === 'sm'
      ? 'text-xs leading-tight'
      : size === 'lg'
        ? 'text-xl sm:text-2xl leading-snug'
        : 'text-sm sm:text-base leading-snug';

  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-[4px] border border-[#12233B]/15 shadow-[0_6px_18px_-6px_rgba(18,35,59,0.2)] select-none ${className}`}
    >
      {hasValidImage ? (
        <>
          <img
            src={book.coverUrl}
            alt={`Capa do livro ${book.title} de ${book.author}`}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/25 via-black/10 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0E1D33]/85 via-[#0E1D33]/15 to-transparent"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-3.5 text-[#FBF8F1]">
            <p className="font-mono text-[10px] tracking-wider uppercase text-[#E4C57D] truncate">
              {collectionName}
            </p>
            <p
              className={`font-serif font-semibold mt-0.5 line-clamp-2 drop-shadow-sm ${
                size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'
              }`}
            >
              {book.title}
            </p>
            {size !== 'sm' && (
              <p className="mt-0.5 text-[11px] text-[#E6DFD2] truncate">{book.author}</p>
            )}
          </div>
        </>
      ) : (
        <div className={`relative flex h-full w-full flex-col justify-between p-3 sm:p-4 ${palette.bg}`}>
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 left-0 w-2.5 ${palette.spine}`}
          />
          <div className={`relative z-10 flex h-full flex-col justify-between border p-2.5 sm:p-3 ${palette.innerBorder}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`font-mono text-[9px] uppercase tracking-widest truncate ${palette.muted}`}>
                {collectionName}
              </span>
              <span className={`font-mono text-[9px] tabular-nums ${palette.muted}`}>
                {book.year}
              </span>
            </div>

            <div className="my-auto py-2">
              <div className={`h-px w-7 mb-2.5 bg-current opacity-45 ${palette.muted}`} />
              <p className={`font-serif font-semibold line-clamp-3 ${titleSizeClass} ${palette.title}`}>
                {book.title}
              </p>
            </div>

            <div className="pt-2 border-t border-current/15">
              <p className={`text-[11px] font-medium truncate ${palette.muted}`}>{book.author}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
