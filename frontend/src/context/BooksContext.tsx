import { createContext, useContext, useState, ReactNode } from "react";

export interface BookBlock {
  order: number;
  type: string;
  originalText: string;
  page: number | null;
  sourceType: string;
}

export interface Book {
  id: string;
  title: string;
  progress: number;
  file?: File;
  temporary?: boolean;
  blocks?: BookBlock[];
}

interface BooksContextType {
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}

const BooksContext = createContext<BooksContextType | undefined>(undefined);

const initialBooks: Book[] = [
  {
    id: "1",
    title: "Carta ao Pai",
    progress: 45,
  },
  {
    id: "2",
    title: "A Hora da Estrela",
    progress: 12,
  },
  {
    id: "3",
    title: "O Pequeno Príncipe",
    progress: 78,
  },
];

export const BooksProvider = ({ children }: { children: ReactNode }) => {
  const [books, setBooks] = useState<Book[]>(initialBooks);

  return (
    <BooksContext.Provider value={{ books, setBooks }}>
      {children}
    </BooksContext.Provider>
  );
};

export const useBooks = () => {
  const context = useContext(BooksContext);

  if (!context) {
    throw new Error("useBooks must be used within BooksProvider");
  }

  return context;
};