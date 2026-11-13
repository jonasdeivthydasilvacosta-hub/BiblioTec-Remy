import { useEffect, useState } from 'react';
import { FileText, ImagePlus, X } from 'lucide-react';
import { COLLECTION_META, type Book, type CollectionId } from '../types/library';
import { PRESET_COVERS } from '../data/coverAssets';
import {
  compressImageFile,
  parseBookContentToChapters,
  serializeChaptersToText,
} from '../utils/storage';
import { BookCover } from './BookCover';

interface AddBookModalProps {
  isOpen: boolean;
  bookToEdit?: Book | null;
  onClose: () => void;
  onAddBook: (book: Book) => void;
  onUpdateBook?: (book: Book) => void;
  currentUserName?: string;
}

const COVER_TONES: { id: Book['coverTone']; label: string; swatch: string }[] = [
  { id: 'navy', label: 'Azul Profundo', swatch: 'bg-[#162B49]' },
  { id: 'ochre', label: 'Papel Creme', swatch: 'bg-[#EDE3CF]' },
  { id: 'burgundy', label: 'Bordô Clássico', swatch: 'bg-[#4C232A]' },
  { id: 'forest', label: 'Verde Musgo', swatch: 'bg-[#1A3B36]' },
  { id: 'slate', label: 'Ardósia', swatch: 'bg-[#243447]' },
];

