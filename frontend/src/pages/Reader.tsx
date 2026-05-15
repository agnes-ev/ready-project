import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Sparkles, Volume2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { pdfjs } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import { useBooks, Book } from "@/context/BooksContext";


pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

// Define contrast types for theming

type Contrast = "default" | "high" | "sepia" | "dark";


const themeClasses: Record<Contrast, string> = {
  default: "bg-background text-foreground",
  high: "bg-white text-black",
  sepia: "bg-[hsl(39,50%,92%)] text-[hsl(28,30%,28%)]",
  dark: "bg-[hsl(0,0%,7%)] text-[hsl(210,20%,85%)]",
};

const panelClasses: Record<Contrast, string> = {
  default: "bg-card border-foreground/5",
  high: "bg-white border-black/10",
  sepia: "bg-[hsl(39,45%,88%)] border-[hsl(28,20%,60%)]/20",
  dark: "bg-[hsl(0,0%,12%)] border-[hsl(210,10%,30%)]/30",
};

const btnClasses: Record<Contrast, string> = {
  default: "hover:bg-foreground/5",
  high: "hover:bg-black/10",
  sepia: "hover:bg-[hsl(28,20%,60%)]/15",
  dark: "hover:bg-[hsl(210,10%,30%)]/30",
};

const accentBtnClasses: Record<Contrast, string> = {
  default: "bg-primary text-primary-foreground",
  high: "bg-black text-white",
  sepia: "bg-[hsl(28,50%,35%)] text-[hsl(39,50%,95%)]",
  dark: "bg-[hsl(205,50%,45%)] text-white",
};

// Main Reader component

