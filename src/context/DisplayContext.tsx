import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";

export interface Notice {
  id: string;
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
  id: string;
  title: string;
  url: string;
  type: "plasa" | "escala";
  category?: "oficial" | "praca" | undefined;
  uploadDate: Date;
  active: boolean;
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
  deleteNotice: (id: string) => Promise<boolean>;
  addDocument: (document: Omit<PDFDocument, "id" | "uploadDate">) => void;
  updateDocument: (document: PDFDocument) => void;
  deleteDocument: (id: string) => void;
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
  // Estados
  const [notices, setNotices] = useState<Notice[]>([]);
  const [plasaDocuments, setPlasaDocuments] = useState<PDFDocument[]>([]);
  const [escalaDocuments, setEscalaDocuments] = useState<PDFDocument[]>([]);
  const [currentEscalaIndex, setCurrentEscalaIndex] = useState(0);
  const [documentAlternateInterval, setDocumentAlternateInterval] = useState(30000);
  const [scrollSpeed, setScrollSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [autoRestartDelay, setAutoRestartDelay] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  // Ref para o timer de alternância
  const escalaTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(true);

  // CORREÇÃO: Função para obter URL completa do backend
  const getBackendUrl = (path: string): string => {
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path;
    }
    
    const backendPort = import.meta.env.VITE_BACKEND_PORT || '3001';
    const backendHost = import.meta.env.VITE_BACKEND_HOST || 'localhost';
    
    console.log(`🌐 Backend URL: ${backendHost}:${backendPort}`);
    
    if (path.startsWith('/')) {
      return `http://${backendHost}:${backendPort}${path}`;
    }
    
    return `http://${backendHost}:${backendPort}/${path}`;
  };

  // Função para gerar ID único
  const generateUniqueId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // CORREÇÃO: Conversão de aviso do servidor para local
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

  // CORREÇÃO: Conversão de aviso local para servidor (ESTAVA INCOMPLETA)
  const convertLocalNoticeToServer = (localNotice: Omit<Notice, "id" | "createdAt" | "updatedAt">): any => {
    return {
      title: localNotice.title,
      content: localNotice.content,
      priority: localNotice.priority,
      startDate: localNotice.startDate.toISOString(),
      endDate: localNotice.endDate.toISOString(),
      active: localNotice.active
    };
  };

