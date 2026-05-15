import { useState, useRef } from "react";
import { User, BookOpen, Camera, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "react-router-dom";
import type { Book } from "@/context/BooksContext";


interface UserProfilePopupProps {
  userName: string;
  booksReadCount: number;
  favoriteBooks?: Book[];
}

const UserProfilePopup = ({
  userName,
  booksReadCount,
  favoriteBooks = [],
}: UserProfilePopupProps) => {

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


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
        <button className="flex items-center gap-3 text-base text-muted-foreground hover:text-foreground transition-smooth cursor-pointer">
          <Avatar className="h-11 w-11">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
            <AvatarFallback className="bg-primary/10 text-primary">
              <User size={24} />
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
            <h3 className="text-sm font-semibold text-foreground">
              Favoritos
            </h3>

            <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
              {favoriteBooks.length > 0 ? (
                favoriteBooks.map((book) => (
                  <div
                    key={book.id}
                    className="px-3 py-2 rounded-xl bg-secondary/60 text-sm text-foreground"
                  >
                    {book.title}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum livro favoritado ainda.
                </p>
              )}
            </div>
          </div>

          {/*Logout*/}
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
          >
            <LogOut size={16} />
            Sair da conta
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfilePopup;