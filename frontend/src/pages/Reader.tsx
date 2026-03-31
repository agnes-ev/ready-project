import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Sparkles, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";

const content = [
  "A leitura adaptativa é uma técnica que ajusta a apresentação do texto para facilitar a compreensão. Para pessoas com TDAH, parágrafos curtos reduzem a distração e ajudam a manter o foco no conteúdo essencial.\n\nEsta abordagem reconhece que cada leitor tem necessidades únicas. Ao personalizar o espaçamento, tamanho da fonte e contraste, criamos uma experiência de leitura que respeita o ritmo individual.",
  "A dislexia se beneficia de fontes com pesos diferenciados na base das letras. O espaçamento aumentado entre caracteres evita o efeito de 'aglomeração' visual que dificulta a decodificação.\n\nEstudos mostram que linhas mais curtas, com no máximo 65 caracteres, reduzem significativamente o esforço de leitura para pessoas com dislexia.",
  "O Modo Foco remove elementos da interface que competem pela atenção do usuário, deixando apenas o texto e a navegação essencial. Este modo é particularmente útil para leitores com TDAH.\n\nAo eliminar distrações visuais, o cérebro pode dedicar mais recursos cognitivos à compreensão do texto, melhorando a retenção de informações.",
  "A simplificação de texto utiliza técnicas de processamento de linguagem natural para reescrever parágrafos complexos em linguagem mais acessível.\n\nIsto não significa empobrecer o conteúdo, mas sim apresentá-lo de forma que respeite as diferentes formas de processamento cognitivo.",
  "A função de áudio complementa a leitura visual, ativando múltiplos canais sensoriais simultaneamente. Pesquisas indicam que a leitura multimodal melhora a compreensão em até 40%.\n\nCombinar texto visual com narração é especialmente eficaz para pessoas que processam informação de forma auditiva.",
];

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

const Reader = () => {
  const [settings, setSettings] = useState({
    fontSize: 18,
    lineHeight: 1.6,
    letterSpacing: 0,
    contrast: "default" as Contrast,
    focusMode: false,
    fontFamily: "Arial",
    bold: false,
    italic: false,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [showSettings, setShowSettings] = useState(true);

  const accent = accentBtnClasses[settings.contrast];

  return (
    <div className={`min-h-screen transition-smooth ${themeClasses[settings.contrast]}`}>
      {/* Header */}
      {!settings.focusMode && (
        <header className={`h-16 flex items-center justify-between px-8 border-b backdrop-blur-md sticky top-0 z-10 ${panelClasses[settings.contrast]}`}>
          <div className="flex items-center gap-4">
            <Link to="/library" className={`p-2 ${btnClasses[settings.contrast]} rounded-full transition-smooth`}>
              <ChevronLeft size={20} />
            </Link>
            <h1 className="font-medium text-sm tracking-tight uppercase opacity-60">
              Capítulo 1: Leitura Adaptativa
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
            {content[currentPage].split("\n\n").map((para, i) => (
              <p key={i} className="mb-8">
                {para}
              </p>
            ))}
          </div>

          {/* Page navigation */}
          <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 shadow-smooth rounded-full px-6 py-3 z-20 ${panelClasses[settings.contrast]}`}>
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              className={`p-2 ${btnClasses[settings.contrast]} rounded-full disabled:opacity-30 transition-smooth`}
              disabled={currentPage === 0}
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-sm font-medium tabular-nums">
              {currentPage + 1} / {content.length}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(content.length - 1, currentPage + 1))}
              className={`p-2 ${btnClasses[settings.contrast]} rounded-full disabled:opacity-30 transition-smooth`}
              disabled={currentPage === content.length - 1}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </main>

        {/* Settings panel */}
        {showSettings && !settings.focusMode && (
          <aside className={`fixed right-6 top-24 w-72 shadow-smooth rounded-2xl p-6 z-20 ${panelClasses[settings.contrast]}`}>
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-6">
              Acessibilidade
            </h3>

            <div className="space-y-7 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
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
                  max="32"
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
                    { val: 1.8, label: "M" },
                    { val: 2.2, label: "G" },
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
                  max="0.15"
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