  // CORREÇÃO: Carregar avisos do servidor com melhor tratamento de erro
  const loadNoticesFromServer = async (): Promise<void> => {
    try {
      console.log("📢 Carregando avisos do servidor...");
      setIsLoading(true);
      
      const backendUrl = getBackendUrl('/api/notices');
      console.log("📢 URL do backend:", backendUrl);
      
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log("📢 Resposta do servidor:", response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log("📢 Dados recebidos:", result);
        
        if (result.success && Array.isArray(result.notices)) {
          const serverNotices = result.notices.map(convertServerNoticeToLocal);
          
          console.log(`📢 ${serverNotices.length} avisos carregados do servidor`);
          setNotices(serverNotices);
        } else {
          console.warn("⚠️ Resposta inválida do servidor:", result);
          setNotices([]);
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ Erro ao carregar avisos: ${response.status} - ${errorText}`);
        // Manter avisos locais se servidor falhar
      }
    } catch (error) {
      console.error("❌ Erro na comunicação com servidor:", error);
      // Manter avisos locais se servidor falhar
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh avisos (função pública)
  const refreshNotices = async (): Promise<void> => {
    await loadNoticesFromServer();
  };

  // CORREÇÃO: Criar aviso no servidor com melhor tratamento de erro
  const addNotice = async (noticeData: Omit<Notice, "id" | "createdAt" | "updatedAt">): Promise<boolean> => {
    try {
      console.log("📢 Criando aviso no servidor:", noticeData.title);
      setIsLoading(true);
      
      const serverData = convertLocalNoticeToServer(noticeData);
      console.log("📢 Dados para enviar:", serverData);
      
      const backendUrl = getBackendUrl('/api/notices');
      console.log("📢 Enviando para:", backendUrl);
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(serverData)
      });
      
      console.log("📢 Resposta:", response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log("📢 Resultado:", result);
        
        if (result.success && result.notice) {
          const newNotice = convertServerNoticeToLocal(result.notice);
          setNotices(prev => [...prev, newNotice]);
          
          console.log(`✅ Aviso criado no servidor: ${newNotice.id}`);
          return true;
        } else {
          throw new Error(result.error || 'Resposta inválida do servidor');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error("❌ Erro HTTP:", response.status, errorData);
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Erro ao criar aviso:", error);
      
      // Fallback: adicionar localmente se servidor falhar
      const localNotice: Notice = {
        ...noticeData,
        id: `local-${generateUniqueId()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setNotices(prev => [...prev, localNotice]);
      console.log("⚠️ Aviso adicionado apenas localmente devido a erro no servidor");
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // CORREÇÃO: Atualizar aviso no servidor
  const updateNotice = async (updatedNotice: Notice): Promise<boolean> => {
    try {
      console.log("📝 Atualizando aviso no servidor:", updatedNotice.id);
      setIsLoading(true);
      
      // Se é um aviso local, não tentar atualizar no servidor
      if (updatedNotice.id.startsWith('local-')) {
        setNotices(prev => prev.map(notice => 
          notice.id === updatedNotice.id ? updatedNotice : notice
        ));
        console.log("📝 Aviso local atualizado");
        return true;
      }
      
      const serverData = convertLocalNoticeToServer(updatedNotice);
      
      const response = await fetch(getBackendUrl(`/api/notices/${updatedNotice.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(serverData)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.notice) {
          const updated = convertServerNoticeToLocal(result.notice);
          setNotices(prev => prev.map(notice => 
            notice.id === updated.id ? updated : notice
          ));
          
          console.log(`✅ Aviso atualizado no servidor: ${updated.id}`);
          return true;
        } else {
          throw new Error(result.error || 'Resposta inválida do servidor');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar aviso:", error);
      
      // Fallback: atualizar localmente se servidor falhar
      setNotices(prev => prev.map(notice => 
        notice.id === updatedNotice.id ? updatedNotice : notice
      ));
      console.log("⚠️ Aviso atualizado apenas localmente devido a erro no servidor");
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // CORREÇÃO: Deletar aviso do servidor
  const deleteNotice = async (id: string): Promise<boolean> => {
    try {
      console.log("🗑️ Deletando aviso do servidor:", id);
      setIsLoading(true);
      
      // Se é um aviso local, apenas remover localmente
      if (id.startsWith('local-')) {
        setNotices(prev => prev.filter(notice => notice.id !== id));
        console.log("🗑️ Aviso local removido");
        return true;
      }
      
      const response = await fetch(getBackendUrl(`/api/notices/${id}`), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          setNotices(prev => prev.filter(notice => notice.id !== id));
          
          console.log(`✅ Aviso deletado do servidor: ${id}`);
          return true;
        } else {
          throw new Error(result.error || 'Resposta inválida do servidor');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Erro ao deletar aviso:", error);
      
      // Fallback: remover localmente se servidor falhar
      setNotices(prev => prev.filter(notice => notice.id !== id));
      console.log("⚠️ Aviso removido apenas localmente devido a erro no servidor");
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função addDocument (mantida igual)
  const addDocument = (docData: Omit<PDFDocument, "id" | "uploadDate">) => {
    const fullUrl = getBackendUrl(docData.url);
    const id = generateUniqueId();
    
    const newDoc: PDFDocument = {
      ...docData,
      id,
      url: fullUrl,
      uploadDate: new Date()
    };

    console.log("📄 Adicionando documento:", {
      id: newDoc.id,
      title: newDoc.title,
      type: newDoc.type,
      category: newDoc.category,
      url: newDoc.url
    });

    if (docData.type === "plasa") {
      setPlasaDocuments(prev => {
        const exists = prev.some(doc => doc.url === fullUrl || doc.url === docData.url);
        if (exists) {
          console.log("📄 Documento PLASA já existe, ignorando:", fullUrl);
          return prev;
        }
        
        console.log("📄 Adicionando novo PLASA:", newDoc.title);
        return [...prev, newDoc];
      });
    } else {
      setEscalaDocuments(prev => {
        const exists = prev.some(doc => doc.url === fullUrl || doc.url === docData.url);
        if (exists) {
          console.log("📋 Documento Escala já existe, ignorando:", fullUrl);
          return prev;
        }
        
        console.log("📋 Adicionando nova Escala:", newDoc.title, "Categoria:", newDoc.category);
        const newList = [...prev, newDoc];
        
        const activeEscalas = newList.filter(doc => doc.active);
        if (activeEscalas.length === 1) {
          setCurrentEscalaIndex(0);
        }
        
        return newList;
      });
    }
  };

  const updateDocument = (updatedDoc: PDFDocument) => {
    console.log("📝 Atualizando documento:", updatedDoc.title);
    if (updatedDoc.type === "plasa") {
      setPlasaDocuments(prev => prev.map(doc => 
        doc.id === updatedDoc.id ? updatedDoc : doc
      ));
    } else {
      setEscalaDocuments(prev => prev.map(doc => 
        doc.id === updatedDoc.id ? updatedDoc : doc
      ));
    }
  };

  const deleteDocument = (id: string) => {
    console.log("🗑️ Removendo documento:", id);
    setPlasaDocuments(prev => prev.filter(doc => doc.id !== id));
    setEscalaDocuments(prev => {
      const newList = prev.filter(doc => doc.id !== id);
      const activeEscalas = newList.filter(doc => doc.active);
      if (activeEscalas.length === 0) {
        setCurrentEscalaIndex(0);
      } else if (currentEscalaIndex >= activeEscalas.length) {
        setCurrentEscalaIndex(0);
      }
      return newList;
    });
  };

  // Computed values com alternância automática para escalas
  const activePlasaDoc = plasaDocuments.find(doc => doc.active) || null;
  
  const activeEscalaDocuments = escalaDocuments.filter(doc => doc.active);
  const activeEscalaDoc = activeEscalaDocuments.length > 0 
    ? activeEscalaDocuments[currentEscalaIndex % activeEscalaDocuments.length] 
    : null;

  // Effect para alternar escalas automaticamente
  useEffect(() => {
    if (escalaTimerRef.current) {
      clearInterval(escalaTimerRef.current);
      escalaTimerRef.current = null;
    }

    if (activeEscalaDocuments.length > 1) {
      console.log(`🔄 Configurando alternância entre ${activeEscalaDocuments.length} escalas a cada ${documentAlternateInterval/1000}s`);
      
      escalaTimerRef.current = setInterval(() => {
        setCurrentEscalaIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % activeEscalaDocuments.length;
          console.log(`🔄 Alternando para escala ${nextIndex + 1}/${activeEscalaDocuments.length}: ${activeEscalaDocuments[nextIndex]?.title}`);
          return nextIndex;
        });
      }, documentAlternateInterval);
    } else if (activeEscalaDocuments.length === 1) {
      setCurrentEscalaIndex(0);
      console.log("📋 Apenas uma escala ativa, sem alternância");
    } else {
      console.log("📋 Nenhuma escala ativa");
    }

    return () => {
      if (escalaTimerRef.current) {
        clearInterval(escalaTimerRef.current);
        escalaTimerRef.current = null;
      }
    };
  }, [activeEscalaDocuments.length, documentAlternateInterval, escalaDocuments]);

  // Log das mudanças importantes
  useEffect(() => {
    if (!isInitializingRef.current) {
      console.log("📊 Estado do DisplayContext:", {
        plasaTotal: plasaDocuments.length,
        plasaAtivos: plasaDocuments.filter(d => d.active).length,
        escalaTotal: escalaDocuments.length,
        escalaAtivos: escalaDocuments.filter(d => d.active).length,
        currentEscalaIndex,
        activePlasa: activePlasaDoc?.title || 'nenhum',
        activeEscala: activeEscalaDoc?.title || 'nenhum',
        activeEscalaCategory: activeEscalaDoc?.category || 'sem categoria',
        noticesTotal: notices.length,
        noticesAtivos: notices.filter(n => n.active).length,
        noticesFromServer: notices.filter(n => !n.id.startsWith('local-')).length,
        noticesLocal: notices.filter(n => n.id.startsWith('local-')).length
      });
    }
  }, [plasaDocuments, escalaDocuments, activePlasaDoc, activeEscalaDoc, currentEscalaIndex, notices]);

  // CORREÇÃO: Persistir apenas documentos no localStorage (não avisos)
  useEffect(() => {
    if (isInitializingRef.current) {
      return;
    }

    try {
      const contextData = {
        plasaDocuments: plasaDocuments.map(doc => ({
          ...doc,
          uploadDate: doc.uploadDate.toISOString()
        })),
        escalaDocuments: escalaDocuments.map(doc => ({
          ...doc,
          uploadDate: doc.uploadDate.toISOString()
        })),
        currentEscalaIndex,
        documentAlternateInterval,
        scrollSpeed,
        autoRestartDelay,
        lastUpdate: new Date().toISOString(),
        version: '3.0' // Avisos agora no servidor
      };
      
      localStorage.setItem('display-context', JSON.stringify(contextData, null, 2));
      
      console.log("💾 Contexto salvo no localStorage (sem avisos):", {
        plasa: plasaDocuments.length,
        escala: escalaDocuments.length,
        escalaIndex: currentEscalaIndex
      });
      
    } catch (error) {
      console.error("❌ Erro ao salvar contexto:", error);
    }
  }, [plasaDocuments, escalaDocuments, currentEscalaIndex, documentAlternateInterval, scrollSpeed, autoRestartDelay]);

  // Função auxiliar para determinar categoria
  const determineCategory = (filename: string): "oficial" | "praca" | undefined => {
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.includes('oficial')) return 'oficial';
    if (lowerFilename.includes('praca')) return 'praca';
    return undefined;
  };

  // Função para carregar documentos do servidor
  const loadDocumentsFromServer = async () => {
    try {
      console.log("🔄 Carregando documentos do servidor...");
      const response = await fetch(getBackendUrl('/api/list-pdfs'));
      
      if (response.ok) {
        const result = await response.json();
        console.log("📄 Documentos do servidor:", result.documents?.length || 0);
        
        if (result.documents && result.documents.length > 0) {
          result.documents.forEach((serverDoc: any) => {
            const fullUrl = getBackendUrl(serverDoc.url);
            
            const existsInPlasa = plasaDocuments.some(doc => doc.url === fullUrl);
            const existsInEscala = escalaDocuments.some(doc => doc.url === fullUrl);
            
            if (!existsInPlasa && !existsInEscala) {
              const isPlasa = serverDoc.type === 'plasa' || 
                             serverDoc.filename.toLowerCase().includes('plasa');
              
              const category = determineCategory(serverDoc.filename);
              
              const docData: Omit<PDFDocument, "id" | "uploadDate"> = {
                title: `${isPlasa ? 'PLASA' : 'Escala'} - ${new Date(serverDoc.created).toLocaleDateString('pt-BR')}`,
                url: fullUrl,
                type: isPlasa ? 'plasa' : 'escala',
                category: isPlasa ? undefined : category,
                active: true
              };
              
              console.log("📁 Auto-adicionando documento do servidor:", docData.title);
              addDocument(docData);
            }
          });
        }
      }
    } catch (error) {
      console.log("⚠️ Erro ao carregar documentos do servidor:", error);
    }
  };

  // CORREÇÃO: Carregar do localStorage e servidor na inicialização
  useEffect(() => {
    const initializeContext = async () => {
      try {
        // Carregar documentos do localStorage
        const saved = localStorage.getItem('display-context');
        if (saved) {
          const data = JSON.parse(saved);
          console.log("📥 Carregando contexto do localStorage:", {
            plasa: Array.isArray(data.plasaDocuments) ? data.plasaDocuments.length : 'inválido',
            escala: Array.isArray(data.escalaDocuments) ? data.escalaDocuments.length : 'inválido',
            escalaIndex: data.currentEscalaIndex || 0,
            version: data.version || 'legacy'
          });

          // Carregar documentos PLASA
          if (data.plasaDocuments && Array.isArray(data.plasaDocuments)) {
            const validPlasaDocs = data.plasaDocuments.map((doc: any) => ({
              ...doc,
              url: getBackendUrl(doc.url),
              uploadDate: new Date(doc.uploadDate)
            }));
            setPlasaDocuments(validPlasaDocs);
          }

          // Carregar documentos Escala
          if (data.escalaDocuments && Array.isArray(data.escalaDocuments)) {
            const validEscalaDocs = data.escalaDocuments.map((doc: any) => ({
              ...doc,
              url: getBackendUrl(doc.url),
              uploadDate: new Date(doc.uploadDate)
            }));
            setEscalaDocuments(validEscalaDocs);
          }

          // Carregar outras configurações
          if (typeof data.currentEscalaIndex === 'number') {
            setCurrentEscalaIndex(data.currentEscalaIndex);
          }
          if (data.documentAlternateInterval) setDocumentAlternateInterval(data.documentAlternateInterval);
          if (data.scrollSpeed) setScrollSpeed(data.scrollSpeed);
          if (data.autoRestartDelay) setAutoRestartDelay(data.autoRestartDelay);
        }
        
        // NOVO: Carregar avisos do servidor
        await loadNoticesFromServer();
        
        // Carregar documentos do servidor
        setTimeout(() => {
          loadDocumentsFromServer();
        }, 1000);
        
      } catch (error) {
        console.error("❌ Erro ao carregar contexto:", error);
        localStorage.removeItem('display-context');
        
        // Mesmo com erro, tentar carregar avisos do servidor
        await loadNoticesFromServer();
        
        setTimeout(() => {
          loadDocumentsFromServer();
        }, 500);
      } finally {
        setTimeout(() => {
          isInitializingRef.current = false;
          console.log("✅ Inicialização completa");
        }, 2000);
      }
    };
    
    initializeContext();
  }, []);

  // Effect para resetar índice quando não há escalas ativas
  useEffect(() => {
    if (activeEscalaDocuments.length === 0) {
      setCurrentEscalaIndex(0);
    } else if (currentEscalaIndex >= activeEscalaDocuments.length) {
      setCurrentEscalaIndex(0);
    }
  }, [activeEscalaDocuments.length, currentEscalaIndex]);

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
    refreshNotices,
  };

  return (
    <DisplayContext.Provider value={value}>
      {children}
    </DisplayContext.Provider>
  );
};