import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";

export interface Notice {
  id: number;
  title: string;
  content: string;
  priority: "high" | "medium" | "low";
  startDate: Date;
  endDate: Date;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PDFDocument {
  id: number;
  title: string;
  url: string;
  type: "plasa" | "bono" | "escala" | "cardapio";
  category?: "oficial" | "praca";
  active: boolean;
  uploadDate: Date;
}

interface DisplayContextType {
  notices: Notice[];
  plasaDocuments: PDFDocument[];
  escalaDocuments: PDFDocument[];
  activePlasaDoc: PDFDocument | null;
  activeEscalaDoc: PDFDocument | null;
  currentEscalaIndex: number;
  documentAlternateInterval: number;
  scrollSpeed: "slow" | "normal" | "fast";
  autoRestartDelay: number;
  isLoading: boolean;
  addNotice: (notice: Omit<Notice, "id" | "createdAt" | "updatedAt">) => Promise<boolean>;
  updateNotice: (notice: Notice) => Promise<boolean>;
  deleteNotice: (id: number) => Promise<boolean>;
  addDocument: (document: Omit<PDFDocument, "id" | "uploadDate">) => Promise<boolean>;
  updateDocument: (document: PDFDocument) => Promise<boolean>;
  deleteDocument: (id: number) => Promise<boolean>;
  setDocumentAlternateInterval: (interval: number) => void;
  setScrollSpeed: (speed: "slow" | "normal" | "fast") => void;
  setAutoRestartDelay: (delay: number) => void;
  refreshNotices: () => Promise<void>;
}

const DisplayContext = createContext<DisplayContextType | undefined>(undefined);

export const useDisplay = () => {
  const context = useContext(DisplayContext);
  if (!context) {
    throw new Error("useDisplay must be used within a DisplayProvider");
  }
  return context;
};

interface DisplayProviderProps {
  children: ReactNode;
}

export const DisplayProvider: React.FC<DisplayProviderProps> = ({ children }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [currentEscalaIndex, setCurrentEscalaIndex] = useState(0);
  const [documentAlternateInterval, setDocumentAlternateInterval] = useState(30000);
  const [scrollSpeed, setScrollSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [autoRestartDelay, setAutoRestartDelay] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  const escalaTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper functions
  const getApiUrl = (path: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}${path}`;
  };

  const convertServerNoticeToLocal = (serverNotice: any): Notice => {
    return {
      id: serverNotice.id,
      title: serverNotice.title,
      content: serverNotice.content,
      priority: serverNotice.priority,
      startDate: new Date(serverNotice.startDate),
      endDate: new Date(serverNotice.endDate),
      active: serverNotice.active,
      createdAt: serverNotice.createdAt ? new Date(serverNotice.createdAt) : undefined,
      updatedAt: serverNotice.updatedAt ? new Date(serverNotice.updatedAt) : undefined
    };
  };

  const convertServerDocumentToLocal = (serverDoc: any): PDFDocument => {
    return {
      id: serverDoc.id,
      title: serverDoc.title,
      url: serverDoc.url,
      type: serverDoc.type,
      category: serverDoc.category,
      active: serverDoc.active,
      uploadDate: new Date(serverDoc.uploadDate)
    };
  };

  // Load data from API
  const loadNoticesFromServer = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch(getApiUrl('/api/notices'));
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.notices)) {
          const serverNotices = result.notices.map(convertServerNoticeToLocal);
          setNotices(serverNotices);
        }
      }
    } catch (error) {
      console.error("Error loading notices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocumentsFromServer = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch(getApiUrl('/api/documents'));
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.documents)) {
          const serverDocuments = result.documents.map(convertServerDocumentToLocal);
          setDocuments(serverDocuments);
        }
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Public API functions
  const addNotice = async (noticeData: Omit<Notice, "id" | "createdAt" | "updatedAt">): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl('/api/notices'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeData)
      });
      
      if (response.ok) {
        await loadNoticesFromServer();
        return true;
      }
    } catch (error) {
      console.error("Error adding notice:", error);
    }
    return false;
  };

  const updateNotice = async (notice: Notice): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl(`/api/notices/${notice.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notice)
      });
      
      if (response.ok) {
        await loadNoticesFromServer();
        return true;
      }
    } catch (error) {
      console.error("Error updating notice:", error);
    }
    return false;
  };

  const deleteNotice = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl(`/api/notices/${id}`), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadNoticesFromServer();
        return true;
      }
    } catch (error) {
      console.error("Error deleting notice:", error);
    }
    return false;
  };

  const addDocument = async (documentData: Omit<PDFDocument, "id" | "uploadDate">): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl('/api/documents'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData)
      });
      
      if (response.ok) {
        await loadDocumentsFromServer();
        return true;
      }
    } catch (error) {
      console.error("Error adding document:", error);
    }
    return false;
  };

  const updateDocument = async (document: PDFDocument): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl(`/api/documents/${document.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(document)
      });
      
      if (response.ok) {
        await loadDocumentsFromServer();
        return true;
      }
    } catch (error) {
      console.error("Error updating document:", error);
    }
    return false;
  };

  const deleteDocument = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl(`/api/documents/${id}`), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadDocumentsFromServer();
        return true;
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
    return false;
  };

  const refreshNotices = async (): Promise<void> => {
    await loadNoticesFromServer();
  };

  // Computed values
  const plasaDocuments = documents.filter(doc => doc.type === "plasa" && doc.active);
  const escalaDocuments = documents.filter(doc => doc.type === "escala" && doc.active);
  
  const activePlasaDoc = plasaDocuments.length > 0 ? plasaDocuments[0] : null;
  const activeEscalaDoc = escalaDocuments.length > currentEscalaIndex ? escalaDocuments[currentEscalaIndex] : null;

  // Initialize data
  useEffect(() => {
    loadNoticesFromServer();
    loadDocumentsFromServer();
  }, []);

  // Escala rotation timer
  useEffect(() => {
    if (escalaDocuments.length > 1) {
      if (escalaTimerRef.current) {
        clearTimeout(escalaTimerRef.current);
      }
      
      escalaTimerRef.current = setTimeout(() => {
        setCurrentEscalaIndex((prev) => (prev + 1) % escalaDocuments.length);
      }, documentAlternateInterval);
    }

    return () => {
      if (escalaTimerRef.current) {
        clearTimeout(escalaTimerRef.current);
      }
    };
  }, [currentEscalaIndex, escalaDocuments.length, documentAlternateInterval]);

  const value: DisplayContextType = {
    notices,
    plasaDocuments,
    escalaDocuments,
    activePlasaDoc,
    activeEscalaDoc,
    currentEscalaIndex,
    documentAlternateInterval,
    scrollSpeed,
    autoRestartDelay,
    isLoading,
    addNotice,
    updateNotice,
    deleteNotice,
    addDocument,
    updateDocument,
    deleteDocument,
    setDocumentAlternateInterval,
    setScrollSpeed,
    setAutoRestartDelay,
    refreshNotices
  };

  return (
    <DisplayContext.Provider value={value}>
      {children}
    </DisplayContext.Provider>
  );
};