export function AddBookModal({
  isOpen,
  bookToEdit = null,
  onClose,
  onAddBook,
  onUpdateBook,
  currentUserName,
}: AddBookModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [collection, setCollection] = useState<CollectionId>('literatura-brasileira');
  const [year, setYear] = useState('2024');
  const [pages, setPages] = useState('220');
  const [publisher, setPublisher] = useState('');
  const [location, setLocation] = useState('Corredor A · Estante 03 · Prateleira 2');
  const [subjectsInput, setSubjectsInput] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [txtFileName, setTxtFileName] = useState('');
  const [coverMode, setCoverMode] = useState<'preset' | 'typographic' | 'upload'>('preset');
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string>(PRESET_COVERS[0].url);
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState<string>('');
  const [coverTone, setCoverTone] = useState<Book['coverTone']>('navy');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (bookToEdit) {
      setTitle(bookToEdit.title);
      setAuthor(bookToEdit.author);
      setCollection(bookToEdit.collection);
      setYear(String(bookToEdit.year));
      setPages(String(bookToEdit.pages));
      setPublisher(bookToEdit.publisher);
      setLocation(bookToEdit.location ?? 'Corredor A · Estante 03 · Prateleira 2');
      setSubjectsInput(
        Array.isArray(bookToEdit.subjects) ? bookToEdit.subjects.join(', ') : '',
      );
      setSynopsis(bookToEdit.synopsis ?? '');
      setFullContent(serializeChaptersToText(bookToEdit.chapters));
      setTxtFileName('');
      setCoverTone(bookToEdit.coverTone);

      if (bookToEdit.coverUrl) {
        const matchingPreset = PRESET_COVERS.find((p) => p.url === bookToEdit.coverUrl);
        if (matchingPreset) {
          setCoverMode('preset');
          setSelectedPresetUrl(matchingPreset.url);
          setUploadedCoverUrl('');
        } else {
          setCoverMode('upload');
          setUploadedCoverUrl(bookToEdit.coverUrl);
        }
      } else {
        setCoverMode('typographic');
        setUploadedCoverUrl('');
      }
      setError('');
    } else {
      setTitle('');
      setAuthor('');
      setCollection('literatura-brasileira');
      setYear('2024');
      setPages('220');
      setPublisher('');
      setLocation('Corredor A · Estante 03 · Prateleira 2');
      setSubjectsInput('');
      setSynopsis('');
      setFullContent('');
      setTxtFileName('');
      setCoverMode('preset');
      setSelectedPresetUrl(PRESET_COVERS[0].url);
      setUploadedCoverUrl('');
      setCoverTone('navy');
      setError('');
    }
  }, [isOpen, bookToEdit]);

  if (!isOpen) return null;

  const activeCoverUrl =
    coverMode === 'preset'
      ? selectedPresetUrl
      : coverMode === 'upload' && uploadedCoverUrl
        ? uploadedCoverUrl
        : undefined;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setUploadedCoverUrl(compressed);
      setCoverMode('upload');
      setError('');
    } catch {
      setError('Não foi possível carregar essa imagem. Tente outro arquivo JPG ou PNG.');
    }
  };

  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFullContent(String(reader.result ?? ''));
      setTxtFileName(file.name);
      setError('');
    };
    reader.onerror = () => {
      setError('Não foi possível ler o arquivo .txt selecionado.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleCollectionChange = (nextCol: CollectionId) => {
    setCollection(nextCol);
    const colMeta = COLLECTION_META.find((c) => c.id === nextCol);
    if (colMeta && location.startsWith('Corredor ')) {
      setLocation(`${colMeta.corridor} · Estante 01 · Prateleira 2`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !location.trim()) {
      setError('Informe ao menos título, autor e localização na estante.');
      return;
    }

    const subjects = subjectsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedChapters = parseBookContentToChapters(fullContent, title.trim());

    if (bookToEdit && onUpdateBook) {
      const updatedBook: Book = {
        ...bookToEdit,
        title: title.trim(),
        author: author.trim(),
        collection,
        year: Number.parseInt(year, 10) || bookToEdit.year,
        pages: Number.parseInt(pages, 10) || bookToEdit.pages,
        publisher: publisher.trim() || 'Acervo Escolar',
        location: location.trim(),
        subjects: subjects.length > 0 ? subjects : ['Leitura Escolar'],
        synopsis:
          synopsis.trim() ||
          'Obra incorporada ao acervo da BiblioTec — Escola Remy Soares para consulta local e empréstimo gratuito a alunos e professores.',
        chapters: parsedChapters,
        coverUrl: activeCoverUrl,
        coverTone,
      };
      onUpdateBook(updatedBook);
      onClose();
      return;
    }

    const newBook: Book = {
      id: `book-${Date.now()}`,
      title: title.trim(),
      author: author.trim(),
      collection,
      year: Number.parseInt(year, 10) || new Date().getFullYear(),
      pages: Number.parseInt(pages, 10) || 180,
      publisher: publisher.trim() || 'Acervo Escolar',
      location: location.trim(),
      subjects: subjects.length > 0 ? subjects : ['Leitura Escolar'],
      synopsis:
        synopsis.trim() ||
        'Obra incorporada ao acervo da BiblioTec — Escola Remy Soares para consulta local e empréstimo gratuito a alunos e professores.',
      chapters: parsedChapters,
      coverUrl: activeCoverUrl,
      coverTone,
      addedAt: new Date().toISOString(),
      addedBy: currentUserName,
    };

    onAddBook(newBook);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1D33]/65 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-book-title"
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-lg border border-[#DED4C3] bg-[#FBF8F1] p-6 sm:p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar cadastro de livro"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-md text-[#4A596E] hover:bg-[#EAE0CE] hover:text-[#12233B] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pr-8">
          <p className="text-xs font-medium uppercase tracking-wider text-[#8C6820]">
            Gestão Exclusiva do Acervo · Dono / Admin
          </p>
          <h2 id="add-book-title" className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#12233B]">
            {bookToEdit ? 'Editar Livro do Acervo' : 'Cadastrar Novo Livro'}
          </h2>
          <p className="mt-1 text-sm text-[#4A596E]">
            {bookToEdit
              ? 'Corrija título, autor, capa, localização ou o texto completo desta obra.'
              : 'Adicione um título ao catálogo da escola com sua coleção, localização e texto integral.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-4">
            <div className="w-44 mx-auto md:w-full">
              <BookCover
                book={{
                  title: title.trim() || 'Título da Obra',
                  author: author.trim() || 'Autor(a)',
                  collection,
                  year: Number.parseInt(year, 10) || 2026,
                  coverUrl: activeCoverUrl,
                  coverTone,
                }}
                size="md"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-medium text-[#12233B]">Estilo da Capa</span>
              <div className="grid grid-cols-3 gap-1.5 rounded-md bg-[#EAE0CE] p-1">
                <button
                  type="button"
                  onClick={() => setCoverMode('preset')}
                  className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                    coverMode === 'preset' ? 'bg-white text-[#12233B] shadow-xs' : 'text-[#4A596E]'
                  }`}
                >
                  Ilustrada
                </button>
                <button
                  type="button"
                  onClick={() => setCoverMode('typographic')}
                  className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                    coverMode === 'typographic'
                      ? 'bg-white text-[#12233B] shadow-xs'
                      : 'text-[#4A596E]'
                  }`}
                >
                  Clássica
                </button>
                <label className="cursor-pointer rounded px-2 py-1.5 text-center text-xs font-medium text-[#4A596E] hover:text-[#12233B] transition-colors">
                  Enviar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </div>

              {coverMode === 'preset' && (
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {PRESET_COVERS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPresetUrl(preset.url)}
                      title={preset.label}
                      className={`aspect-[3/4] overflow-hidden rounded border-2 transition-all ${
                        selectedPresetUrl === preset.url
                          ? 'border-[#B68930] scale-[1.03]'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {coverMode === 'typographic' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {COVER_TONES.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setCoverTone(tone.id)}
                      title={tone.label}
                      className={`h-7 w-7 rounded-full border-2 ${tone.swatch} ${
                        coverTone === tone.id ? 'border-[#B68930] scale-110' : 'border-[#DED4C3]'
                      }`}
                    />
                  ))}
                </div>
              )}

              {coverMode === 'upload' && (
                <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#B68930] bg-white px-3 py-2 text-xs font-medium text-[#162B49] hover:bg-[#F7EFDC] transition-colors">
                  <ImagePlus className="h-4 w-4" />
                  <span>{uploadedCoverUrl ? 'Trocar imagem' : 'Escolher imagem'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="md:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="book-title" className="block text-sm font-medium text-[#12233B] mb-1">
                  Título do livro
                </label>
                <input
                  id="book-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Vidas Secas"
                  className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm text-[#12233B] focus:border-[#162B49] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="book-author" className="block text-sm font-medium text-[#12233B] mb-1">
                  Autor(a)
                </label>
                <input
                  id="book-author"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ex.: Graciliano Ramos"
                  className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm text-[#12233B] focus:border-[#162B49] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="book-collection" className="block text-sm font-medium text-[#12233B] mb-1">
                  Acervo / Coleção
                </label>
                <select
                  id="book-collection"
                  value={collection}
                  onChange={(e) => handleCollectionChange(e.target.value as CollectionId)}
                  className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm text-[#12233B] focus:border-[#162B49] focus:outline-none"
                >
                  {COLLECTION_META.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="book-location" className="block text-sm font-medium text-[#12233B] mb-1">
                  Corredor / Estante / Prateleira
                </label>
                <input
                  id="book-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex.: Corredor A · Estante 03 · Prateleira 2"
                  className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 font-mono text-xs text-[#12233B] focus:border-[#162B49] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="book-year" className="block text-sm font-medium text-[#12233B] mb-1">
                  Ano
                </label>
                <input
                  id="book-year"
                  type="number"
                  min={1400}
                  max={2099}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 font-mono text-sm text-[#12233B] focus:border-[#162B49] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="book-subjects" className="block text-sm font-medium text-[#12233B] mb-1">
                  Assuntos (separados por vírgula)
                </label>
                <input
                  id="book-subjects"
                  type="text"
                  value={subjectsInput}
                  onChange={(e) => setSubjectsInput(e.target.value)}
                  placeholder="Ex.: Regionalismo, Sertão, Vestibular"
                  className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm text-[#12233B] focus:border-[#162B49] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="book-pages" className="block text-sm font-medium text-[#12233B] mb-1">
                  Páginas
                </label>
                <input
                  id="book-pages"
                  type="number"
                  min={1}
                  max={5000}
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 font-mono text-sm text-[#12233B] focus:border-[#162B49] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="book-publisher" className="block text-sm font-medium text-[#12233B] mb-1">
                Editora (opcional)
              </label>
              <input
                id="book-publisher"
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Ex.: Companhia das Letras"
                className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm text-[#12233B] focus:border-[#162B49] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="book-synopsis" className="block text-sm font-medium text-[#12233B] mb-1">
                Sinopse
              </label>
              <textarea
                id="book-synopsis"
                rows={2}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Breve descrição da obra para ajudar alunos e professores na escolha..."
                className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm text-[#12233B] focus:border-[#162B49] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label htmlFor="book-full-content" className="block text-sm font-medium text-[#12233B]">
                  Conteúdo / Texto Completo do Livro
                </label>
                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded border border-[#DED4C3] bg-white px-2.5 py-1 text-xs font-medium text-[#162B49] hover:border-[#B68930] transition-colors">
                  <FileText className="h-3.5 w-3.5 text-[#8C6820]" />
                  <span>{txtFileName ? `Importado: ${txtFileName}` : 'Importar arquivo .txt'}</span>
                  <input
                    type="file"
                    accept=".txt,text/plain"
                    onChange={handleTxtUpload}
                    className="sr-only"
                  />
                </label>
              </div>
              <textarea
                id="book-full-content"
                rows={6}
                value={fullContent}
                onChange={(e) => setFullContent(e.target.value)}
                placeholder={`Cole o texto completo ou envie um arquivo .txt.\nDica: inicie linhas com "Capítulo 1: Título" para dividir os capítulos automaticamente.`}
                className="w-full rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#12233B] focus:border-[#162B49] focus:outline-none"
              />
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
                className="px-4 py-2.5 text-sm font-medium text-[#4A596E] hover:text-[#12233B] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#162B49] px-5 py-2.5 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors"
              >
                {bookToEdit ? 'Salvar Alterações' : 'Salvar no Acervo'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
