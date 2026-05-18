import { BookOpen, FileText, Plus, X, Pencil, Trash2, Check, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import UserProfilePopup from "@/components/UserProfilePopup";
import { useBooks, type Book } from "@/context/BooksContext";


const Library = () => {

  const { books, setBooks } = useBooks();
  const libraryBooks = books.filter((book) => !book.temporary);
  const [showUpload, setShowUpload] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isUploadHovered, setIsUploadHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);


// Função para iniciar a edição do título do livro
const startEdit = (book: Book) => {
  setEditingId(book.id);
  setEditingTitle(book.title);
};

// Função para salvar a edição do título do livro
 const saveEdit = async () => {
  if (!editingId) return;

  const trimmed = editingTitle.trim();

  if (trimmed.length === 0) {
    setEditingId(null);
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3001/documents/${editingId}/title`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmed,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao atualizar título");
    }

    setBooks((prev) =>
      prev.map((book) =>
        book.id === editingId ? { ...book, title: trimmed } : book
      )
    );

    setEditingId(null);
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar o novo título");
  }
};

// Função para lidar com a exclusão de um livro da biblioteca
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Tem certeza que deseja apagar este livro da biblioteca?" );

    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3001/documents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao apagar livro");
      }

      setBooks((prev) => prev.filter((book) => book.id !== id));
    } catch (error) {
      console.error(error);
      alert("Erro ao apagar livro");
    }
  };

useEffect(() => {
  const loadDocuments = async () => {
    try {
      setIsLoadingBooks(true);
      
      const response = await fetch("http://localhost:3001/documents");

      if (!response.ok) {
        throw new Error("Erro ao buscar documentos");
      }

      const data = await response.json();

      setBooks(data);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setIsLoadingBooks(false);
    }
  };

  loadDocuments();
}, [setBooks]);

// Função para lidar com o upload do arquivo PDF, enviar para o backend e atualizar a biblioteca com os dados retornados
 const handleFileUpload = async (file: File) => {
  try {

    setIsUploading(true);

    const formData = new FormData();
    formData.append("pdf", file);

    const response = await fetch("http://localhost:3001/upload-pdf", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Erro ao enviar PDF para o backend");
    }

    const data = await response.json();

 // Adicionar à biblioteca o livro salvo no banco
    const savedBook: Book = {
      id: data.id,
      title:  file.name.replace(/\.pdf$/i, ""),
      progress: data.progress ?? 0,
      favorite: data.favorite ?? false,
      blocks: data.blocks ?? [],
    };

    setBooks((prev) => [savedBook, ...prev]);
    setShowUpload(false);
  } catch (error) {
    console.error(error);
    alert("Erro ao processar PDF");
  } finally {
    setIsUploading(false);
  }
};

// Função para mover o livro selecionado para o topo da lista quando o usuário clicar em "Continuar leitura"
  const moveBookToTop = async (id: string) => {
  try {
    await fetch(`http://localhost:3001/documents/${id}/open`, {
      method: "PATCH",
    });

    setBooks((prev) => {
      const selectedBook = prev.find((book) => book.id === id);
      const otherBooks = prev.filter((book) => book.id !== id);

      return selectedBook ? [selectedBook, ...otherBooks] : prev;
    });
  } catch (error) {
    console.error("Erro ao atualizar último acesso:", error);
  }
};

// Função para alternar o status de favorito do livro
const toggleFavorite = async (id: string, currentFavorite: boolean) => {
  const nextFavorite = !currentFavorite;

  try {
    const response = await fetch(`http://localhost:3001/documents/${id}/favorite`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        favorite: nextFavorite,
      }),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar favorito");
    }

    setBooks((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, favorite: nextFavorite } : item
      )
    );
  } catch (error) {
    console.error(error);
    alert("Erro ao atualizar favorito");
  }
};


  return (
    <div className="min-h-screen bg-background">

      {/* Tela de carregamento durante o processamento do PDF */}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card border border-border rounded-2xl shadow-smooth px-8 py-6 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />

            <div>
              <p className="font-semibold text-foreground">
                Processando PDF...
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Isso pode levar alguns segundos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-card/50 backdrop-blur-md border-b border-border sticky top-0 z-10">
        <div className="w-full pl-6 pr-6 h-16 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-smooth">
            <img src="/Logo/logo2-v3.png" alt="Logo" className="w-14 h-15 object-contain" />
            <span className="font-bold text-foreground tracking-tight mt-2 text-4xl">Read.y</span>
          </Link>

          <div className="flex items-center gap-4 mr-2">
           <UserProfilePopup
              userName="Usuário"
              booksReadCount={libraryBooks.filter((book) => book.progress >= 100).length}
              favoriteBooks={libraryBooks.filter((book) => book.favorite)}
           />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Minha Biblioteca</h1>
            <p className="text-muted-foreground mt-1">{libraryBooks.length} livros</p>
          </div>

          {libraryBooks.length > 0 && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-smooth"
          >
            <Plus size={18} />
            Adicionar livro
          </button>
          )}

        </div>

        {/* Upload modal inline */}
        {showUpload && (
          <div
            className="relative bg-card p-10 rounded-3xl shadow-smooth border-2 border-dashed transition-smooth cursor-pointer"
            style={{
              borderColor: isUploadHovered ? '#87ceeb' : 'rgba(97,218,251,0.67)'
            }}
            onMouseEnter={() => setIsUploadHovered(true)}
            onMouseLeave={() => setIsUploadHovered(false)}
          >
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

       {isLoadingBooks ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4">
              Carregando biblioteca...
            </p>
          </div>
        ) : libraryBooks.length === 0 ? (
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

            {/* favoritar livro*/}
            {libraryBooks.map((book) => (
              <div key={book.id} className="flex items-center gap-3">
                <button
                 onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  toggleFavorite(book.id, Boolean(book.favorite));
}}
                  aria-label={book.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  className="shrink-0 p-2 rounded-full text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10 transition-smooth"
                >
                  <Star
                    size={22}
                    className={
                      book.favorite
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }
                  />
                </button>

                 {/* Editar e apagar livro */}
                <div
                  className="flex-1 bg-card rounded-2xl p-6 flex items-center justify-between border-2 border-transparent hover:border-primary/40 transition-smooth"
                >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    {editingId === book.id ? (
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="font-semibold text-foreground bg-background border-2 border-primary/40 rounded-md px-2 py-1 outline-none focus:border-primary transition-smooth"
                      />
                    ) : (
                      <h3 className="font-semibold text-foreground">{book.title}</h3>
                    )}

                    <div className="flex items-center gap-3 mt-1">
                      <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-smooth"
                          style={{ width: `${book.progress ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {book.progress ?? 0}%
                      </span>
                    </div>
                  </div>
                </div>
                  <div className="flex items-center gap-3 ml-auto">
                   {editingId === book.id ? (
                    <button 
                      onClick={saveEdit} 
                      aria-label="Salvar nome" 
                      className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-smooth"
                    >
                     <Check size={18} />

                    </button>
                  ) : (
                    <button 
                     onClick={() => startEdit(book)} 
                     aria-label="Editar nome do livro"
                     className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-smooth"
                    >
                     <Pencil size={18} />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(book.id)}
                    aria-label="Apagar livro"
                    className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth"
                  >
                    <Trash2 size={18} />
                  </button>

                <Link
                  to={`/reader/${book.id}`}
                  onClick={() => moveBookToTop(book.id)}
                  className="px-5 py-2.5 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-smooth"
                >
                  Continuar leitura
                </Link>
                </div>
              </div>
             </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Library;