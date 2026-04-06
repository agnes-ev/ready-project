import { useState, useRef } from "react";
import { User, BookOpen, Star, Edit2, Check, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TopBook {
  id: string;
  title: string;
}

const defaultTopBooks: TopBook[] = [
  { id: "1", title: "Introdução à Psicologia Cognitiva" },
  { id: "2", title: "Neurociência e Educação Inclusiva" },
  { id: "3", title: "Design Universal para Aprendizagem" },
];

interface UserProfilePopupProps {
  booksReadCount?: number;
  userName?: string;
}

const UserProfilePopup = ({ booksReadCount = 7, userName = "Usuário" }: UserProfilePopupProps) => {
  const [topBooks, setTopBooks] = useState<TopBook[]>(defaultTopBooks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEditing = (book: TopBook) => {
    setEditingId(book.id);
    setEditValue(book.title);
  };

  const saveEdit = (id: string) => {
    setTopBooks(topBooks.map((b) => (b.id === id ? { ...b, title: editValue } : b)));
    setEditingId(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth cursor-pointer">
          <Avatar className="h-8 w-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
            <AvatarFallback className="bg-primary/10 text-primary">
              <User size={18} />
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{userName}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl shadow-smooth border-border" align="end" sideOffset={8}>
        <div className="p-6 space-y-5">
          {/* User Info */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Avatar className="h-20 w-20 ring-4 ring-primary/10">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User size={36} />
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-smooth cursor-pointer"
              >
                <Camera size={20} className="text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-lg">{userName}</p>
              <p className="text-sm text-muted-foreground">Leitor dedicado</p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-center gap-3">
            <BookOpen size={20} className="text-primary" />
            <div>
              <span className="text-2xl font-bold text-foreground">{booksReadCount}</span>
              <span className="text-sm text-muted-foreground ml-1.5">livros lidos</span>
            </div>
          </div>

          {/* Top 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-primary" />
              <h4 className="font-semibold text-foreground text-sm">Top 3 Livros</h4>
            </div>
            <div className="space-y-2">
              {topBooks.map((book, index) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border group"
                >
                  <span className="text-xs font-bold text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  {editingId === book.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 text-sm bg-secondary rounded-lg px-2 py-1 text-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(book.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => saveEdit(book.id)}
                        className="text-primary hover:text-primary/80 transition-smooth"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-foreground truncate">{book.title}</span>
                      <button
                        onClick={() => startEditing(book)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-smooth"
                      >
                        <Edit2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfilePopup;