import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDisplay } from "@/context/DisplayContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const IS_DEV_MODE = process.env.NODE_ENV === 'development';

// Configurar PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

// Interface para debug info
interface DebugInfo {
  error?: string;
  suggestion?: string;
  details?: string;
  timestamp?: string;
  troubleshooting?: string[];
}

interface PDFViewerProps {
  documentType: "plasa" | "escala";
  title: string;
  scrollSpeed?: "slow" | "normal" | "fast";
  autoRestartDelay?: number;
}

// Classe para controlar o scroll automático contínuo
class ContinuousAutoScroller {
  private isScrolling: boolean = false;
  private animationId: number | null = null;
  private currentPosition: number = 0;
  private speed: number = 1;
  private container: HTMLElement | null = null;
  private onCompleteCallback?: () => void;
  private fixedMaxScroll: number = 0;

  constructor(
    container: HTMLElement,
    speed: number = 1,
    onComplete?: () => void
  ) {
    this.container = container;
    this.speed = speed;
    this.onCompleteCallback = onComplete;
  }

  start() {
    if (!this.container || this.isScrolling) return;

    this.isScrolling = true;
    this.currentPosition = 0;
    
    this.fixedMaxScroll = this.container.scrollHeight - this.container.clientHeight;
    
    console.log(`📜 Documento: Iniciando scroll - Total: ${this.container.scrollHeight}px, Visível: ${this.container.clientHeight}px, Para rolar: ${this.fixedMaxScroll}px`);
    
    if (this.fixedMaxScroll <= 0) {
      console.log("⚠️ Documento: Não há conteúdo suficiente para scroll");
      this.stop();
      return;
    }

    this.container.scrollTop = 0;
    this.currentPosition = 0;
    this.scroll();
  }

  private scroll = () => {
    if (!this.isScrolling || !this.container) return;

    const maxScroll = this.fixedMaxScroll;
    
    if (this.currentPosition < maxScroll - 10) {
      this.currentPosition += this.speed;
      this.container.scrollTop = this.currentPosition;
      this.animationId = requestAnimationFrame(this.scroll);
    } else {
      this.container.scrollTop = maxScroll;
      console.log(`✅ Documento: Scroll completo até o final`);
      
      setTimeout(() => {
        this.stop();
        this.onCompleteCallback?.();
      }, 2000);
    }
  };

