import { ArrowRight } from 'lucide-react';
import { COLLECTION_META, type Book, type CollectionId, type LoanRecord } from '../types/library';
import { DEFAULT_COVER_BY_COLLECTION } from '../data/coverAssets';

interface CollectionsViewProps {
  books: Book[];
  activeLoans: LoanRecord[];
  onSelectCollection: (collectionId: CollectionId) => void;
}

export function CollectionsView({
  books,
  activeLoans,
  onSelectCollection,
}: CollectionsViewProps) {
  const safeBooks = Array.isArray(books) ? books : [];
  const safeActiveLoans = Array.isArray(activeLoans) ? activeLoans : [];
  const loanedBookIds = new Set(safeActiveLoans.map((l) => l.bookId));

  return (
    <section className="space-y-8">
      <div className="border-b border-[#DED4C3] pb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-[#8C6820]">
          Organização por Acervos
        </p>
        <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#12233B]">
          Coleções Temáticas da Escola
        </h2>
        <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#4A596E]">
          Explore os corredores da biblioteca por área do conhecimento. Clique em qualquer acervo
          para filtrar imediatamente o catálogo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COLLECTION_META.map((col, idx) => {
          const colBooks = safeBooks.filter((b) => b.collection === col.id);
          const availableCount = colBooks.filter((b) => !loanedBookIds.has(b.id)).length;
          const previewImage = DEFAULT_COVER_BY_COLLECTION[col.id];

          return (
            <button
              key={col.id}
              type="button"
              onClick={() => onSelectCollection(col.id)}
              className="group flex flex-col justify-between overflow-hidden rounded-lg border border-[#DED4C3] bg-white p-6 text-left transition-colors hover:border-[#B68930]"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="font-mono text-xs text-[#8C6820] tabular-nums">
                      0{idx + 1}. {col.corridor}
                    </span>
                    <h3 className="mt-1 font-serif text-2xl font-semibold text-[#12233B] group-hover:text-[#162B49]">
                      {col.name}
                    </h3>
                  </div>
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded border border-[#DED4C3]">
                    <img
                      src={previewImage}
                      alt={col.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[#4A596E]">{col.description}</p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#DED4C3] pt-4 text-xs">
                <div className="text-[#4A596E]">
                  <span className="font-mono font-semibold tabular-nums text-[#12233B]">
                    {colBooks.length}
                  </span>{' '}
                  {colBooks.length === 1 ? 'obra' : 'obras'}
                  <span aria-hidden="true" className="mx-1.5">
                    ·
                  </span>
                  <span className="font-medium text-[#155E42]">
                    <span className="font-mono tabular-nums">{availableCount}</span> disponíveis
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 font-medium text-[#162B49] group-hover:translate-x-0.5 transition-transform">
                  <span>Ver livros</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
