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
  type: "plasa" | "bono" | "escala" | "cardapio";
  category?: "oficial" | "praca"; // Apenas para escalas
  active: boolean;
  uploadDate: Date;
}

export interface DutyOfficer {
  id: number;
  name: string;
  role: "oficial_dia" | "contramestre_pernoite";
  rank: string;
  active: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface DisplayContextType {
  notices: Notice[];
  plasaDocuments: PDFDocument[];
  escalaDocuments: PDFDocument[];
  activePlasaDoc: PDFDocument | null;
  activeEscalaDoc: PDFDocument | null;
  currentEscalaIndex: number;
  currentPlasaIndex: number;
  documentAlternateInterval: number;
  scrollSpeed: "slow" | "normal" | "fast";
  autoRestartDelay: number;
  isLoading: boolean;
  advanceToNextPlasaDocument: () => void;
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
  const [currentPlasaIndex, setCurrentPlasaIndex] = useState(0);
  const [documentAlternateInterval, setDocumentAlternateInterval] = useState(30000);
  const [scrollSpeed, setScrollSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [autoRestartDelay, setAutoRestartDelay] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  // Ref para o timer de alternância
  const escalaTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(true);

  // Função para obter URL completa do backend
  const getBackendUrl = (path: string): string => {
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path;
    }
    
    const currentHost = window.location.hostname;
    
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      console.log(`🌐 DisplayContext: Detectado acesso via rede: ${currentHost}`);
      
      if (path.startsWith('/')) {
        return `http://${currentHost}:5000${path}`;
      }
      return `http://${currentHost}:5000/${path}`;
    }
    
    const isReplit = currentHost.includes('replit.dev') || currentHost.includes('replit.co');
    
    if (isReplit) {
      const currentOrigin = window.location.origin;
      console.log(`🌐 DisplayContext Backend URL (Replit): ${currentOrigin}`);
      
      if (path.startsWith('/')) {
        return `${currentOrigin}${path}`;
      }
      return `${currentOrigin}/${path}`;
    } else {
      console.log(`🌐 DisplayContext Backend URL (Local): localhost:5000`);
      
      if (path.startsWith('/')) {
        return `http://localhost:5000${path}`;
      }
      return `http://localhost:5000/${path}`;
    }
  };

  // Função para gerar ID único
  const generateUniqueId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Função para normalizar URLs existentes para o ambiente atual
  const normalizeDocumentUrl = (url: string): string => {
    if (!url) return url;
    
    if (url.includes('localhost:')) {
      const pathMatch = url.match(/\/uploads\/.*$/);
      if (pathMatch) {
        return getBackendUrl(pathMatch[0]);
      }
    }
    
    return url;
  };

