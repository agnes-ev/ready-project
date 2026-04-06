import { BookOpen, FileText, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Avatar } from "@radix-ui/react-avatar";
import UserProfilePopup from "@/components/UserProfilePopup";

interface Book {
  id: string;
  title: string;
  progress: number;
}

const initialBooks: Book[] = [
  { id: "1", title: "Introdução à Psicologia Cognitiva", progress: 45 },
  { id: "2", title: "Design Universal para Aprendizagem", progress: 12 },
  { id: "3", title: "Neurociência e Educação Inclusiva", progress: 78 },
];

const Library = () => {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [showUpload, setShowUpload] = useState(false);

  const handleFileUpload = (file: File) => {
    const newBook: Book = {
      id: String(Date.now()),
      title: file.name.replace(/\.pdf$/i, ""),
      progress: 0,
    };
    setBooks([...books, newBook]);
    setShowUpload(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-md border-b border-border sticky top-0 z-10">
        <div className="w-full pl-6 pr-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-smooth">
            <img src="/Logo/logo2-v3.png" alt="Logo" className="w-14 h-15 object-contain" />
            <span className="font-bold text-foreground tracking-tight mt-2 text-4xl">Read.y</span>
          </Link>
          <div className="flex items-center gap-4">
            <UserProfilePopup userName="Usuário" booksReadCount={3} />
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Sair
            </Link>
          </div>
      

        
       
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Minha Biblioteca</h1>
            <p className="text-muted-foreground mt-1">{books.length} livros</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-smooth"
          >
            <Plus size={18} />
            Adicionar livro
          </button>
        </div>

        {/* Upload modal inline */}
        {showUpload && (
          <div className="relative bg-card p-10 rounded-3xl shadow-smooth border-2 border-dashed border-border hover:border-primary/40 transition-smooth cursor-pointer">
            <button
              onClick={() => setShowUpload(false)}
              className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-full transition-smooth z-10"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
            <input
              type="file"
              accept=".pdf"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
                <FileText size={28} />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Arraste seu PDF aqui</p>
                <p className="text-sm text-muted-foreground">ou clique para explorar arquivos</p>
              </div>
            </div>
          </div>
        )}

        {books.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <BookOpen size={48} className="mx-auto text-muted-foreground/40" />
            <p className="text-lg text-muted-foreground">
              Sua estante está limpa. Que tal começar um novo livro hoje?
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-smooth"
            >
              Adicionar primeiro livro
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-card shadow-smooth rounded-2xl p-6 flex items-center justify-between hover:shadow-focus transition-smooth"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{book.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-smooth"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {book.progress}%
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  to="/reader"
                  className="px-5 py-2.5 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-smooth"
                >
                  Continuar leitura
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Library;
