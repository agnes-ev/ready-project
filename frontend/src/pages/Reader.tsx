import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Sparkles, Volume2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useBooks, Book } from "@/context/BooksContext";


// Tipos de contraste disponíveis no leitor

type Contrast = "default" | "high" | "sepia" | "dark";

type ReaderBlock = Book["blocks"][number] & {
  type: Book["blocks"][number]["type"] | "paragraph_fragment";
};

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

// Componente principal do leitor

const Reader = () => {
  const { id } = useParams();
  const { books, setBooks } = useBooks();
  const book = books.find((b) => b.id === id);

  const [currentPage, setCurrentPage] = useState(0);
  const [showSettings, setShowSettings] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const hasRestoredPosition = useRef(false);
  const hasRestoredScrollPosition = useRef(false);
  const scrollSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRestoringPosition, setIsRestoringPosition] = useState(false);
  const [isSimplifiedMode, setIsSimplifiedMode] = useState(false);
  const [isSimplifying, setIsSimplifying] = useState(false);

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

// Renderiza referências numéricas pequenas como sobrescrito
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

// Define o estilo visual dos blocos conforme as configurações do leitor
const getBlockStyle = (scale = 1) => ({
  fontSize: `${settings.fontSize * scale}px`,
  lineHeight: settings.lineHeight,
  letterSpacing: `${settings.letterSpacing}px`,
  fontFamily: settings.fontFamily,
  fontWeight: settings.bold ? "700" : "400",
  fontStyle: settings.italic ? "italic" : "normal",
});

