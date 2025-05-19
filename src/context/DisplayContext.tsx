
import React, { createContext, useState, useContext, useEffect } from "react";

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: "high" | "medium" | "low";
  startDate: Date;
  endDate: Date;
  active: boolean;
}

export interface PDFDocument {
  id: string;
  title: string;
  url: string;
  type: "plasa" | "escala";
  uploadDate: Date;
  active: boolean;
}

interface DisplayContextType {
  notices: Notice[];
  plasaDocuments: PDFDocument[];
  escalaDocuments: PDFDocument[];
  activePlasaDoc: PDFDocument | null;
  activeEscalaDoc: PDFDocument | null;
  pageChangeInterval: number;
  setPageChangeInterval: (interval: number) => void;
  addNotice: (notice: Omit<Notice, "id">) => void;
  updateNotice: (notice: Notice) => void;
  deleteNotice: (id: string) => void;
  addDocument: (doc: Omit<PDFDocument, "id" | "uploadDate">) => void;
  updateDocument: (doc: PDFDocument) => void;
  deleteDocument: (id: string) => void;
  getActiveNotices: () => Notice[];
}

const DisplayContext = createContext<DisplayContextType | undefined>(undefined);

// Sample data for development
const sampleNotices: Notice[] = [
  {
    id: "1",
    title: "Manutenção do Sistema",
    content: "O sistema estará em manutenção hoje das 18:00 às 20:00.",
    priority: "high",
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000), // 1 day from now
    active: true
  },
  {
    id: "2",
    title: "Nova Escala de Serviço",
    content: "A nova escala de serviço para Agosto foi publicada.",
    priority: "medium",
    startDate: new Date(),
    endDate: new Date(Date.now() + 604800000), // 1 week from now
    active: true
  },
  {
    id: "3",
    title: "Alteração de Procedimento",
    content: "Novos procedimentos para requisição de férias em vigor a partir de segunda-feira.",
    priority: "low",
    startDate: new Date(),
    endDate: new Date(Date.now() + 1209600000), // 2 weeks from now
    active: true
  }
];

// Add more sample notices to demonstrate rotation
for (let i = 4; i <= 10; i++) {
  sampleNotices.push({
    id: i.toString(),
    title: `Aviso ${i}`,
    content: `Conteúdo do aviso ${i} para demonstração.`,
    priority: i % 3 === 0 ? "high" : i % 3 === 1 ? "medium" : "low",
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000 * i),
    active: true
  });
}

const sampleDocuments: PDFDocument[] = [
  {
    id: "plasa1",
    title: "PLASA - Maio 2025",
    url: "https://lovable.dev/placeholder.pdf", // Placeholder URL
    type: "plasa",
    uploadDate: new Date(),
    active: true
  },
  {
    id: "escala1",
    title: "Escala de Serviço - Maio 2025",
    url: "https://lovable.dev/placeholder.pdf", // Placeholder URL
    type: "escala",
    uploadDate: new Date(),
    active: true
  }
];

export const DisplayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notices, setNotices] = useState<Notice[]>(sampleNotices);
  const [documents, setDocuments] = useState<PDFDocument[]>(sampleDocuments);
  const [pageChangeInterval, setPageChangeInterval] = useState<number>(10000); // 10 seconds default
  
  const plasaDocuments = documents.filter(doc => doc.type === "plasa");
  const escalaDocuments = documents.filter(doc => doc.type === "escala");
  
  const activePlasaDoc = plasaDocuments.find(doc => doc.active) || null;
  const activeEscalaDoc = escalaDocuments.find(doc => doc.active) || null;

  const addNotice = (notice: Omit<Notice, "id">) => {
    const newNotice = {
      ...notice,
      id: Date.now().toString()
    };
    setNotices(prev => [...prev, newNotice]);
  };

  const updateNotice = (updatedNotice: Notice) => {
    setNotices(prev => 
      prev.map(notice => 
        notice.id === updatedNotice.id ? updatedNotice : notice
      )
    );
  };

  const deleteNotice = (id: string) => {
    setNotices(prev => prev.filter(notice => notice.id !== id));
  };

  const addDocument = (doc: Omit<PDFDocument, "id" | "uploadDate">) => {
    const newDoc = {
      ...doc,
      id: Date.now().toString(),
      uploadDate: new Date()
    };
    setDocuments(prev => [...prev, newDoc]);
  };

  const updateDocument = (updatedDoc: PDFDocument) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === updatedDoc.id ? updatedDoc : doc
      )
    );
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const getActiveNotices = (): Notice[] => {
    const now = new Date();
    return notices.filter(notice => 
      notice.active && 
      notice.startDate <= now && 
      notice.endDate >= now
    );
  };

  return (
    <DisplayContext.Provider
      value={{
        notices,
        plasaDocuments,
        escalaDocuments,
        activePlasaDoc,
        activeEscalaDoc,
        pageChangeInterval,
        setPageChangeInterval,
        addNotice,
        updateNotice,
        deleteNotice,
        addDocument,
        updateDocument,
        deleteDocument,
        getActiveNotices
      }}
    >
      {children}
    </DisplayContext.Provider>
  );
};

export const useDisplay = (): DisplayContextType => {
  const context = useContext(DisplayContext);
  if (context === undefined) {
    throw new Error("useDisplay must be used within a DisplayProvider");
  }
  return context;
};
