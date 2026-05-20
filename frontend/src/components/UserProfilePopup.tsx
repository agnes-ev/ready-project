import { useState, useRef } from "react";
import { User, BookOpen, Camera, LogOut, Pencil, Check, X  } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Book } from "@/context/BooksContext";


interface UserProfilePopupProps {
  userName: string;
  displayName?: string;
  avatarUrl?: string | null;
  booksReadCount: number;
  favoriteBooks?: Book[];
  onLogout: () => void;
  onDeleteAccount: () => void;
  onUpdateUserName: (newName: string) => void;
  onUpdateAvatar: (avatarUrl: string) => void;
}

const UserProfilePopup = ({
  userName,
  displayName,
  avatarUrl,
  booksReadCount,
  favoriteBooks,
  onLogout,
  onDeleteAccount,
  onUpdateUserName,
  onUpdateAvatar,
}: UserProfilePopupProps) => {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(userName);
  const [isSavingName, setIsSavingName] = useState(false);

 // Função para lidar com a mudança da foto de perfil
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];

  if (!file) return;

  try {
    const token = localStorage.getItem("ready_token");

    if (!token) {
      throw new Error("Usuário não autenticado.");
    }

    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch("http://localhost:3001/auth/avatar", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao atualizar foto.");
    }

    localStorage.setItem("ready_user", JSON.stringify(data.user));

    onUpdateAvatar(data.user.avatarUrl);
  } catch (error) {
    console.error("Erro ao atualizar foto:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Erro ao atualizar foto."
    );
  } finally {
    e.target.value = "";
  }
};

// Função para lidar com a edição do nome de usuário
const handleSaveName = async () => {
  const trimmedName = editedName.trim();

  if (!trimmedName) return;

  try {
    setIsSavingName(true);

    const token = localStorage.getItem("ready_token");

    if (!token) {
      throw new Error("Usuário não autenticado.");
    }

    const response = await fetch("http://localhost:3001/auth/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: trimmedName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao atualizar nome.");
    }

    localStorage.setItem("ready_user", JSON.stringify(data.user));

    onUpdateUserName(data.user.name);

    setIsEditingName(false);
  } catch (error) {
    console.error("Erro ao atualizar nome:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Erro ao atualizar nome."
    );
  } finally {
    setIsSavingName(false);
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
          <span className="hidden sm:inline">{displayName ?? userName}</span>
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

            <div className="text-center w-full">
              {isEditingName ? (
                <div className="flex items-center justify-center gap-2">
                  <input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-36 px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none"
                    autoFocus
                  />

                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="p-2 rounded-lg text-emerald-500 hover:bg-secondary transition-smooth disabled:opacity-60"
                  >
                    <Check size={16} />
                  </button>


                  <button
                    type="button"
                    onClick={() => {
                      setEditedName(userName);
                      setIsEditingName(false);
                    }}
                    disabled={isSavingName}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-smooth disabled:opacity-60"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <p className="font-bold text-foreground text-lg">{userName}</p>

                  <button
                    type="button"
                    onClick={() => {
                      setEditedName(userName);
                      setIsEditingName(true);
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-center gap-3">
            <BookOpen size={20} className="text-primary" />
            <div>
              <span className="text-2xl font-bold text-foreground">{booksReadCount}</span>
              <span className="text-sm text-muted-foreground ml-1.5">livros lidos na sua biblioteca</span>
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
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
          >
            <LogOut size={16} />
            Sair da conta
          </button>

          {/*Apagar conta*/}
          <button
            onClick={onDeleteAccount}
            className="text-sm text-destructive hover:underline"
          >
            Excluir conta
          </button>

        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfilePopup;