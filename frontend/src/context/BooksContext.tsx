import { createContext, useContext, useState, ReactNode } from "react";

export interface BookBlock {
  id?: string;
  documentId?: string;
  order: number;
  type: string;
  originalText: string;
  simplifiedText?: string | null;
  page: number | null;
  sourceType: string | null;
}

export interface Book {
  id: string;
  title: string;
  progress: number;
  file?: File;
  temporary?: boolean;
  favorite?: boolean;
  blocks?: BookBlock[];
  currentPage?: number;
  scrollPercent?: number;
  
}

interface BooksContextType {
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}

const BooksContext = createContext<BooksContextType | undefined>(undefined);

const initialBooks: Book[] = [];

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