  stop() {
    this.isScrolling = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  reset() {
    this.stop();
    if (this.container) {
      this.container.scrollTop = 0;
      this.currentPosition = 0;
    }
  }

  setSpeed(newSpeed: number) {
    this.speed = newSpeed;
  }

  get isActive() {
    return this.isScrolling;
  }
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  documentType, 
  title, 
  scrollSpeed = "normal",
  autoRestartDelay = 3
}) => {
  // Estados do contexto
  const { 
    activeEscalaDoc, 
    activePlasaDoc, 
    currentEscalaIndex, 
    escalaDocuments,
    advanceToNextPlasaDocument
  } = useDisplay();
  
  // Estados locais
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isAutomationPaused, setIsAutomationPaused] = useState(false);
  const [savedPageUrls, setSavedPageUrls] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [escalaImageUrl, setEscalaImageUrl] = useState<string | null>(null);

  // Refs
  const scrollerRef = useRef<ContinuousAutoScroller | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Configurações
  const getScrollSpeed = () => {
    switch (scrollSpeed) {
      case "slow": return 1;
      case "fast": return 5;
      default: return 3; // normal
    }
  };

  const SCROLL_SPEED = getScrollSpeed();
  const RESTART_DELAY = autoRestartDelay * 1000;
  const PDF_SCALE = 1.5;

  // Função para obter a URL completa do servidor backend
  const getBackendUrl = (path: string): string => {
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path;
    }
    
    const currentHost = window.location.hostname;
    
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      console.log(`🌐 PDFViewer: Detectado acesso via rede: ${currentHost}`);
      
      if (path.startsWith('/')) {
        return `http://${currentHost}:5000${path}`;
      }
      return `http://${currentHost}:5000/${path}`;
    }
    
    const isReplit = currentHost.includes('replit.dev') || currentHost.includes('replit.co');
    
    if (isReplit) {
      const currentOrigin = window.location.origin;
      console.log(`🌐 PDFViewer Backend URL (Replit): ${currentOrigin}`);
      
      if (path.startsWith('/')) {
        return `${currentOrigin}${path}`;
      }
      return `${currentOrigin}/${path}`;
    } else {
      console.log(`🌐 PDFViewer Backend URL (Local): localhost:5000`);
      
      if (path.startsWith('/')) {
        return `http://localhost:5000${path}`;
      }
      return `http://localhost:5000/${path}`;
    }
  };

  // Função para gerar ID do documento
  const generateDocumentId = (url: string): string => {
    return url.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'default';
  };

  // Verificar se é arquivo de imagem
  const isImageFile = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  // 🔥 UNIFICADO: Verificar páginas existentes (PLASA/BONO)
  const checkExistingPages = async (totalPages: number, documentId: string, docType: string = 'plasa'): Promise<string[]> => {
    try {
      const response = await fetch(getBackendUrl('/api/check-document-pages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          totalPages, 
          documentId, 
          documentType: docType 
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`🔍 ${docType.toUpperCase()}: Verificação de cache:`, {
          documentId,
          allExist: result.allPagesExist,
          totalPages: result.totalPages,
          urls: result.pageUrls?.length || 0
        });
        
        return result.allPagesExist ? result.pageUrls : [];
      }
    } catch (error) {
      console.log(`⚠️ ${docType.toUpperCase()}: Erro ao verificar cache:`, error);
    }
    return [];
  };

  // 🔥 UNIFICADO: Upload de página (PLASA/BONO)
  const uploadPageToServer = async (imageBlob: Blob, pageNumber: number, documentId: string, docType: string = 'plasa'): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, `${docType}-${documentId}-page-${pageNumber}.jpg`);
      formData.append('pageNumber', pageNumber.toString());
      formData.append('documentId', documentId);
      formData.append('documentType', docType);

      const response = await fetch(getBackendUrl('/api/upload-document-page'), {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`💾 ${docType.toUpperCase()}: Página ${pageNumber} salva no servidor:`, result.data.filename);
        return getBackendUrl(result.data.url);
      } else {
        console.error(`❌ ${docType.toUpperCase()}: Falha ao salvar página ${pageNumber}`);
      }
    } catch (error) {
      console.error(`❌ ${docType.toUpperCase()}: Erro ao salvar página ${pageNumber}:`, error);
    }
    return null;
  };

  // 🔥 UNIFICADO: Converter PDF para imagens (PLASA/BONO)
  const convertPDFToImages = async (pdfUrl: string, docType: string = 'plasa') => {
    try {
      setLoading(true);
      setLoadingProgress(0);
      console.log(`🎯 ${docType.toUpperCase()}: Processando documento:`, pdfUrl);

      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
        
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      let pdfData: ArrayBuffer;
      
      if (pdfUrl.startsWith('blob:')) {
        const response = await fetch(pdfUrl);
        pdfData = await response.arrayBuffer();
      } else {
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(`Erro ao buscar PDF: ${response.status}`);
        }
        pdfData = await response.arrayBuffer();
      }

      if (pdfData.byteLength < 100) {
        console.log(`❌ ${docType.toUpperCase()}: Arquivo muito pequeno ou inválido`);
        setDebugInfo({
          error: "Arquivo PDF inválido ou muito pequeno",
          suggestion: "Verifique se o arquivo foi enviado corretamente"
        });
        setTotalPages(1);
        setLoading(false);
        return;
      }
      
      console.log(`✅ ${docType.toUpperCase()}: PDF válido detectado, iniciando processamento...`);
      
      const loadingTask = window.pdfjsLib.getDocument({
        data: pdfData,
        verbosity: 0,
        disableAutoFetch: true,
        disableStream: true,
        disableRange: true,
        stopAtErrors: false,
        maxImageSize: 1024 * 1024 * 10,
        isEvalSupported: false,
        fontExtraProperties: false,
        useSystemFonts: false,
        standardFontDataUrl: null
      });
      
      const pdf = await loadingTask.promise;
      console.log(`📄 ${docType.toUpperCase()}: PDF carregado com sucesso: ${pdf.numPages} páginas`);
      setTotalPages(pdf.numPages);
      
      const docId = generateDocumentId(pdfUrl);
      const existingPages = await checkExistingPages(pdf.numPages, docId, docType);
      if (existingPages.length === pdf.numPages) {
        console.log(`💾 ${docType.toUpperCase()}: Usando ${pdf.numPages} páginas já convertidas`);
        setSavedPageUrls(existingPages);
        setLoading(false);
        pdf.destroy();
        return;
      }

      console.log(`🖼️ ${docType.toUpperCase()}: Convertendo páginas para imagens...`);
      const imageUrls: string[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          console.log(`📄 ${docType.toUpperCase()}: Processando página ${pageNum}/${pdf.numPages}`);
          setLoadingProgress((pageNum / pdf.numPages) * 100);
          
          const page = await pdf.getPage(pageNum);
          
          const originalViewport = page.getViewport({ scale: 1.0 });
          const scale = Math.min(PDF_SCALE, 2048 / Math.max(originalViewport.width, originalViewport.height));
          const viewport = page.getViewport({ scale: scale });

          console.log(`📐 ${docType.toUpperCase()}: Página ${pageNum} - Original: ${originalViewport.width}x${originalViewport.height}, Escala: ${scale}, Final: ${viewport.width}x${viewport.height}`);

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', { 
            alpha: false,
            willReadFrequently: false
          })!;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            intent: 'display',
            enableWebGL: false,
            renderInteractiveForms: false,
            optionalContentConfigPromise: null
          };

          await page.render(renderContext).promise;

          const imageBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
              resolve(blob!);
            }, 'image/jpeg', 0.85);
          });

          const serverUrl = await uploadPageToServer(imageBlob, pageNum, docId, docType);
          
          if (serverUrl) {
            imageUrls.push(serverUrl);
            console.log(`✅ ${docType.toUpperCase()}: Página ${pageNum} processada e salva`);
          } else {
            const localUrl = URL.createObjectURL(imageBlob);
            imageUrls.push(localUrl);
            console.log(`⚠️ ${docType.toUpperCase()}: Página ${pageNum} salva apenas localmente`);
          }

          page.cleanup();

        } catch (pageError) {
          console.error(`❌ ${docType.toUpperCase()}: Erro na página ${pageNum}:`, pageError);
        }
      }

      pdf.destroy();
      setSavedPageUrls(imageUrls);
      setLoading(false);
      setLoadingProgress(100);

      console.log(`✅ ${docType.toUpperCase()}: Conversão completa - ${imageUrls.length}/${pdf.numPages} páginas processadas`);

    } catch (error) {
      console.error(`❌ ${docType.toUpperCase()}: Erro na conversão:`, error);
      setLoading(false);
      setDebugInfo({
        error: `Erro ao processar ${docType.toUpperCase()}`,
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toLocaleTimeString(),
        troubleshooting: [
          "1. Verifique se o servidor backend está funcionando",
          "2. Confirme se o arquivo foi enviado corretamente",
          "3. Tente usar uma imagem (JPG/PNG) ao invés de PDF",
          "4. Verifique o console do navegador (F12) para mais detalhes"
        ]
      });
    }
  };

  // Função para obter escala atual
  const getCurrentEscalaDoc = useCallback(() => {
    const activeEscalas = escalaDocuments.filter(doc => doc.active);
    return activeEscalas.length > 0 ? activeEscalas[currentEscalaIndex % activeEscalas.length] : null;
  }, [escalaDocuments, currentEscalaIndex]);

  // Converter escala PDF para imagem
  const convertEscalaPDFToImage = async (pdfUrl: string) => {
    try {
      setLoading(true);
      console.log("🖼️ ESCALA: Convertendo PDF para imagem única...");

      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
        
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Erro ao buscar PDF: ${response.status}`);
      }
      
      const pdfData = await response.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: pdfData }).promise;
      
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      canvas.toBlob((blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          setEscalaImageUrl(imageUrl);
          console.log("✅ ESCALA: Imagem convertida com sucesso");
        }
        setLoading(false);
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error("❌ ESCALA: Erro na conversão:", error);
      setLoading(false);
    }
  };

  // Limpar timers
  const clearAllTimers = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    
    if (scrollerRef.current) {
      scrollerRef.current.stop();
      scrollerRef.current = null;
    }
    
    setIsScrolling(false);
  }, []);

  // Callback quando scroll completa
  const handleScrollComplete = useCallback(() => {
    console.log(`✅ Documento visualizado completamente`);
    setIsScrolling(false);
    
    // Avançar para próximo documento PLASA/BONO
    if (documentType === "plasa") {
      console.log("🔄 Avançando para próximo documento PLASA/BONO...");
      advanceToNextPlasaDocument();
    }
    
    if (!isAutomationPaused) {
      restartTimerRef.current = setTimeout(() => {
        if (!isAutomationPaused) {
          startContinuousScroll();
        }
      }, RESTART_DELAY);
    }
  }, [isAutomationPaused, RESTART_DELAY, documentType, advanceToNextPlasaDocument]);

  // Iniciar scroll contínuo
  const startContinuousScroll = useCallback(() => {
    if (documentType !== "plasa" || !containerRef.current || savedPageUrls.length === 0 || isAutomationPaused) {
      return;
    }

    if (scrollerRef.current && scrollerRef.current.isActive) {
      scrollerRef.current.stop();
      scrollerRef.current = null;
    }

    const container = containerRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;
    
    if (maxScroll <= 0) {
      setTimeout(() => {
        if (!isAutomationPaused) {
          startContinuousScroll();
        }
      }, 2000);
      return;
    }

    container.scrollTop = 0;
    setIsScrolling(true);

    scrollerRef.current = new ContinuousAutoScroller(
      container,
      SCROLL_SPEED,
      handleScrollComplete
    );

    setTimeout(() => {
      if (scrollerRef.current && !isAutomationPaused) {
        scrollerRef.current.start();
      }
    }, 1000);
  }, [documentType, savedPageUrls.length, isAutomationPaused, handleScrollComplete, SCROLL_SPEED]);

  // CORREÇÃO: INICIALIZAR PLASA/BONO com processamento unificado
  useEffect(() => {
    if (documentType === "plasa") {
      console.log("🔄 PLASA/BONO Effect triggered:", {
        isScrolling,
        activePlasaDoc: activePlasaDoc?.id,
        url: activePlasaDoc?.url,
        type: activePlasaDoc?.type
      });

      if (isScrolling) return;
      
      if (!activePlasaDoc || !activePlasaDoc.url) {
        console.log("❌ PLASA/BONO: Nenhum documento ativo encontrado");
        setLoading(false);
        setSavedPageUrls([]);
        setDebugInfo({
          error: "Nenhum documento PLASA/BONO ativo",
          suggestion: "Adicione um PLASA ou BONO no painel administrativo."
        });
        return;
      }
      
      setSavedPageUrls([]);
      setIsAutomationPaused(false);
      clearAllTimers();
      setDebugInfo({});

      const docUrl = getBackendUrl(activePlasaDoc.url);
      const docType = activePlasaDoc.type; // 'plasa' ou 'bono'
      
      console.log(`🎯 ${docType.toUpperCase()}: Processando documento:`, docUrl);
      
      if (isImageFile(docUrl) || (docUrl.startsWith('blob:') && activePlasaDoc.title.match(/\.(jpg|jpeg|png|gif|webp)$/i))) {
        console.log(`🖼️ ${docType.toUpperCase()}: Documento é uma imagem, usando diretamente`);
        setSavedPageUrls([docUrl]);
        setTotalPages(1);
        setLoading(false);
      } else {
        console.log(`📄 ${docType.toUpperCase()}: Documento é um PDF, convertendo para imagens`);
        convertPDFToImages(docUrl, docType);
      }
    }

    return () => {
      if (documentType === "plasa") {
        clearAllTimers();
      }
    };
  }, [documentType, activePlasaDoc?.id, activePlasaDoc?.url, activePlasaDoc?.type]);

  // CORREÇÃO: Inicializar ESCALA com monitoramento do índice de alternância
  useEffect(() => {
    if (documentType === "escala") {
      const currentEscala = getCurrentEscalaDoc();
      
      console.log("🔄 ESCALA Effect triggered:", {
        currentEscalaIndex,
        totalActiveEscalas: escalaDocuments.filter(d => d.active).length,
        currentEscala: currentEscala?.title,
        category: currentEscala?.category,
        url: currentEscala?.url,
        id: currentEscala?.id 
      });
      
      setEscalaImageUrl(null);
      setLoading(false);
      setTotalPages(1);
      
      if (currentEscala?.url) {
        const docUrl = getBackendUrl(currentEscala.url);
        console.log("🖼️ ESCALA: Processando URL:", docUrl);
        
        const isPDF = docUrl.toLowerCase().includes('.pdf') || currentEscala.title.toLowerCase().includes('.pdf');
        
        if (isPDF) {
          console.log("📄 ESCALA: É um PDF, convertendo para imagem...");
          convertEscalaPDFToImage(docUrl);
        } else {
          console.log("🖼️ ESCALA: É uma imagem, usando diretamente");
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, [documentType, currentEscalaIndex, escalaDocuments]);

  // Inicializar scroll quando páginas estão prontas
  useEffect(() => {
    if (documentType === "plasa" && savedPageUrls.length > 0 && !loading && !isScrolling) {
      console.log(`🚀 PLASA/BONO: Iniciando automação com ${savedPageUrls.length} páginas`);
      setTimeout(startContinuousScroll, 2000);
    }
  }, [documentType, savedPageUrls.length, loading, isScrolling, startContinuousScroll]);

  // Atualizar velocidade do scroller
  useEffect(() => {
    if (scrollerRef.current && scrollerRef.current.isActive) {
      scrollerRef.current.setSpeed(SCROLL_SPEED);
    }
  }, [SCROLL_SPEED]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
      savedPageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      if (escalaImageUrl && escalaImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(escalaImageUrl);
      }
    };
  }, [clearAllTimers, savedPageUrls, escalaImageUrl]);

  // Controles
  const toggleAutomation = () => {
    setIsAutomationPaused(!isAutomationPaused);
    if (!isAutomationPaused) {
      clearAllTimers();
    } else {
      setTimeout(startContinuousScroll, 500);
    }
  };

  const restartScroll = () => {
    clearAllTimers();
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    setTimeout(startContinuousScroll, 1000);
  };

  // Renderização
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-white text-sm">
            {documentType === "plasa" ? "Processando PLASA/BONO..." : "Carregando Escala..."}
          </p>
          {loadingProgress > 0 && (
            <div className="w-64 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      );
    }

    if (debugInfo.error) {
      return (
        <div className="p-4 text-white">
          <h3 className="font-bold text-red-400 mb-2">❌ {debugInfo.error}</h3>
          {debugInfo.suggestion && (
            <p className="text-gray-300 mb-2">{debugInfo.suggestion}</p>
          )}
          {debugInfo.details && (
            <p className="text-xs text-gray-400 mb-2">Detalhes: {debugInfo.details}</p>
          )}
          {debugInfo.troubleshooting && (
            <div className="mt-4">
              <p className="font-semibold text-yellow-400 mb-2">💡 Soluções:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
                {debugInfo.troubleshooting.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (documentType === "plasa" && savedPageUrls.length > 0) {
      return (
        <div className="h-full relative">
          <div 
            ref={containerRef}
            className="h-full overflow-y-auto scrollbar-hide"
            style={{ scrollBehavior: 'auto' }}
          >
            <div className="space-y-1">
              {savedPageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Página ${index + 1}`}
                  className="w-full block"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                  onLoad={() => {
                    console.log(`🖼️ PLASA/BONO: Página ${index + 1} carregada`);
                  }}
                  onError={(e) => {
                    console.error(`❌ PLASA/BONO: Erro ao carregar página ${index + 1}`);
                  }}
                />
              ))}
            </div>
          </div>
          
    
        </div>
      );
    }

    if (documentType === "escala") {
      const currentEscala = getCurrentEscalaDoc();
      
      if (!currentEscala) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <h3 className="text-lg font-semibold mb-2">📋 Nenhuma Escala Ativa</h3>
              <p className="text-gray-300">Adicione uma escala no painel administrativo.</p>
            </div>
          </div>
        );
      }

      const docUrl = getBackendUrl(currentEscala.url);
      const isPDF = docUrl.toLowerCase().includes('.pdf');
      
      if (isPDF && escalaImageUrl) {
        return (
          <div className="h-full flex items-center justify-center bg-gray-900">
            <img
              src={escalaImageUrl}
              alt={currentEscala.title}
              className="max-w-full max-h-full object-contain"
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
          </div>
        );
      } else if (!isPDF) {
        return (
          <div className="h-full flex items-center justify-center bg-gray-900">
            <img
              src={docUrl}
              alt={currentEscala.title}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                console.error("❌ ESCALA: Erro ao carregar imagem:", docUrl);
              }}
            />
          </div>
        );
      }
    }

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white">
          <h3 className="text-lg font-semibold mb-2">📄 Nenhum Documento</h3>
          <p className="text-gray-300">
            {documentType === "plasa" 
              ? "Adicione um PLASA ou BONO no painel administrativo." 
              : "Adicione uma escala no painel administrativo."}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center justify-between">
          <span>
            {documentType === "plasa" 
              ? `📄 ${activePlasaDoc?.type?.toUpperCase() || 'PLASA'}: ${activePlasaDoc?.title || 'Nenhum documento'}` 
              : `📋 ${title}: ${getCurrentEscalaDoc()?.title || 'Nenhuma escala'}`}
          </span>
          {documentType === "plasa" && totalPages > 1 && (
            <span className="text-xs text-gray-400">
              {totalPages} página{totalPages !== 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-4rem)]">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default PDFViewer;