  // Conversão de aviso do servidor para local
  const convertServerNoticeToLocal = (serverNotice: any): Notice => {
    return {
      id: String(serverNotice.id), 
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

  const convertLocalNoticeToServer = (localNotice: Omit<Notice, "id" | "createdAt" | "updatedAt">): any => {
    console.log("🔄 Convertendo aviso para formato do servidor:", localNotice);
    
    return {
      title: localNotice.title.trim(),
      content: localNotice.content.trim(),
      priority: localNotice.priority,
      startDate: localNotice.startDate.toISOString(),
      endDate: localNotice.endDate.toISOString(),
      active: localNotice.active !== false
    };
  };

  // Carregar avisos do servidor
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
      }
    } catch (error) {
      console.error("❌ Erro de conexão com servidor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh avisos
  const refreshNotices = async (): Promise<void> => {
    await loadNoticesFromServer();
  };

  // Criar aviso no servidor
  const addNotice = async (noticeData: Omit<Notice, "id" | "createdAt" | "updatedAt">): Promise<boolean> => {
    try {
      console.log("📢 Criando aviso no servidor:", noticeData.title);
      setIsLoading(true);
      
      const serverData = convertLocalNoticeToServer(noticeData);
      const backendUrl = getBackendUrl('/api/notices');
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(serverData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
        
      const result = await response.json();
      
      if (result.success && result.notice) {
        const newNotice = convertServerNoticeToLocal(result.notice);
        setNotices(prev => [...prev, newNotice]);
        
        console.log(`✅ Aviso criado no servidor: ${newNotice.id}`);
        return true;
      } else {
        throw new Error(result.error || 'Resposta inválida do servidor');
      }
    } catch (error) {
      console.error("❌ Erro ao criar aviso:", error);
      
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

  // Atualizar aviso no servidor
  const updateNotice = async (updatedNotice: Notice): Promise<boolean> => {
    try {
      console.log("📝 Atualizando aviso no servidor:", updatedNotice.id);
      setIsLoading(true);
      
      const stringId = String(updatedNotice.id);
      
      if (stringId.startsWith('local-')) {
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
      
      setNotices(prev => prev.map(notice => 
        notice.id === updatedNotice.id ? updatedNotice : notice
      ));
      console.log("⚠️ Aviso atualizado apenas localmente devido a erro no servidor");
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Deletar aviso do servidor
  const deleteNotice = async (id: string): Promise<boolean> => {
    try {
      console.log("🗑️ Deletando aviso do servidor:", id);
      setIsLoading(true);
      
      const stringId = String(id);
      
      if (stringId.startsWith('local-')) {
        setNotices(prev => prev.filter(notice => String(notice.id) !== stringId));
        console.log("🗑️ Aviso local removido");
        return true;
      }
      
      const response = await fetch(getBackendUrl(`/api/notices/${id}`), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          setNotices(prev => prev.filter(notice => String(notice.id) !== stringId));
          
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
      
      const stringId = String(id);
      setNotices(prev => prev.filter(notice => String(notice.id) !== stringId));
      console.log("⚠️ Aviso removido apenas localmente devido a erro no servidor");
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função addDocument
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

    if (docData.type === "plasa" || docData.type === "bono") {
      setPlasaDocuments(prev => {
        const exists = prev.some(doc => doc.url === fullUrl || doc.url === docData.url);
        if (exists) {
          console.log("📄 Documento PLASA/BONO já existe, ignorando:", fullUrl);
          return prev;
        }
        
        console.log(`📄 Adicionando novo ${docData.type.toUpperCase()}:`, newDoc.title);
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
    if (updatedDoc.type === "plasa" || updatedDoc.type === "bono") {
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
    console.log("🗑️ Removendo do estado:", id);
    
    setPlasaDocuments(prev => prev.filter(doc => doc.id !== id));
    setEscalaDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  // Computed values com alternância automática
  const activePlasaDocuments = plasaDocuments.filter(doc => doc.active);
  const activePlasaDoc = activePlasaDocuments.length > 0 
    ? activePlasaDocuments[currentPlasaIndex % activePlasaDocuments.length]
    : null;

  const activeEscalaDocuments = escalaDocuments.filter(doc => doc.active);
  const activeEscalaDoc = activeEscalaDocuments.length > 0 
    ? activeEscalaDocuments[currentEscalaIndex % activeEscalaDocuments.length]
    : null;

  // Effect para alternância automática entre PLASA e BONO - SEM TIMER AUTOMÁTICO
  useEffect(() => {
    if (activePlasaDocuments.length <= 1) {
      setCurrentPlasaIndex(0);
      return;
    }

    console.log(`📋 ${activePlasaDocuments.length} documentos PLASA/BONO disponíveis:`, 
      activePlasaDocuments.map(d => `${d.type.toUpperCase()}: ${d.title}`)
    );

    return () => {
      // Cleanup se necessário
    };
  }, [activePlasaDocuments.length]);

  // 🔥 FUNÇÃO PARA AVANÇAR PARA PRÓXIMO DOCUMENTO PLASA/BONO
  const advanceToNextPlasaDocument = () => {
    if (activePlasaDocuments.length > 1) {
      setCurrentPlasaIndex(prev => {
        const nextIndex = (prev + 1) % activePlasaDocuments.length;
        console.log(`🔄 PLASA/BONO concluído - Avançando para: ${nextIndex + 1}/${activePlasaDocuments.length}`, {
          atual: activePlasaDocuments[prev]?.title,
          proximo: activePlasaDocuments[nextIndex]?.title,
          tipo: activePlasaDocuments[nextIndex]?.type
        });
        return nextIndex;
      });
    }
  };

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
        currentPlasaIndex,
        activePlasa: activePlasaDoc?.title || 'nenhum',
        activeEscala: activeEscalaDoc?.title || 'nenhum',
        activeEscalaCategory: activeEscalaDoc?.category || 'sem categoria',
        noticesTotal: notices.length,
        noticesAtivos: notices.filter(n => n.active).length,
        noticesFromServer: notices.filter(n => !String(n.id).startsWith('local-')).length,
        noticesLocal: notices.filter(n => String(n.id).startsWith('local-')).length
      });
    }
  }, [plasaDocuments, escalaDocuments, activePlasaDoc, activeEscalaDoc, currentEscalaIndex, currentPlasaIndex, notices]);

  // Persistir documentos no localStorage
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
        currentPlasaIndex,
        documentAlternateInterval,
        scrollSpeed,
        autoRestartDelay,
        lastUpdate: new Date().toISOString(),
        version: '3.1'
      };
      
      localStorage.setItem('display-context', JSON.stringify(contextData, null, 2));
      
      console.log("💾 Contexto salvo no localStorage:", {
        plasa: plasaDocuments.length,
        escala: escalaDocuments.length,
        escalaIndex: currentEscalaIndex,
        plasaIndex: currentPlasaIndex
      });
      
    } catch (error) {
      console.error("❌ Erro ao salvar contexto:", error);
    }
  }, [plasaDocuments, escalaDocuments, currentEscalaIndex, currentPlasaIndex, documentAlternateInterval, scrollSpeed, autoRestartDelay]);

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
              const filename = serverDoc.filename.toLowerCase();
              
              const isPlasa = serverDoc.type === 'plasa' || 
                             filename.includes('plasa');
              
              const isBono = serverDoc.type === 'bono' || 
                            filename.includes('bono') ||
                            filename.includes('bno');
              
              const isEscala = serverDoc.type === 'escala' || 
                              filename.includes('escala');
              
              const isCardapio = serverDoc.type === 'cardapio' || 
                                filename.includes('cardapio') ||
                                filename.includes('cardápio');
              
              console.log(`🔍 Analisando arquivo: ${serverDoc.filename}`, {
                isPlasa,
                isBono,
                isEscala,
                isCardapio,
                serverType: serverDoc.type
              });
              
              const category = determineCategory(serverDoc.filename);
              
              let docType: "plasa" | "bono" | "escala" | "cardapio" = 'escala';
              let docTitle = `Documento - ${new Date(serverDoc.created).toLocaleDateString('pt-BR')}`;
              
              // PRIORIDADE: BONO > PLASA > CARDAPIO > ESCALA
              if (isBono) {
                docType = 'bono';
                docTitle = `BONO - ${new Date(serverDoc.created).toLocaleDateString('pt-BR')}`;
              } else if (isPlasa) {
                docType = 'plasa';
                docTitle = `PLASA - ${new Date(serverDoc.created).toLocaleDateString('pt-BR')}`;
              } else if (isCardapio) {
                docType = 'cardapio';
                docTitle = `Cardápio - ${new Date(serverDoc.created).toLocaleDateString('pt-BR')}`;
              } else if (isEscala) {
                docType = 'escala';
                docTitle = `Escala - ${new Date(serverDoc.created).toLocaleDateString('pt-BR')}`;
              } else {
                if (filename.includes('plasa')) {
                  docType = 'plasa';
                  docTitle = `PLASA - ${new Date(serverDoc.created).toLocaleDateString('pt-BR')}`;
                } else if (filename.includes('bono') || filename.includes('bno')) {
                  docType = 'bono';
                  docTitle = `BONO - ${new Date(serverDoc.created).toLocaleDateString('pt-BR')}`;
                }
              }
              
              const docData: Omit<PDFDocument, "id" | "uploadDate"> = {
                title: docTitle,
                url: fullUrl,
                type: docType,
                category: (docType === 'escala') ? category : undefined,
                active: true
              };
              
              console.log(`📁 Auto-adicionando documento do servidor:`, {
                filename: serverDoc.filename,
                detectedType: docType,
                title: docTitle,
                category: docData.category
              });
              
              addDocument(docData);
            }
          });
        }
      }
    } catch (error) {
      console.log("⚠️ Erro ao carregar documentos do servidor:", error);
    }
  };

  // Inicialização robusta
  useEffect(() => {
    const initializeContext = async () => {
      console.log("🚀 Inicializando DisplayContext...");
      
      try {
        const saved = localStorage.getItem('display-context');
        if (saved) {
          try {
            const data = JSON.parse(saved);
            console.log("📥 Dados encontrados no localStorage");

            if (data.plasaDocuments && Array.isArray(data.plasaDocuments)) {
              const validPlasaDocs = data.plasaDocuments
                .filter((doc: any) => doc && doc.id && doc.title && doc.url)
                .map((doc: any) => {
                  return {
                    ...doc,
                    url: normalizeDocumentUrl(doc.url),
                    uploadDate: new Date(doc.uploadDate),
                    active: doc.active !== false
                  };
                });
              
              if (validPlasaDocs.length > 0) {
                setPlasaDocuments(validPlasaDocs);
                console.log(`✅ ${validPlasaDocs.length} documentos PLASA carregados`);
              }
            }

            if (data.escalaDocuments && Array.isArray(data.escalaDocuments)) {
              const validEscalaDocs = data.escalaDocuments
                .filter((doc: any) => doc && doc.id && doc.title && doc.url)
                .map((doc: any) => {
                  return {
                    ...doc,
                    url: normalizeDocumentUrl(doc.url),
                    uploadDate: new Date(doc.uploadDate),
                    active: doc.active !== false
                  };
                });
              
              if (validEscalaDocs.length > 0) {
                setEscalaDocuments(validEscalaDocs);
                console.log(`✅ ${validEscalaDocs.length} documentos Escala carregados`);
              }
            }

            if (typeof data.currentEscalaIndex === 'number') {
              setCurrentEscalaIndex(data.currentEscalaIndex);
            }
            if (typeof data.currentPlasaIndex === 'number') {
              setCurrentPlasaIndex(data.currentPlasaIndex);
            }
            if (data.documentAlternateInterval) setDocumentAlternateInterval(data.documentAlternateInterval);
            if (data.scrollSpeed) setScrollSpeed(data.scrollSpeed);
            if (data.autoRestartDelay) setAutoRestartDelay(data.autoRestartDelay);
          } catch (parseError) {
            console.warn("⚠️ Erro ao processar localStorage:", parseError);
            localStorage.removeItem('display-context');
          }
        }

        // Carregar avisos do servidor
        try {
          await loadNoticesFromServer();
        } catch (noticeError) {
          console.warn("⚠️ Falha ao carregar avisos do servidor:", noticeError);
        }
        
        // Carregar documentos do servidor (não bloqueante)
        setTimeout(() => {
          loadDocumentsFromServer().catch(error => {
            console.warn("⚠️ Falha ao carregar documentos do servidor:", error);
          });
        }, 1000);
        
      } catch (error) {
        console.error("❌ Erro na inicialização:", error);
        
        try {
          await loadNoticesFromServer();
        } catch (fallbackError) {
          console.error("❌ Falha total na inicialização:", fallbackError);
        }
      } finally {
        setTimeout(() => {
          isInitializingRef.current = false;
          console.log("✅ DisplayContext inicializado");
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

  // Effect para resetar índice quando não há documentos PLASA/BONO ativos
  useEffect(() => {
    if (activePlasaDocuments.length === 0) {
      setCurrentPlasaIndex(0);
    } else if (currentPlasaIndex >= activePlasaDocuments.length) {
      setCurrentPlasaIndex(0);
    }
  }, [activePlasaDocuments.length, currentPlasaIndex]);

  const value: DisplayContextType = {
    notices,
    plasaDocuments,
    escalaDocuments,
    activePlasaDoc,
    activeEscalaDoc,
    currentEscalaIndex,
    currentPlasaIndex,
    documentAlternateInterval,
    scrollSpeed,
    autoRestartDelay,
    isLoading,
    advanceToNextPlasaDocument,
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