// Heurística para decidir se um bloco deve aparecer como título
const shouldRenderBlockAsHeading = (
  block: ReaderBlock,
  index: number,
  blocks: ReaderBlock[]
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

// Processa os blocos e junta falsos títulos ao parágrafo anterior
const getDisplayBlocks = (): ReaderBlock[] => {
  if (!book?.blocks) return [];

  const displayBlocks: ReaderBlock[] = [];

  const readerBlocks = book.blocks as ReaderBlock[];

  readerBlocks.forEach((block, index) => {
    const shouldBeHeading = shouldRenderBlockAsHeading(
      block,
      index,
      readerBlocks
    );

    const isFalseTitle = block.type === "title" && !shouldBeHeading;

    if (isFalseTitle) {
      const lastBlock = displayBlocks[displayBlocks.length - 1];

      if (lastBlock && lastBlock.type === "paragraph_fragment") {
        displayBlocks[displayBlocks.length - 1] = {
          ...lastBlock,
          originalText: `${lastBlock.originalText} ${block.originalText}`,
        };
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

// Effect para carregar configurações do leitor ao montar o componente
useEffect(() => {
  const loadReaderSettings = async () => {
    try {
      setIsLoadingSettings(true);

      const response = await fetch("http://localhost:3001/reader-settings");

      if (!response.ok) {
        throw new Error("Erro ao buscar configurações do leitor");
      }

      const data = await response.json();

      setSettings((prev) => ({
        ...prev,
        fontSize: data.fontSize ?? prev.fontSize,
        lineHeight: data.lineHeight ?? prev.lineHeight,
        letterSpacing: data.letterSpacing ?? prev.letterSpacing,
        contrast: data.contrast ?? prev.contrast,
        readingMode: data.readingMode ?? prev.readingMode,
        focusMode: data.focusMode ?? prev.focusMode,
        fontFamily: data.fontFamily ?? prev.fontFamily,
        bold: data.bold ?? prev.bold,
        italic: data.italic ?? prev.italic,
      }));
    } catch (error) {
      console.error("Erro ao carregar configurações do leitor:", error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  loadReaderSettings();
}, []);

// Effect para salvar configurações do leitor sempre que elas mudarem
useEffect(() => {
  if (isLoadingSettings) return;

  const timeoutId = setTimeout(async () => {
    try {
      await fetch("http://localhost:3001/reader-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error("Erro ao salvar configurações do leitor:", error);
    }
  }, 500);

  return () => clearTimeout(timeoutId);
}, [settings, isLoadingSettings]);


// Effect para restaurar a última posição no modo página
useEffect(() => {
  if (!book) return;

  hasRestoredPosition.current = false;

  setCurrentPage(book.currentPage ?? 0);

  setTimeout(() => {
    hasRestoredPosition.current = true;
  }, 300);
}, [book?.id]);

// Effect para salvar página atual no modo página, somente após a posição ter sido restaurada para evitar sobrescrever a posição restaurada
useEffect(() => {
  if (!book) return;
  if (settings.readingMode !== "page") return;
  if (!hasRestoredPosition.current) return;

  const saveCurrentPage = async () => {
    try {
      await fetch(`http://localhost:3001/documents/${book.id}/position`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPage,
        }),
      });

      setBooks((prev) =>
        prev.map((item) =>
          item.id === book.id
            ? { ...item, currentPage }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao salvar página atual:", error);
    }
  };

  saveCurrentPage();
}, [book?.id, currentPage, settings.readingMode, setBooks]);

// Effect para atualizar o progresso de leitura no modo página
useEffect(() => {
  if (!book) return;
  if (settings.readingMode !== "page") return;
  if (!hasRestoredPosition.current) return;
  if (!totalPages || totalPages <= 0) return;

  const nextProgress = Math.min(
    100,
    Math.round(((currentPage + 1) / totalPages) * 100)
  );

  if (nextProgress <= (book.progress ?? 0)) return;

  const updateProgress = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/documents/${book.id}/progress`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            progress: nextProgress,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao atualizar progresso");
      }

      setBooks((prev) =>
        prev.map((item) =>
          item.id === book.id && nextProgress > (item.progress ?? 0)
            ? { ...item, progress: nextProgress }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
    }
  };

  updateProgress();
}, [
  book?.id,
  book?.progress,
  currentPage,
  totalPages,
  settings.readingMode,
  setBooks,
]);

// Effect para restaurar a última posição no modo rolagem
useEffect(() => {
  if (!book) return;
  if (settings.readingMode !== "scroll") return;

  hasRestoredScrollPosition.current = false;
  setIsRestoringPosition(true);

  const savedScrollPercent = book.scrollPercent ?? 0;

  const timeoutId = setTimeout(() => {
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const scrollableHeight = scrollHeight - clientHeight;

    if (scrollableHeight > 0 && savedScrollPercent > 0) {
      window.scrollTo({
        top: (scrollableHeight * savedScrollPercent) / 100,
        behavior: "auto",
      });
    }

    setTimeout(() => {
      hasRestoredScrollPosition.current = true;
      setIsRestoringPosition(false);
    }, 300);
  }, 500);

  return () => clearTimeout(timeoutId);
}, [book?.id, settings.readingMode]);

// Effect para salvar progresso e posição no modo rolagem
useEffect(() => {
  if (!book) return;
  if (settings.readingMode !== "scroll") return;

  const calculateScrollPercent = () => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const scrollableHeight = scrollHeight - clientHeight;

    if (scrollableHeight <= 0) return 0;

    return Math.min(
      100,
      Math.round((scrollTop / scrollableHeight) * 100)
    );
  };

  const saveScrollPosition = async () => {
    if (!hasRestoredScrollPosition.current) return;

    const nextScrollPercent = calculateScrollPercent();

    try {
      await fetch(`http://localhost:3001/documents/${book.id}/position`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scrollPercent: nextScrollPercent,
        }),
      });

      if (nextScrollPercent > (book.progress ?? 0)) {
        await fetch(`http://localhost:3001/documents/${book.id}/progress`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            progress: nextScrollPercent,
          }),
        });
      }

      setBooks((prev) =>
        prev.map((item) =>
          item.id === book.id
            ? {
                ...item,
                scrollPercent: nextScrollPercent,
                progress:
                  nextScrollPercent > (item.progress ?? 0)
                    ? nextScrollPercent
                    : item.progress,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao salvar posição da rolagem:", error);
    }
  };

  const handleScroll = () => {
    if (!hasRestoredScrollPosition.current) return;

    if (scrollSaveTimeoutRef.current) {
      clearTimeout(scrollSaveTimeoutRef.current);
    }

    scrollSaveTimeoutRef.current = setTimeout(() => {
      saveScrollPosition();
    }, 700);
  };

  window.addEventListener("scroll", handleScroll);

  return () => {
    if (scrollSaveTimeoutRef.current) {
      clearTimeout(scrollSaveTimeoutRef.current);
    }

    window.removeEventListener("scroll", handleScroll);
  };
}, [
  book?.id,
  book?.progress,
  settings.readingMode,
  setBooks,
]);

// Função para calcular a porcentagem de rolagem atual, usada na transição entre modos para determinar a página correta ou posição de rolagem
const calculateCurrentScrollPercent = () => {
  const scrollTop = window.scrollY;
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = window.innerHeight;
  const scrollableHeight = scrollHeight - clientHeight;

  if (scrollableHeight <= 0) return 0;

  return Math.min(
    100,
    Math.round((scrollTop / scrollableHeight) * 100)
  );
};

// Função para alternar entre modos de leitura, garantindo que a posição seja mantida de forma coerente durante a transição
const changeReadingMode = (nextMode: "page" | "scroll") => {
  if (!book) return;
  if (nextMode === settings.readingMode) return;

  const realTotalPages = pdfPageNumbers.length || 1;

  if (nextMode === "page") {
    const currentScrollPercent = calculateCurrentScrollPercent();

    const nextPage = Math.min(
      realTotalPages - 1,
      Math.max(
        0,
        Math.round((currentScrollPercent / 100) * (realTotalPages - 1))
      )
    );

    setCurrentPage(nextPage);

    setBooks((prev) =>
      prev.map((item) =>
        item.id === book.id
          ? {
              ...item,
              currentPage: nextPage,
              scrollPercent: currentScrollPercent,
            }
          : item
      )
    );
  }

  if (nextMode === "scroll") {
    const currentPagePercent =
      realTotalPages > 1
        ? Math.round((currentPage / (realTotalPages - 1)) * 100)
        : 0;

    setBooks((prev) =>
      prev.map((item) =>
        item.id === book.id
          ? {
              ...item,
              currentPage,
              scrollPercent: currentPagePercent,
            }
          : item
      )
    );
  }

  setSettings({
    ...settings,
    readingMode: nextMode,
  });
};

// Função para alternar modo de simplificação, que pode solicitar ao backend a simplificação do texto caso ainda não tenha sido feita, e mantém o estado de simplificação para mostrar o texto simplificado quando disponível
const handleToggleSimplification = async () => {
  if (!book) return;

  if (isSimplifiedMode) {
    setIsSimplifiedMode(false);
    return;
  }

  const currentPageAlreadyHasSimplifiedText = book.blocks?.some(
  (block) =>
    (block.page ?? 1) === currentPdfPage &&
    block.simplifiedText &&
    !block.simplifiedText.startsWith("[Simplificado]")
);

if (currentPageAlreadyHasSimplifiedText) {
  setIsSimplifiedMode(true);
  return;
}

  try {
    setIsSimplifying(true);

   const response = await fetch(
    `http://localhost:3001/documents/${book.id}/simplify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page: currentPdfPage,
      }),
    }
  );

    if (!response.ok) {
      throw new Error("Erro ao simplificar texto");
    }

    const updatedBook = await response.json();

    setBooks((prev) =>
      prev.map((item) => (item.id === book.id ? updatedBook : item))
    );

    setIsSimplifiedMode(true);
  } catch (error) {
    console.error("Erro ao simplificar texto:", error);
  } finally {
    setIsSimplifying(false);
  }
};








  return (
    <div className={`min-h-screen transition-smooth ${themeClasses[settings.contrast]}`}>
      {isRestoringPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4">
              Restaurando leitura...
            </p>
          </div>
        </div>
      )}

      {isSimplifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className={`flex flex-col items-center gap-4 px-8 py-6 rounded-2xl shadow-lg border ${panelClasses[settings.contrast]}`}>
            <Sparkles size={32} className="animate-pulse" />

            <div className="text-center">
              <p className="font-semibold text-lg">Simplificando texto...</p>
              <p className="text-sm opacity-70 mt-1">
                Isso pode levar alguns segundos.
              </p>
            </div>
          </div>
        </div>
      )}

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

            <button
              onClick={handleToggleSimplification}
              disabled={isSimplifying}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${btnClasses[settings.contrast]} rounded-lg transition-smooth disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <Sparkles size={16} />
              {isSimplifying
                ? "Simplificando..."
                : isSimplifiedMode
                  ? "Voltar para original"
                  : "Simplificar"}
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

           {/* Texto estruturado do documento */}

            {book?.blocks && book.blocks.length > 0 ? (

             <div className="space-y-5">

             {visibleBlocks.map((block, i) => {
              const textToRender =
                isSimplifiedMode && block.simplifiedText
                  ? block.simplifiedText
                  : block.originalText;

              const shouldBeHeading = shouldRenderBlockAsHeading(
                block,
                i,
                visibleBlocks
              );

              const titleIndex = displayBlocks
                .slice(0, displayBlocks.findIndex((item) => item.order === block.order) + 1)
                .filter((item) => item.type === "title").length;

                if (shouldBeHeading) {
                  if (titleIndex === 1) {
                    return (
                      <h1
                        key={i}
                        style={getBlockStyle(1.7)}
                        className="text-center mb-8 font-bold"
                      >
                        {renderTextWithReferences(textToRender)}
                      </h1>
                    );
                  }

                  return (
                    <h2
                      key={i}
                      style={getBlockStyle(1.25)}
                      className="text-center mb-4 font-semibold"
                    >
                      {renderTextWithReferences(textToRender)}
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
                      {renderTextWithReferences(textToRender)}
                    </p>
                  );
                }

                return (
                  <p
                    key={i}
                    style={getBlockStyle(1)}
                    className="text-justify mb-6"
                  >
                    {renderTextWithReferences(textToRender)}
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
                    { val: "Lexend", label: "Lexend" },
                    { val: "Atkinson Hyperlegible", label: "Atkinson Hyperlegible" },
                    { val: "Verdana", label: "Verdana" },

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
                    onClick={() => changeReadingMode("page")} 
                    className={`px-3 py-2 rounded-md border text-sm transition-smooth ${
                      settings.readingMode === "page"
                        ? `border-current ${accent} font-semibold`
                        : "border-current/20 opacity-60"
                    }`}
                  >
                    Página
                  </button>

                  <button
                    onClick={() => changeReadingMode("scroll")}
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