const Reader = () => {
  const { id } = useParams();
  const { books, setBooks } = useBooks();
  const book = books.find((b) => b.id === id);

  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const readerContentRef = useRef<HTMLDivElement | null>(null);

  const [settings, setSettings] = useState({
    fontSize: 18,
    lineHeight: 1.6,
    letterSpacing: 0,
    contrast: "default" as Contrast,
    readingMode: "page" as "scroll" | "page",
    focusMode: false,
    fontFamily: "Arial",
    bold: false,
    italic: false,
  });

  const accent = accentBtnClasses[settings.contrast];

// Function to render text with inline references 
  const renderTextWithReferences = (text: string) => {
  const parts = text.split(/([,.;:!?])(\d{1,2})(?=\s|$)/g);

  return parts.map((part, index) => {
    const previous = parts[index - 1];

    if (/^\d{1,2}$/.test(part) && /[,.;:!?]/.test(previous || "")) {
      return (
        <sup
          key={index}
          className="text-xs text-muted-foreground ml-0.5 align-super"
        >
          {part}
        </sup>
      );
    }

    return part;
  });
};

// Function to determine block styles based on settings and type
const getBlockStyle = (scale = 1) => ({
  fontSize: `${settings.fontSize * scale}px`,
  lineHeight: settings.lineHeight,
  letterSpacing: `${settings.letterSpacing}px`,
  fontFamily: settings.fontFamily,
  fontWeight: settings.bold ? "700" : "400",
  fontStyle: settings.italic ? "italic" : "normal",
});

// Heuristic function to determine if a block should be rendered as a heading
const shouldRenderBlockAsHeading = (
  block: Book["blocks"][number],
  index: number,
  blocks: Book["blocks"]
) => {
  if (block.type !== "title") return false;

  const text = block.originalText.trim();

  const wordCount = text.split(/\s+/).length;
  const endsLikeSentence = /[.!?,;:]$/.test(text);
  const isAllCaps = text === text.toUpperCase() && /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(text);

  const looksLikeChapter =
    /^(capítulo|capitulo|parte|livro|introdução|introducao|prefácio|prefacio|prólogo|prologo|epílogo|epilogo)\b/i.test(text);

  const nextBlock = blocks[index + 1];
  const previousBlock = blocks[index - 1];

  const previousIsText =
    previousBlock?.type === "paragraph" || previousBlock?.type === "text";

  const nextIsText =
    nextBlock?.type === "paragraph" || nextBlock?.type === "text";

  const isSuspiciousSentenceFragment =
    previousIsText && nextIsText && wordCount <= 6 && !isAllCaps && !looksLikeChapter;

  if (isSuspiciousSentenceFragment) return false;

  if (isAllCaps) return true;
  if (looksLikeChapter) return true;

  return wordCount <= 6 && !endsLikeSentence;
};

// Function to process blocks and determine which should be displayed, merging false titles into paragraphs
const getDisplayBlocks = () => {
  if (!book?.blocks) return [];

  const displayBlocks: {
    type: string;
    originalText: string;
    page: number | null;
    sourceType: string;
    order: number;
  }[] = [];

  book.blocks.forEach((block, index) => {
    const shouldBeHeading = shouldRenderBlockAsHeading(
      block,
      index,
      book.blocks!
    );

    const isFalseTitle = block.type === "title" && !shouldBeHeading;

    if (isFalseTitle) {
      const lastBlock = displayBlocks[displayBlocks.length - 1];

      if (lastBlock && lastBlock.type === "paragraph_fragment") {
        lastBlock.originalText += " " + block.originalText;
      } else {
        displayBlocks.push({
          ...block,
          type: "paragraph_fragment",
        });
      }

      return;
    }

    displayBlocks.push(block);
  });

  return displayBlocks;
};

const displayBlocks = getDisplayBlocks();








const pdfPageNumbers = Array.from(
  new Set(
    displayBlocks
      .map((block) => block.page ?? 1)
      .filter((page) => page !== null)
  )
).sort((a, b) => a - b);

const readerTotalPages =
  settings.readingMode === "page"
    ? pdfPageNumbers.length || 1
    : 1;

const currentPdfPage = pdfPageNumbers[currentPage] ?? 1;

const visibleBlocks =
  settings.readingMode === "page"
    ? displayBlocks.filter((block) => (block.page ?? 1) === currentPdfPage)
    : displayBlocks;

const totalPages = readerTotalPages;

// Effect para extrair texto do PDF quando o componente é montado ou quando o livro muda
useEffect(() => {
  if (!book) return;

  setCurrentPage(0);
}, [book?.id]);

// Effect para atualizar o progresso de leitura do livro com base na página atual modo página
useEffect(() => {
  if (!book) return;
  if (settings.readingMode !== "page") return;
  if (!totalPages || totalPages <= 0) return;

  const nextProgress = Math.min(
    100,
    Math.round(((currentPage + 1) / totalPages) * 100)
  );

  setBooks((prev) =>
    prev.map((item) =>
       item.id === book.id && nextProgress > item.progress
        ? { ...item, progress: nextProgress }
        : item
    )
  );
}, [book?.id, currentPage, totalPages, settings.readingMode, setBooks]);

// Effect para atualizar o progresso de leitura do livro com base na posição de rolagem modo rolagem
useEffect(() => {
  if (!book) return;
  if (settings.readingMode !== "scroll") return;

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    if (documentHeight <= 0) return;

    const scrollProgress = Math.round((scrollTop / documentHeight) * 100);

    const nextProgress = Math.min(100, Math.max(0, scrollProgress));

    setBooks((prev) =>
      prev.map((item) =>
        item.id === book.id && nextProgress > item.progress
          ? { ...item, progress: nextProgress }
          : item
      )
    );
  };

  window.addEventListener("scroll", handleScroll);
  handleScroll();

  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}, [book?.id, settings.readingMode, setBooks]);

  return (
    <div className={`min-h-screen transition-smooth ${themeClasses[settings.contrast]}`}>

      {/* Header */}
      {!settings.focusMode && (
        <header className={`h-16 flex items-center justify-between px-8 border-b backdrop-blur-md sticky top-0 z-10 ${panelClasses[settings.contrast]}`}>
          <div className="flex items-center gap-4">


            <Link to={book?.temporary ? "/" : "/library"} className={`p-2 ${btnClasses[settings.contrast]} rounded-full transition-smooth`}>
              <ChevronLeft size={20} />
            </Link>
            <h1 className="font-medium text-sm tracking-tight uppercase opacity-60">
              {book?.title ?? "Leitor"}
            </h1>



          </div>
          <div className="flex items-center gap-2">
            <button className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${btnClasses[settings.contrast]} rounded-lg transition-smooth`}>
              <Sparkles size={16} /> Simplificar
            </button>
            <button className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${btnClasses[settings.contrast]} rounded-lg transition-smooth`}>
              <Volume2 size={16} /> Ouvir
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`ml-2 px-3 py-1.5 text-sm font-medium ${btnClasses[settings.contrast]} rounded-lg transition-smooth`}
            >
              ⚙ Configurações
            </button>
          </div>
        </header>
      )}

      <div className="flex">

        {/* Main content */}
        <main className={`flex-1 pt-12 pb-32 px-6 ${showSettings && !settings.focusMode ? "mr-80" : ""}`}>
          <div
            className={`transition-smooth mx-auto whitespace-pre-line text-left ${settings.bold ? "font-bold" : ""} ${settings.italic ? "italic" : ""}`}
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              letterSpacing: `${settings.letterSpacing}em`,
              fontFamily: `'${settings.fontFamily}', sans-serif`,
              maxWidth: "65ch",
            }}
          >

            {/*Extração de texto pdf*/}
          
            {isLoadingPdf ? (
              <p className="text-center opacity-60">
                Extraindo texto do PDF...
              </p>
            ) : book?.blocks && book.blocks.length > 0 ? (

             <div ref={readerContentRef} className="space-y-5">

              {visibleBlocks.map((block, i) => {

                const shouldBeHeading = shouldRenderBlockAsHeading(
                  block,
                  i,
                  visibleBlocks!
                );

                const titleIndex = visibleBlocks
                  .slice(0, i + 1)
                  .filter((item) => item.type === "title").length;

                if (shouldBeHeading) {
                  if (titleIndex === 1) {
                    return (
                      <h1
                        key={i}
                        style={getBlockStyle(1.7)}
                        className="text-center mb-8 font-bold"
                      >
                        {renderTextWithReferences(block.originalText)}
                      </h1>
                    );
                  }

                  return (
                    <h2
                      key={i}
                      style={getBlockStyle(1.25)}
                      className="text-center mb-4 font-semibold"
                    >
                      {renderTextWithReferences(block.originalText)}
                    </h2>
                  );
                }

                if (block.type === "footnote") {
                  return (
                    <p
                      key={i}
                      style={getBlockStyle(0.82)}
                      className="text-justify border-l-2 pl-4 text-muted-foreground border-border"
                    >
                      {renderTextWithReferences(block.originalText)}
                    </p>
                  );
                }

                return (
                  <p
                    key={i}
                    style={getBlockStyle(1)}
                    className="text-justify mb-6"
                  >
                    {renderTextWithReferences(block.originalText)}
                  </p>
                );
              })}
           
            </div>
            ) : (
              <p className="text-center opacity-60">
                Nenhum texto encontrado nesta página.
              </p>
            )}
              
            </div>

          
          {/* Navegação de páginas */}
          {settings.readingMode === "page" && (
          <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 shadow-smooth rounded-full px-6 py-3 z-20 ${panelClasses[settings.contrast]}`}>
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              className={`p-2 ${btnClasses[settings.contrast]} rounded-full disabled:opacity-30 transition-smooth`}
              disabled={currentPage === 0}
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-sm font-medium tabular-nums">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              className={`p-2 ${btnClasses[settings.contrast]} rounded-full disabled:opacity-30 transition-smooth`}
              disabled={currentPage === totalPages - 1}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
        
        </main>

        {/* Painel de configurações */}
        {showSettings && !settings.focusMode && (
          <aside className={`fixed right-6 top-20 bottom-6 w-80 shadow-smooth rounded-2xl p-6 z-20 overflow-hidden ${panelClasses[settings.contrast]}`} >

            <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-6">
              Acessibilidade
            </h3>

            <div className="space-y-7 h-[calc(100%-3rem)] overflow-y-auto pr-6 pb-4">

              {/* Font family */}
              <section>
                <label className="text-sm font-medium block mb-3">Fonte</label>
                <div className="flex flex-col gap-2">
                  {[
                    { val: "Arial", label: "Arial" },
                    { val: "OpenDyslexic", label: "OpenDyslexic" },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => setSettings({ ...settings, fontFamily: val })}
                      className={`px-3 py-2 rounded-md border text-sm transition-smooth text-left ${
                        settings.fontFamily === val
                          ? `border-current ${accent} font-semibold`
                          : "border-current/20 opacity-60"
                      }`}
                      style={{ fontFamily: `'${val}', sans-serif` }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Bold & Italic */}
              <section>
                <label className="text-sm font-medium block mb-3">Estilo do Texto</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSettings({ ...settings, bold: !settings.bold })}
                    className={`flex-1 py-2 rounded-md border text-sm font-bold transition-smooth ${
                      settings.bold
                        ? `border-current ${accent}`
                        : "border-current/20 opacity-60"
                    }`}
                  >
                    B
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, italic: !settings.italic })}
                    className={`flex-1 py-2 rounded-md border text-sm italic transition-smooth ${
                      settings.italic
                        ? `border-current ${accent}`
                        : "border-current/20 opacity-60"
                    }`}
                  >
                    I
                  </button>
                </div>
              </section>

              {/* Font size */}
              <section>
                <label className="text-sm font-medium block mb-3">
                  Tamanho do Texto — {settings.fontSize}px
                </label>
                <input
                  type="range"
                  min="14"
                  max="34"
                  value={settings.fontSize}
                  onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-primary"
                  style={{ accentColor: settings.contrast === "sepia" ? "hsl(28,50%,35%)" : settings.contrast === "dark" ? "hsl(205,50%,45%)" : undefined }}
                />
              </section>

              {/* Line height */}
              <section>
                <label className="text-sm font-medium block mb-3">Espaçamento de Linha</label>
                <div className="flex gap-2">
                  {[
                    { val: 1.5, label: "P" },
                    { val: 2.0, label: "M" },
                    { val: 2.5, label: "G" },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => setSettings({ ...settings, lineHeight: val })}
                      className={`flex-1 py-2 rounded-md border transition-smooth ${
                        settings.lineHeight === val
                          ? `border-current ${accent} font-semibold`
                          : "border-current/20 opacity-60"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Letter spacing */}
              <section>
                <label className="text-sm font-medium block mb-3">
                  Espaçamento de Letras
                </label>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="0.01"
                  value={settings.letterSpacing}
                  onChange={(e) =>
                    setSettings({ ...settings, letterSpacing: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: settings.contrast === "sepia" ? "hsl(28,50%,35%)" : settings.contrast === "dark" ? "hsl(205,50%,45%)" : undefined }}
                />
              </section>

              {/* Contrast */}
              <section>
                <label className="text-sm font-medium block mb-3">Contraste</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["default", "sepia", "high", "dark"] as Contrast[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setSettings({ ...settings, contrast: c })}
                      className={`h-10 rounded-md border-2 text-[10px] flex items-center justify-center transition-smooth ${
                        settings.contrast === c ? `border-current ${accentBtnClasses[c]}` : "border-transparent"
                      } ${themeClasses[c]}`}
                    >
                      Aa
                    </button>
                  ))}
                </div>
              </section>

              {/* Reading mode */}
              <section>
                <label className="text-sm font-medium block mb-3">Modo de leitura</label>

                <div className="grid grid-cols-2 gap-2">

                  <button
                    onClick={() => {
                      setSettings({ ...settings, readingMode: "page" });
                      setCurrentPage(0);
                    }}
                    className={`px-3 py-2 rounded-md border text-sm transition-smooth ${
                      settings.readingMode === "page"
                        ? `border-current ${accent} font-semibold`
                        : "border-current/20 opacity-60"
                    }`}
                  >
                    Página
                  </button>

                  <button
                    onClick={() => {
                      setSettings({ ...settings, readingMode: "scroll" });
                      setCurrentPage(0);
                    }}
                    className={`px-3 py-2 rounded-md border text-sm transition-smooth ${
                      settings.readingMode === "scroll"
                        ? `border-current ${accent} font-semibold`
                        : "border-current/20 opacity-60"
                    }`}
                  >
                    Rolagem
                  </button>

                </div>
              </section>

              {/* Focus mode */}
              <button
                onClick={() => setSettings({ ...settings, focusMode: !settings.focusMode })}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-smooth ${
                  settings.focusMode
                    ? accent
                    : `opacity-70 ${btnClasses[settings.contrast]} border border-current/20`
                }`}
              >
                <Maximize2 size={16} />
                {settings.focusMode ? "Sair do Modo Foco" : "Ativar Modo Foco"}
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Exit focus mode */}
      {settings.focusMode && (
        <button
          onClick={() => setSettings({ ...settings, focusMode: false })}
          className={`fixed top-6 right-6 px-4 py-2 shadow-smooth rounded-full text-sm font-medium transition-smooth z-30 ${panelClasses[settings.contrast]} ${btnClasses[settings.contrast]}`}
        >
          Sair do Modo Foco
        </button>
      )}
    </div>
  );
};

export default Reader;
