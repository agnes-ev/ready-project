import { FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useRef } from "react";
import { useBooks } from "@/context/BooksContext";



const Index = () => {
  const navigate = useNavigate();
  const { setBooks } = useBooks();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

 const handleFileUpload = (file: File) => {
  const tempBook = {
    id: String(Date.now()),
    title: file.name.replace(/\.pdf$/i, ""),
    progress: 0,
    file,
    temporary: true,
  };

  setBooks((prev) => [...prev, tempBook]);

  navigate(`/reader/${tempBook.id}`);
};

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div>
          <div className="flex items-center justify-center gap-3">
            <img
              src="/Logo/logo-v3.png"
              alt="Logo"
              className=" size-64 w-50% h-auto "
              />

          <h1 className="text-8xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Garet', sans-serif" }}>
            Read.y
          </h1>
        </div>
          <p className="text-xl text-muted-foreground max-w-lg text-center leading-relaxed relative top-[-50px] relative left-[180px]">
            Plataforma de leitura adaptativa
          </p>
          <p className="text-sm font-medium tracking-widest uppercase text-primary relative top-[268px]">
            Transforme sua leitura
          </p>
        </div>

        {/* Dropzone de Upload */}

        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative bg-card p-12 rounded-3xl shadow-smooth border-2 border-dashed border-border hover:border-primary/40 transition-smooth cursor-pointer top-[-37px]"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />

          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-smooth">
              <FileText size={32} />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Arraste seu PDF aqui</p>
              <p className="text-sm text-muted-foreground">ou clique para explorar arquivos</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/login"
            className="px-8 py-4 bg-foreground text-background rounded-full font-medium hover:opacity-90 transition-smooth"
          >
            Entrar
          </Link>
          <Link
            to="/register"
            className="px-8 py-4 bg-card text-foreground rounded-full font-medium shadow-smooth hover:bg-secondary transition-smooth"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
