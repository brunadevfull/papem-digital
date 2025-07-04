/*
 * Sistema de Visualização da Marinha do Brasil
 * Painel Administrativo
 * 
 * Autor: 2SG Bruna Rocha
 * Marinha do Brasil
 */

import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDisplay, Notice, PDFDocument } from "@/context/DisplayContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import WeatherAlerts from "@/components/WeatherAlerts";
// Dados dos oficiais baseados no quadro acda Marinha

// ✅ FIXED: Import the correct data structures
import { 
  OFFICERS_LIST, 
  MASTERS_LIST, 
  type OfficerData, 
  type MasterData,
  RANK_DISPLAY_MAP,
  RANK_FULL_NAME_MAP
} from "@/data/officersData";

// ✅ FIXED: Create compatible data arrays for backward compatibility
const OFFICERS_DATA = OFFICERS_LIST.map(officer => ({
  name: officer.name,
  rank: officer.rank
}));

const MASTERS_DATA = MASTERS_LIST.map(master => ({
  name: master.name,
  rank: master.rank
}));

// ✅ FIXED: Define proper types for the component
interface MilitaryPersonnel {
  id: number;
  name: string;
  type: 'officer' | 'master';
  rank: string;
  fullRankName?: string;
  active?: boolean;
}





const Admin: React.FC = () => {
  const { 
    notices, 
    plasaDocuments, 
    escalaDocuments,
    addNotice,
    updateNotice,
    deleteNotice,
    addDocument,
    updateDocument,
    deleteDocument,
    documentAlternateInterval,
    setDocumentAlternateInterval,
    scrollSpeed,
    setScrollSpeed,
    autoRestartDelay,
    setAutoRestartDelay,
    isLoading,
    refreshNotices
  } = useDisplay();
  
  const { toast } = useToast();
  
  // Form states
  const [newNotice, setNewNotice] = useState<Omit<Notice, "id" | "createdAt" | "updatedAt">>({
    title: "",
    content: "",
    priority: "medium",
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000), // Default to 1 day
    active: true
  });
  
  // Estados para upload de documentos
  const [selectedDocType, setSelectedDocType] = useState<"plasa" | "escala" | "cardapio">("plasa");
  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docCategory, setDocCategory] = useState<"oficial" | "praca" | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Estados para oficiais de serviço
  const [dutyOfficers, setDutyOfficers] = useState({
    officerName: "",
    officerRank: "1t" as "1t" | "2t" | "ct",
    masterName: "",
    masterRank: "3sg" as "3sg" | "2sg" | "1sg"
  });
  const [isLoadingOfficers, setIsLoadingOfficers] = useState(false);

  // Estados para edição de militares - agora carregados da API

  const [dbOfficers, setDbOfficers] = useState<any[]>([]);
  const [dbMasters, setDbMasters] = useState<any[]>([]);
  const [newOfficerName, setNewOfficerName] = useState("");
  const [newMasterName, setNewMasterName] = useState("");
  const [editingOfficer, setEditingOfficer] = useState<{id: number, name: string} | null>(null);
  const [editingMaster, setEditingMaster] = useState<{id: number, name: string} | null>(null);
  const [loadingMilitary, setLoadingMilitary] = useState(false);



  // Carregar dados dos militares da API
  const loadMilitaryPersonnel = async () => {
    try {
      setLoadingMilitary(true);
      const response = await fetch(getBackendUrl('/api/military-personnel'));
      
      if (response.ok) {
        const result = await response.json();
        const personnel = result.data || [];
        
        setDbOfficers(personnel.filter((p: any) => p.type === 'officer'));
        setDbMasters(personnel.filter((p: any) => p.type === 'master'));
      }
    } catch (error) {
      console.error('Erro ao carregar militares:', error);
    } finally {
      setLoadingMilitary(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadMilitaryPersonnel();
  }, []);

  // Funções para gerenciar oficiais com persistência
  const addOfficer = async () => {
    if (newOfficerName.trim()) {
      try {
        const response = await fetch(getBackendUrl('/api/military-personnel'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newOfficerName.trim(),
            type: 'officer',
            rank: '1t',
            fullRankName: `1º Tenente ${newOfficerName.trim()}`,
            active: true
          })
        });

        if (response.ok) {
          await loadMilitaryPersonnel();
          setNewOfficerName("");
          toast({
            title: "Oficial adicionado",
            description: `${newOfficerName.trim()} foi salvo no sistema`,
          });
        } else {
          throw new Error('Erro ao salvar');
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível salvar o oficial",
          variant: "destructive"
        });
      }
    }
  };

  const removeOfficer = async (id: number, name: string) => {
    try {
      const response = await fetch(getBackendUrl(`/api/military-personnel/${id}`), {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadMilitaryPersonnel();
        toast({
          title: "Oficial removido",
          description: `${name} foi removido do sistema`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o oficial",
        variant: "destructive"
      });
    }
  };

  const startEditOfficer = (id: number, name: string) => {
    setEditingOfficer({ id, name });
  };

const saveEditOfficer = async () => {
  if (!editingOfficer) {
    console.error('Erro: editingOfficer is null');
    return;
  }

  if (!editingOfficer.name.trim()) {
    toast({
      title: "Erro",
      description: "Nome não pode estar vazio",
      variant: "destructive"
    });
    return;
  }

  try {
    const response = await fetch(getBackendUrl(`/api/military-personnel/${editingOfficer.id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingOfficer.name.trim(),
        fullRankName: `1º Tenente ${editingOfficer.name.trim()}`
      })
    });

    if (response.ok) {
      await loadMilitaryPersonnel();
      setEditingOfficer(null);
      toast({
        title: "Oficial atualizado",
        description: "Nome do oficial foi atualizado com sucesso",
      });
    } else {
      throw new Error('Erro ao atualizar');
    }
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível atualizar o oficial",
      variant: "destructive"
    });
  }
};

  const cancelEditOfficer = () => {
    setEditingOfficer(null);
  };

  // Funções para editar contramesres
  const startEditMaster = (id: number, name: string) => {
    setEditingMaster({ id, name });
  };

 const saveEditMaster = async () => {
  if (!editingMaster) {
    console.error('Erro: editingMaster is null');
    return;
  }

  if (!editingMaster.name.trim()) {
    toast({
      title: "Erro",
      description: "Nome não pode estar vazio",
      variant: "destructive"
    });
    return;
  }

  try {
    const response = await fetch(getBackendUrl(`/api/military-personnel/${editingMaster.id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingMaster.name.trim(),
        type: 'master',
        rank: '1sg',
        fullRankName: `1º Sargento ${editingMaster.name.trim()}`
      })
    });

    if (response.ok) {
      await loadMilitaryPersonnel();
      setEditingMaster(null);
      toast({
        title: "Contramestre atualizado",
        description: `${editingMaster.name.trim()} foi atualizado no sistema`,
      });
    } else {
      throw new Error('Erro ao atualizar');
    }
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível atualizar o contramestre",
      variant: "destructive",
    });
  }
};

  const cancelEditMaster = () => {
    setEditingMaster(null);
  };

  // Funções para gerenciar Contramesres com persistência
  const addMaster = async () => {
    if (newMasterName.trim()) {
      try {
        const response = await fetch(getBackendUrl('/api/military-personnel'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newMasterName.trim(),
            type: 'master',
            rank: '1sg',
            fullRankName: `1º Sargento ${newMasterName.trim()}`,
            active: true
          })
        });

        if (response.ok) {
          await loadMilitaryPersonnel();
          setNewMasterName("");
          toast({
            title: "Contramestre adicionado",
            description: `${newMasterName.trim()} foi salvo no sistema`,
          });
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível salvar o contramestre",
          variant: "destructive"
        });
      }
    }
  };

  const removeMaster = async (id: number, name: string) => {
    try {
      const response = await fetch(getBackendUrl(`/api/military-personnel/${id}`), {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadMilitaryPersonnel();
        toast({
          title: "Contramestre removido",
          description: `${name} foi removido do sistema`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o contramestre",
        variant: "destructive"
      });
    }
  };

  // Estados para status do sistema
  const [serverStatus, setServerStatus] = useState<{
    connected: boolean;
    lastResponse: number | null;
    lastCheck: Date | null;
    notices: number;
    documents: number;
  }>({
    connected: false,
    lastResponse: null,
    lastCheck: null,
    notices: 0,
    documents: 0
  });
  
  // Função para obter URL completa do backend - DETECTAR AMBIENTE
 const getBackendUrl = (path: string): string => {
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  
  // 🚨 CORREÇÃO: Usar IP real do servidor para acesso em rede
  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  
  // Se estamos acessando via IP da rede, usar o mesmo IP para backend
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    console.log(`🌐 Detectado acesso via rede: ${currentHost}`);
    
    if (path.startsWith('/')) {
      return `http://${currentHost}:5000${path}`;
    }
    return `http://${currentHost}:5000/${path}`;
  }
  
  // Detectar se estamos no Replit
  const isReplit = currentHost.includes('replit.dev') || currentHost.includes('replit.co');
  
  if (isReplit) {
    const currentOrigin = window.location.origin;
    if (path.startsWith('/')) {
      return `${currentOrigin}${path}`;
    }
    return `${currentOrigin}/${path}`;
  } else {
    // Desenvolvimento local
    if (path.startsWith('/')) {
      return `http://localhost:5000${path}`;
    }
    return `http://localhost:5000/${path}`;
  }
};
  
  // Função para verificar status do servidor
  const checkServerStatus = async () => {
    try {
      const response = await fetch(getBackendUrl('/api/notices'));
      setServerStatus(prev => ({
        ...prev,
        connected: response.ok,
        lastResponse: response.status,
        lastCheck: new Date(),
        notices: notices.length,
        documents: plasaDocuments.length + escalaDocuments.length
      }));
      console.log("📢 Resposta do servidor:", response.status, response.ok ? 'OK' : 'ERROR');
    } catch (error) {
      setServerStatus(prev => ({
        ...prev,
        connected: false,
        lastResponse: null,
        lastCheck: new Date(),
        notices: notices.length,
        documents: plasaDocuments.length + escalaDocuments.length
      }));
      console.error("❌ Erro de conexão com servidor:", error);
    }
  };

  // Função auxiliar para determinar categoria
  const determineCategory = (filename: string): "oficial" | "praca" | undefined => {
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.includes('oficial')) return 'oficial';
    if (lowerFilename.includes('praca')) return 'praca';
    return undefined;
  };
// Função para obter ícone e cor do tipo de documento
  const getDocumentTypeInfo = (type: string) => {
    switch (type) {
      case "plasa":
        return {
          icon: "📄",
          name: "PLASA",
          description: "Plano de Serviço",
          color: "bg-blue-50 border-blue-200 text-blue-800"
        };
        case "bono":  
      return {
        icon: "📋",
        name: "BONO",
        description: "Boletim de Notícias",
        color: "bg-purple-50 border-purple-200 text-purple-800"
      };
      case "escala":
        return {
          icon: "📋",
          name: "Escala",
          description: "Escala de Serviço",
          color: "bg-green-50 border-green-200 text-green-800"
        };
      case "cardapio":
        return {
          icon: "🍽️",
          name: "Cardápio",
          description: "Cardápio Semanal",
          color: "bg-orange-50 border-orange-200 text-orange-800"
        };
      default:
        return {
          icon: "📄",
          name: "Documento",
          description: "Documento",
          color: "bg-gray-50 border-gray-200 text-gray-800"
        };
    }
  };

  // Carregar oficiais de serviço
  const loadDutyOfficers = async () => {
    setIsLoadingOfficers(true);
    try {
      const response = await fetch(getBackendUrl('/api/duty-officers'));
      const data = await response.json();
      
      if (data.success && data.officers) {
        setDutyOfficers({
          officerName: data.officers.officerName || "",
          officerRank: data.officers.officerRank || "1t",
          masterName: data.officers.masterName || "",
          masterRank: data.officers.masterRank || "3sg"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar oficiais:', error);
    } finally {
      setIsLoadingOfficers(false);
    }
  };

  // Salvar oficiais de serviço
  const saveDutyOfficers = async () => {
    if (!dutyOfficers.officerName && !dutyOfficers.masterName) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um oficial ou contramestre.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingOfficers(true);
    try {
      // Construir nomes completos com graduação (evitando duplicação)
   
      // Função para verificar se o nome já contém graduação
      // ❌ FALTANDO ESTAS LINHAS
const selectedOfficer = OFFICERS_DATA.find(o => o.name === dutyOfficers.officerName);
const selectedMaster = MASTERS_DATA.find(m => m.name === dutyOfficers.masterName);
      const hasRank = (name: string): boolean => {
        const ranks = ["1º Tenente", "2º Tenente", "Capitão-Tenente", "Capitão de Corveta", "Capitão de Fragata", "1º Sargento", "2º Sargento", "3º Sargento"];
        return ranks.some(rank => name.includes(rank));
      };
      
      // Mapeamento de graduações para nomes completos
      const rankMap = {
        "1t": "1º Tenente",
        "2t": "2º Tenente", 
        "ct": "Capitão-Tenente",
        "cc": "Capitão de Corveta",
        "cf": "Capitão de Fragata",
        "1sg": "1º Sargento",
        "2sg": "2º Sargento",
        "3sg": "3º Sargento"
      };
      
      // Construir nomes completos sempre usando dados da lista (para evitar duplicação)
      const officerFullName = selectedOfficer 
        ? `${rankMap[selectedOfficer.rank]} ${selectedOfficer.name}`
        : dutyOfficers.officerName || "";
      
      const masterFullName = selectedMaster 
        ? `${rankMap[selectedMaster.rank]} ${selectedMaster.name}`
        : dutyOfficers.masterName || "";

      const officersData = {
        ...dutyOfficers,
        officerName: officerFullName,
        masterName: masterFullName
      };

      const response = await fetch(getBackendUrl('/api/duty-officers'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(officersData),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Oficiais de serviço atualizados com sucesso!",
        });
        
        // Atualizar o estado local com os nomes completos
        setDutyOfficers(prev => ({
          ...prev,
          officerName: officerFullName,
          masterName: masterFullName
        }));
      } else {
        throw new Error(data.error || 'Erro ao salvar oficiais');
      }
    } catch (error) {
      console.error('Erro ao salvar oficiais:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar oficiais de serviço.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingOfficers(false);
    }
  };

  // Funcionalidade de edição de nomes dos oficiais implementada abaixo

  useEffect(() => {
    console.log("🔧 Admin carregado, avisos serão carregados do servidor");
    loadDutyOfficers();
  }, []);
  
  // Form handler para avisos com servidor
  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNotice.title || !newNotice.content) {
      toast({
        title: "Erro",
        description: "Título e conteúdo são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Validar datas
    if (newNotice.startDate >= newNotice.endDate) {
      toast({
        title: "Erro",
        description: "A data de início deve ser anterior à data de fim.",
        variant: "destructive"
      });
      return;
    }
    
    console.log("📢 Enviando aviso para o servidor:", newNotice);
    
    try {
      const success = await addNotice(newNotice);
      
      if (success) {
        toast({
          title: "Sucesso!",
          description: "Aviso salvo no servidor com sucesso."
        });
      } else {
        toast({
          title: "Aviso Criado",
          description: "Aviso criado localmente. Verifique a conexão com o servidor.",
          variant: "destructive"
        });
      }
      
      // Reset form
      setNewNotice({
        title: "",
        content: "",
        priority: "medium",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        active: true
      });
      
    } catch (error) {
      console.error("❌ Erro ao criar aviso:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o aviso. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Funções de upload de documentos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      console.log("📁 Arquivo selecionado:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      });

      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 50MB",
          variant: "destructive"
        });
        return;
      }

      const isValidType = file.type === 'application/pdf' || 
                         file.type.startsWith('image/') ||
                         file.name.toLowerCase().endsWith('.pdf') ||
                         file.name.toLowerCase().endsWith('.jpg') ||
                         file.name.toLowerCase().endsWith('.jpeg') ||
                         file.name.toLowerCase().endsWith('.png') ||
                         file.name.toLowerCase().endsWith('.gif') ||
                         file.name.toLowerCase().endsWith('.webp');

      if (!isValidType) {
        toast({
          title: "Tipo de arquivo não suportado",
          description: "Use PDFs ou imagens (JPG, PNG, GIF, WEBP)",
          variant: "destructive"
        });
        return;
      }

      console.log("✅ Arquivo aceito:", file.type);
      setSelectedFile(file);
      
      if (!docTitle) {
        let fileName = file.name.replace(/\.[^/.]+$/, "");
        setDocTitle(fileName);
      }
      
      if (docUrl.startsWith('blob:')) {
        URL.revokeObjectURL(docUrl);
      }
      
      const fileUrl = URL.createObjectURL(file);
      setDocUrl(fileUrl);
      
      console.log("📄 Arquivo preparado para upload:", {
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: file.type,
        previewUrl: fileUrl
      });
    }
  };

const handleDocumentSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!docTitle) {
    toast({
      title: "Erro",
      description: "Título é obrigatório.",
      variant: "destructive"
    });
    return;
  }

  if (!selectedFile && !docUrl) {
    toast({
      title: "Erro",
      description: "Selecione um arquivo ou forneça uma URL.",
      variant: "destructive"
    });
    return;
  }
  
  if (selectedDocType === "escala" && !docCategory) {
    toast({
      title: "Erro",
      description: "Selecione a categoria da escala (Oficial ou Praça).",
      variant: "destructive"
    });
    return;
  }

  // ✅ DECLARE typeInfo UMA VEZ SÓ aqui no início
  const typeInfo = getDocumentTypeInfo(selectedDocType);

  try {
    setIsUploading(true);
    setUploadProgress(0);
    
    if (selectedFile) {
      console.log("📤 Iniciando upload do arquivo:", selectedFile.name);
      
      // ✅ USE a variável typeInfo já declarada (sem const)
      toast({
        title: "Upload em andamento...",
        description: `Enviando ${typeInfo.name} ${selectedFile.name} para o servidor...`
      });

      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('type', selectedDocType);
      formData.append('title', docTitle);
      
      if (selectedDocType === "escala" && docCategory) {
        formData.append('category', docCategory);
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const uploadUrl = getBackendUrl('/api/upload-pdf');
      
      console.log("📤 Enviando para:", uploadUrl);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${uploadResponse.status}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log("✅ Upload realizado com sucesso:", uploadResult);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload falhou');
      }

      const fullUrl = getBackendUrl(uploadResult.data.url);
      
      console.log("📄 Adicionando documento ao contexto:", {
        title: docTitle,
        url: fullUrl,
        type: selectedDocType,
        category: selectedDocType === "escala" ? docCategory : undefined
      });
      
      addDocument({
        title: docTitle,
        url: fullUrl,
        type: selectedDocType,
        category: selectedDocType === "escala" ? docCategory : undefined,
        active: true
      });
      
      // ✅ USE a variável typeInfo já declarada (sem const)
      toast({
        title: "Sucesso!",
        description: `${typeInfo.name} enviado e salvo com sucesso.`
      });
      
    } else if (docUrl && !docUrl.startsWith('blob:')) {
      const fullUrl = docUrl.startsWith('http') ? docUrl : getBackendUrl(docUrl);
      
      addDocument({
        title: docTitle,
        url: fullUrl,
        type: selectedDocType,
        category: selectedDocType === "escala" ? docCategory : undefined,
        active: true
      });
      
      // ✅ USE a variável typeInfo já declarada (sem const)
      toast({
        title: "Sucesso!",
        description: `${typeInfo.name} adicionado com sucesso.`
      });
    }
    
    resetForm();

  } catch (error: unknown) {
    console.error('❌ Erro no upload:', error);
    
    let errorMessage = "Não foi possível enviar o arquivo. Tente novamente.";
    
    if (error instanceof Error) {
      if (error.message?.includes('FILE_TOO_LARGE')) {
        errorMessage = "Arquivo muito grande. Máximo permitido: 50MB.";
      } else if (error.message?.includes('INVALID_FILE')) {
        errorMessage = "Tipo de arquivo não suportado. Use PDFs ou imagens.";
      } else if (error.message?.includes('MISSING_FIELDS')) {
        errorMessage = "Dados obrigatórios estão faltando.";
      } else if (error.message?.includes('fetch')) {
        errorMessage = "Erro de conexão. Verifique se o servidor está rodando.";
      }
    }
    
    toast({
      title: "Erro no upload",
      description: errorMessage,
      variant: "destructive"
    });
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};

  const resetForm = () => {
    setDocTitle("");
    if (docUrl.startsWith('blob:')) {
      URL.revokeObjectURL(docUrl);
    }
    setDocUrl("");
    setSelectedFile(null);
    setDocCategory(undefined);
    
    const fileInput = document.getElementById('docFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  // Funções para avisos com servidor
  const toggleNoticeActive = async (notice: Notice) => {
    try {
      const updatedNotice = { ...notice, active: !notice.active };
      const success = await updateNotice(updatedNotice);
      
      toast({
        title: success ? "Aviso atualizado" : "Aviso atualizado localmente",
        description: `O aviso "${notice.title}" foi ${notice.active ? "desativado" : "ativado"}.`,
        variant: success ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o aviso.",
        variant: "destructive"
      });
    }
  };
  
  const removeNotice = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este aviso?")) {
      try {
        const success = await deleteNotice(String(id));
        
        toast({
          title: success ? "Aviso removido" : "Aviso removido localmente",
          description: success ? "O aviso foi removido do servidor." : "O aviso foi removido apenas localmente.",
          variant: success ? "default" : "destructive"
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível remover o aviso.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Funções para documentos
    const toggleDocActive = (doc: PDFDocument) => {
    updateDocument({ ...doc, active: !doc.active });
    const typeInfo = getDocumentTypeInfo(doc.type);
    toast({
      title: doc.active ? `${typeInfo.name} desativado` : `${typeInfo.name} ativado`,
      description: `O documento "${doc.title}" foi ${doc.active ? "desativado" : "ativado"}.`
    });
  };

  
  const removeDocument = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este documento?")) {
      const doc = [...plasaDocuments, ...escalaDocuments].find(d => d.id === id);
      
      if (doc && doc.url.includes('/uploads/')) {
        try {
          const filename = doc.url.split('/uploads/')[1];
          const deleteUrl = getBackendUrl(`/api/delete-pdf/${filename}`);
          const response = await fetch(deleteUrl, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Arquivo ${filename} removido do servidor:`, result);
          } else {
            console.log(`⚠️ Não foi possível remover ${filename} do servidor`);
          }
        } catch (error) {
          console.log("⚠️ Erro ao remover arquivo do servidor:", error);
        }
      }
      
      deleteDocument(id);
      toast({
        title: "Documento removido",
        description: "O documento foi removido com sucesso."
      });
    }
  };
  
  const updateDocumentAlternateInterval = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 10 && value <= 300) {
      setDocumentAlternateInterval(value * 1000);
      toast({
        title: "Intervalo de alternância atualizado",
        description: `Escalas agora alternam a cada ${value} segundos.`
      });
    }
  };

  const handleScrollSpeedChange = (value: string) => {
    setScrollSpeed(value as "slow" | "normal" | "fast");
    toast({
      title: "Velocidade atualizada",
      description: `Velocidade de rolagem do PLASA definida como: ${
        value === "slow" ? "Lenta" : 
        value === "normal" ? "Normal" : "Rápida"
      }`
    });
  };

  const handleAutoRestartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 2 && value <= 10) {
      setAutoRestartDelay(value);
      toast({
        title: "Intervalo de reinício atualizado",
        description: `PLASA aguardará ${value} segundos no final antes de reiniciar.`
      });
    }
  };

  const handleDocumentAlternateIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 5 && value <= 60) {
      setDocumentAlternateInterval(value * 1000);
      toast({
        title: "Intervalo de alternância atualizado",
        description: `Escalas agora alternam a cada ${value} segundos.`
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Effect para verificar status do servidor periodicamente
  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // A cada 30 segundos
    return () => clearInterval(interval);
  }, [notices.length, plasaDocuments.length, escalaDocuments.length]);

  // Componente de Status do Servidor
  const ServerStatusIndicator = () => (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🖥️ Status do Sistema
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkServerStatus}
            className="ml-auto"
          >
            🔄 Verificar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Status de Conexão */}
          <div className={`p-3 rounded-lg border ${
            serverStatus.connected 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                serverStatus.connected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium">
                {serverStatus.connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div className="text-sm mt-1">
              {serverStatus.lastResponse ? `HTTP ${serverStatus.lastResponse}` : 'Sem resposta'}
            </div>
          </div>

          {/* Avisos */}
          <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">📢</span>
              <span className="font-medium">Avisos</span>
            </div>
            <div className="text-sm mt-1">
              {serverStatus.notices} cadastrados
            </div>
          </div>

          {/* Documentos */}
          <div className="p-3 rounded-lg border bg-purple-50 border-purple-200 text-purple-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">📁</span>
              <span className="font-medium">Documentos</span>
            </div>
            <div className="text-sm mt-1">
              {serverStatus.documents} carregados
            </div>
          </div>

          {/* Última Verificação */}
          <div className="p-3 rounded-lg border bg-gray-50 border-gray-200 text-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">⏰</span>
              <span className="font-medium">Última Check</span>
            </div>
            <div className="text-sm mt-1">
              {serverStatus.lastCheck 
                ? serverStatus.lastCheck.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                : 'Nunca'
              }
            </div>
          </div>
        </div>

        {/* Status detalhado */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <strong>URL do Backend:</strong> {getBackendUrl('/api')} | 
            <strong className="ml-2">Status:</strong> 
            <span className={`ml-1 ${
              serverStatus.connected ? 'text-green-600' : 'text-red-600'
            }`}>
              {serverStatus.connected ? '✅ Online' : '❌ Offline'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="bg-navy text-white p-4 rounded-lg shadow-lg mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-gray-200">Gerencie documentos e avisos do sistema de visualização</p>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="secondary">
                📺 Visualizar Sistema
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="text-white border-white hover:bg-white hover:text-navy"
              onClick={() => window.open(getBackendUrl('/api/status'), '_blank')}
            >
              🔧 Status do Servidor
            </Button>
          </div>
        </header>
        
        {/* Status Panel */}
        <ServerStatusIndicator />
        
        <Tabs defaultValue="documentos" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="documentos" className="flex-1">📄 Documentos</TabsTrigger>
            <TabsTrigger value="avisos" className="flex-1">📢 Avisos</TabsTrigger>
            <TabsTrigger value="militares" className="flex-1">👮 Militares</TabsTrigger>
            <TabsTrigger value="sistema" className="flex-1">⚙️ Sistema</TabsTrigger>
          </TabsList>
          
          {/* Aba de Avisos */}
          <TabsContent value="avisos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulário para novo aviso */}
              <Card className="border-navy">
                <CardHeader className="bg-navy text-white">
                  <CardTitle>Adicionar Novo Aviso</CardTitle>
                  <CardDescription className="text-gray-200">
                    Crie um novo aviso que será salvo no servidor
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleNoticeSubmit}>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="noticeTitle">Título do Aviso</Label>
                      <Input 
                        id="noticeTitle" 
                        placeholder="Título do aviso"
                        value={newNotice.title}
                        onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="noticeContent">Conteúdo</Label>
                      <Textarea 
                        id="noticeContent" 
                        placeholder="Conteúdo do aviso"
                        value={newNotice.content}
                        onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                        rows={4}
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="noticePriority">Prioridade</Label>
                      <Select 
                        value={newNotice.priority} 
                        onValueChange={(value) => setNewNotice({...newNotice, priority: value as "high" | "medium" | "low"})}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">🔴 Alta</SelectItem>
                          <SelectItem value="medium">🟡 Média</SelectItem>
                          <SelectItem value="low">🟢 Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Data de Início</Label>
                        <Input 
                          id="startDate" 
                          type="date" 
                          value={formatDate(newNotice.startDate)}
                          onChange={(e) => setNewNotice({
                            ...newNotice, 
                            startDate: new Date(e.target.value)
                          })}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">Data de Término</Label>
                        <Input 
                          id="endDate" 
                          type="date" 
                          value={formatDate(newNotice.endDate)}
                          onChange={(e) => setNewNotice({
                            ...newNotice, 
                            endDate: new Date(e.target.value)
                          })}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {isLoading && (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy"></div>
                        <span className="ml-2 text-sm text-navy">Salvando no servidor...</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-navy hover:bg-navy-light"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Salvando no Servidor...
                        </>
                      ) : (
                        "📢 Adicionar Aviso no Servidor"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
              
              {/* Lista de Avisos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📢 Avisos do Servidor
                    <span className="text-sm font-normal text-gray-500">
                      ({notices.length})
                    </span>
                    {isLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy"></div>
                    )}
                  </CardTitle>
                  <CardDescription className="flex justify-between items-center">
                    <span>Gerencie os avisos salvos no servidor</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={refreshNotices}
                      disabled={isLoading}
                    >
                      🔄 Atualizar
                    </Button>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {notices.length === 0 ? (
                    <div className="text-center py-8">
                      {isLoading ? (
                        <div>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mx-auto mb-4"></div>
                          <p className="text-muted-foreground">Carregando avisos do servidor...</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Nenhum aviso cadastrado no servidor.</p>
                      )}
                    </div>
                  ) : (
                    <ul className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {notices.map((notice) => (
                        <li key={String(notice.id)} className={`border-l-4 ${
                          notice.priority === "high" ? "border-red-500" :
                          notice.priority === "medium" ? "border-yellow-500" :
                          "border-green-500"
                        } rounded-md p-4 bg-white shadow-sm`}>
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium flex items-center gap-2">
                              {notice.priority === "high" ? "🔴" :
                               notice.priority === "medium" ? "🟡" : "🟢"}
                              {notice.title}
                              {String(notice.id).startsWith('local-') && (
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                  Local
                                </span>
                              )}
                            </h3>
                            <div className="flex gap-1">
                              <Button 
                                variant={notice.active ? "default" : "outline"} 
                                size="sm" 
                                onClick={() => toggleNoticeActive(notice)}
                                disabled={isLoading}
                              >
                                {notice.active ? "✅" : "💤"}
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => removeNotice(String(notice.id))}
                                disabled={isLoading}
                              >
                                🗑️
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 my-2">{notice.content}</p>
                          <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                            <span>
                              Prioridade: {
                                notice.priority === "high" ? "🔴 Alta" :
                                notice.priority === "medium" ? "🟡 Média" : "🟢 Baixa"
                              }
                            </span>
                            <span>
                              📅 {notice.startDate.toLocaleDateString('pt-BR')} até {notice.endDate.toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {(notice.createdAt || notice.updatedAt) && (
                            <div className="text-xs text-gray-400 mt-1">
                              {notice.createdAt && (
                                <span>Criado: {notice.createdAt.toLocaleString('pt-BR')} </span>
                              )}
                              {notice.updatedAt && notice.updatedAt !== notice.createdAt && (
                                <span>• Atualizado: {notice.updatedAt.toLocaleString('pt-BR')}</span>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Informações sobre servidor de avisos */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>🌐 Servidor de Avisos</CardTitle>
                <CardDescription>
                  Os avisos agora são salvos diretamente no servidor backend
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">✅ Vantagens</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Persistem mesmo se o navegador for fechado</li>
                      <li>• Sincronizam entre diferentes dispositivos</li>
                      <li>• Backup automático no servidor</li>
                      <li>• Não dependem do localStorage</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">🔧 Como Funciona</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Salvos em arquivo JSON no servidor</li>
                      <li>• API REST para criar/editar/deletar</li>
                      <li>• Carregamento automático na inicialização</li>
                      <li>• Fallback local se servidor estiver offline</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">⚠️ Importante</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Servidor backend deve estar rodando</li>
                      <li>• Avisos "Local" não foram salvos no servidor</li>
                      <li>• Use "Atualizar" se houver problemas</li>
                      <li>• Verifique logs no console (F12)</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => window.open(getBackendUrl('/api/notices'), '_blank')}
                  >
                    🔗 Ver Avisos no Servidor
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={refreshNotices}
                    disabled={isLoading}
                  >
                    🔄 Recarregar do Servidor
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      console.log("📢 Estado atual dos avisos:", notices);
                      toast({
                        title: "Debug",
                        description: `${notices.length} avisos no console (F12)`
                      });
                    }}
                  >
                    🐛 Debug Avisos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
        {/* Aba de Documentos - CÓDIGO COMPLETO */}
<TabsContent value="documentos">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Upload New Document Form */}
    <Card className="border-navy">
      <CardHeader className="bg-navy text-white">
        <CardTitle>Adicionar Novo Documento</CardTitle>
        <CardDescription className="text-gray-200">
          Envie um novo documento PDF ou imagem para o sistema
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleDocumentSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="docType">Tipo de Documento</Label>
            <Select 
              value={selectedDocType} 
              onValueChange={(value) => {
                setSelectedDocType(value as "plasa" | "escala" | "cardapio");
                if (value !== "escala") {
                  setDocCategory(undefined);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plasa">📄 PLASA - Plano de Serviço</SelectItem>
                <SelectItem value="escala">📋 Escala de Serviço</SelectItem>
                <SelectItem value="cardapio">🍽️ Cardápio Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedDocType === "escala" && (
            <div className="space-y-2">
              <Label htmlFor="docCategory">Categoria da Escala</Label>
              <Select 
                value={docCategory} 
                onValueChange={(value) => setDocCategory(value as "oficial" | "praca")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oficial">👨‍✈️ Oficiais</SelectItem>
                  <SelectItem value="praca">👨‍🔧 Praças</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="docTitle">Título do Documento</Label>
            <Input 
              id="docTitle" 
              placeholder={`Ex: ${
                selectedDocType === "plasa" ? "PLASA - Junho 2025" : 
                selectedDocType === "escala" ? "Escala de Serviço - Junho 2025" :
                selectedDocType === "cardapio" ? "Cardápio - Semana 25/2025" :
                "Documento"
              }`}
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="docFile">Arquivo do Documento</Label>
            <Input 
              id="docFile"
              type="file"
              accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileChange}
            />
            <div className="text-xs space-y-1">
              {selectedFile ? (
                <div className="text-green-600 bg-green-50 p-2 rounded">
                  ✅ <strong>Arquivo selecionado:</strong> {selectedFile.name} 
                  <br />
                  📏 <strong>Tamanho:</strong> {formatFileSize(selectedFile.size)}
                  <br />
                  📋 <strong>Tipo:</strong> {selectedFile.type}
                </div>
              ) : (
                <div className="text-gray-600">
                  📁 Aceita PDFs ou imagens (JPG, PNG, GIF, WEBP) - máximo 50MB
                </div>
              )}
            </div>
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              💡 <strong>Recomendação:</strong> PDFs são automaticamente convertidos para imagens para melhor compatibilidade
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="docUrl">URL do Documento (alternativo)</Label>
            <Input 
              id="docUrl" 
              placeholder="https://exemplo.com/documento.pdf"
              value={docUrl.startsWith('blob:') ? '' : docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              type="url"
              disabled={!!selectedFile}
            />
            <p className="text-xs text-muted-foreground">
              Se não tiver arquivo para upload, pode fornecer uma URL direta.
            </p>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-navy h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-navy">
                {uploadProgress < 100 ? `Enviando... ${uploadProgress}%` : "Processando..."}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-navy hover:bg-navy-light"
            disabled={isUploading || (!selectedFile && !docUrl) || !docTitle}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                📤 Adicionar Documento
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
    
    {/* Document Lists Separadas */}
    <div className="space-y-6">
      {/* 📄 PLASA/BONO Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📄 Documentos PLASA/BONO
            <span className="text-sm font-normal text-gray-500">
              ({plasaDocuments.length})
            </span>
          </CardTitle>
          <CardDescription>
            Planos de Serviço e Boletins - Rolagem automática contínua 
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plasaDocuments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum documento PLASA/BONO cadastrado.
            </p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {plasaDocuments.map((doc) => (
                <li key={doc.id} className="border rounded-md p-3 flex justify-between items-center document-card">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {doc.type === "plasa" ? "📄" : "📋"}
                      </span>
                      <p className="font-medium truncate">{doc.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full status-badge ${
                        doc.type === "plasa" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {doc.type === "plasa" ? "PLASA" : "BONO"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        📅 {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                      </span>
                      {doc.url.includes('/uploads/') && (
                        <span className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full status-badge">
                          🌐 Servidor
                        </span>
                      )}
                      <span className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full status-badge">
                        📖 Rolagem
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      variant={doc.active ? "default" : "outline"} 
                      size="sm"
                      onClick={() => toggleDocActive(doc)}
                      title={doc.active ? "Documento ativo" : "Documento inativo"}
                    >
                      {doc.active ? "✅" : "💤"}
                    </Button>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" title="Visualizar documento">👁️</Button>
                      </SheetTrigger>
                      <SheetContent className="w-[85vw] sm:max-w-4xl">
                        <SheetHeader>
                          <SheetTitle>{doc.title}</SheetTitle>
                          <SheetDescription>
                            Visualização prévia do documento
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6 h-[80vh]">
                          <iframe 
                            src={doc.url} 
                            className="w-full h-full border rounded"
                            title={doc.title}
                          />
                        </div>
                      </SheetContent>
                    </Sheet>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      title="Remover documento"
                    >
                      🗑️
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
      {/* 📋 ESCALA Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 Escalas de Serviço
            <span className="text-sm font-normal text-gray-500">
              ({escalaDocuments.filter(doc => doc.type === "escala").length})
            </span>
          </CardTitle>
          <CardDescription>
            Escalas de Oficiais e Praças - Alternância automática
          </CardDescription>
        </CardHeader>
        <CardContent>
          {escalaDocuments.filter(doc => doc.type === "escala").length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma escala cadastrada.
            </p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {escalaDocuments.filter(doc => doc.type === "escala").map((doc) => (
                <li key={doc.id} className="border rounded-md p-3 flex justify-between items-center document-card">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📋</span>
                      <p className="font-medium truncate">{doc.title}</p>
                      {doc.category && (
                        <span className={`text-xs px-2 py-0.5 rounded-full status-badge ${
                          doc.category === "oficial" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {doc.category === "oficial" ? "👨‍✈️ Oficiais" : "👨‍🔧 Praças"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        📅 {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                      </span>
                      {doc.url.includes('/uploads/') && (
                        <span className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full status-badge">
                          🌐 Servidor
                        </span>
                      )}
                      <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full status-badge">
                        🔄 Alternância
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      variant={doc.active ? "default" : "outline"} 
                      size="sm"
                      onClick={() => toggleDocActive(doc)}
                      title={doc.active ? "Escala ativa" : "Escala inativa"}
                    >
                      {doc.active ? "✅" : "💤"}
                    </Button>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" title="Visualizar escala">👁️</Button>
                      </SheetTrigger>
                      <SheetContent className="w-[85vw] sm:max-w-4xl">
                        <SheetHeader>
                          <SheetTitle>📋 {doc.title}</SheetTitle>
                          <SheetDescription>
                            Visualização prévia da escala de serviço
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6 h-[80vh]">
                          <iframe 
                            src={doc.url} 
                            className="w-full h-full border rounded"
                            title={doc.title}
                          />
                        </div>
                      </SheetContent>
                    </Sheet>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      title="Remover escala"
                    >
                      🗑️
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 🍽️ CARDÁPIO Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🍽️ Cardápios Semanais
            <span className="text-sm font-normal text-gray-500">
              ({escalaDocuments.filter(doc => doc.type === "cardapio").length})
            </span>
          </CardTitle>
          <CardDescription>
            Cardápios da Semana - Alternância automática
          </CardDescription>
        </CardHeader>
        <CardContent>
          {escalaDocuments.filter(doc => doc.type === "cardapio").length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum cardápio cadastrado.
            </p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {escalaDocuments.filter(doc => doc.type === "cardapio").map((doc) => (
                <li key={doc.id} className="border rounded-md p-3 flex justify-between items-center document-card">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🍽️</span>
                      <p className="font-medium truncate">{doc.title}</p>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full status-badge">
                        CARDÁPIO
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        📅 {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                      </span>
                      {doc.url.includes('/uploads/') && (
                        <span className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full status-badge">
                          🌐 Servidor
                        </span>
                      )}
                      <span className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full status-badge">
                        🔄 Alternância
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      variant={doc.active ? "default" : "outline"} 
                      size="sm"
                      onClick={() => toggleDocActive(doc)}
                      title={doc.active ? "Cardápio ativo" : "Cardápio inativo"}
                    >
                      {doc.active ? "✅" : "💤"}
                    </Button>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" title="Visualizar cardápio">👁️</Button>
                      </SheetTrigger>
                      <SheetContent className="w-[85vw] sm:max-w-4xl">
                        <SheetHeader>
                          <SheetTitle>🍽️ {doc.title}</SheetTitle>
                          <SheetDescription>
                            Visualização prévia do cardápio semanal
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6 h-[80vh]">
                          <iframe 
                            src={doc.url} 
                            className="w-full h-full border rounded"
                            title={doc.title}
                          />
                        </div>
                      </SheetContent>
                    </Sheet>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      title="Remover cardápio"
                    >
                      🗑️
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  </div>

  {/* Informações sobre como funciona */}
  <Card className="mt-6">
    <CardHeader>
      <CardTitle>❓ Como Funciona o Sistema de Documentos</CardTitle>
      <CardDescription>
        Entenda como o sistema processa e exibe os diferentes tipos de documentos
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            📄 PLASA (Plano de Serviço)
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700">
            <li>PDFs convertidos automaticamente para imagens</li>
            <li>Rola automaticamente do início ao fim</li>
            <li>Reinicia após intervalo configurável</li>
            <li>Velocidade de rolagem ajustável</li>
            <li>Exibido no lado esquerdo da tela</li>
          </ul>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
           (PoC)*** <br></br> 📋 BONO (Boletim de Ordens e Notícias)
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-purple-700">
            <li>Mesmo comportamento do PLASA</li>
            <li>Rolagem automática contínua</li>
            <li>Alternância com PLASA no lado esquerdo</li>
            <li>Conversão automática PDF → Imagem</li>
            <li>Cache inteligente no servidor</li>
          </ul>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            📋 Escalas de Serviço
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-green-700">
            <li>Exibição estática (sem scroll)</li>
            <li>Alternância automática entre escalas</li>
            <li>Categorias: Oficiais e Praças</li>
            <li>Intervalo de alternância configurável</li>
            <li>Exibido no lado direito da tela</li>
          </ul>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            🍽️ Cardápios Semanais
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-orange-700">
            <li>Alternância automática entre cardápios</li>
            <li>Exibição estática como as escalas</li>
            <li>Mesmo intervalo de alternância</li>
            <li>Cache para melhor performance</li>
            <li>Rotaciona junto com as escalas</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-navy/5 rounded-lg border-l-4 border-navy">
        <h4 className="font-medium mb-2 text-navy">🔧 Conversão PDF para Imagem</h4>
        <p className="text-sm text-navy/80">
          O sistema converte automaticamente PDFs para imagens (JPG) para garantir máxima compatibilidade 
          e evitar problemas de CORS, fontes faltando, ou incompatibilidades de navegador. 
          As imagens são armazenadas no servidor e carregadas rapidamente através de cache inteligente.
        </p>
      </div>
      
      <div className="mt-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
        <h4 className="font-medium mb-2 text-green-800">💡 Dicas de Uso</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="list-disc pl-5 space-y-1 text-sm text-green-700">
            <li>Para melhor qualidade, use PDFs com orientação paisagem</li>
            <li>Imagens (JPG/PNG) são processadas mais rapidamente que PDFs</li>
            <li>O sistema mantém cache das páginas convertidas</li>
            <li>Documentos inativos permanecem salvos mas não são exibidos</li>
          </ul>
          <ul className="list-disc pl-5 space-y-1 text-sm text-green-700">
            <li>PLASA/BONO: Ideal para documentos longos que precisam ser lidos</li>
            <li>Escalas/Cardápios: Ideal para informações que precisam ser vistas rapidamente</li>
            <li>Use nomes descritivos nos títulos para melhor organização</li>
            <li>Cache evita reprocessamento desnecessário</li>
          </ul>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>



          {/* Aba de Militares */}
          <TabsContent value="militares">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulário de Oficiais */}
              <Card className="border-navy">
                <CardHeader className="bg-navy text-white">
                  <CardTitle>👮 Oficiais de Serviço</CardTitle>
                  <CardDescription className="text-gray-200">
                    Configure o oficial do dia e contramestre do serviço
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Oficial do Dia */}
                    <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                      <h3 className="font-medium text-blue-800 flex items-center gap-2">
                        🎖️ Oficial do Dia
                      </h3>
                      


                      <div className="space-y-2">
                        <Label htmlFor="officerName">Nome do Oficial</Label>
                        <Select 
                          value={dutyOfficers.officerName} 
                          onValueChange={(value) => {
                            const officer = OFFICERS_DATA.find(o => o.name === value);
                            setDutyOfficers({
                              ...dutyOfficers, 
                              officerName: value,
                              officerRank: officer?.rank as "1t" | "2t" | "ct" || dutyOfficers.officerRank
                            });
                          }}
                          disabled={isLoadingOfficers}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o oficial" />
                          </SelectTrigger>
                          <SelectContent>
                            {OFFICERS_DATA.map((officer) => (
                              <SelectItem key={officer.name} value={officer.name}>
                                {officer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Contramestre */}
                    <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                      <h3 className="font-medium text-green-800 flex items-center gap-2">
                        ⚓ Contramestre do Serviço
                      </h3>
                      


                      <div className="space-y-2">
                        <Label htmlFor="masterName">Nome do Contramestre</Label>
                        <Select 
                          value={dutyOfficers.masterName} 
                          onValueChange={(value) => {
                            const master = MASTERS_DATA.find(m => m.name === value);
                            setDutyOfficers({
                              ...dutyOfficers, 
                              masterName: value,
                              masterRank: master?.rank as "3sg" | "2sg" | "1sg" || dutyOfficers.masterRank
                            });
                          }}
                          disabled={isLoadingOfficers}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o contramestre" />
                          </SelectTrigger>
                          <SelectContent>
                            {MASTERS_DATA.map((master) => (
                              <SelectItem key={master.name} value={master.name}>
                                {master.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={saveDutyOfficers}
                      disabled={isLoadingOfficers || (!dutyOfficers.officerName && !dutyOfficers.masterName)}
                      className="bg-navy hover:bg-navy/90"
                    >
                      {isLoadingOfficers ? "💾 Salvando..." : "💾 Salvar Oficiais"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={loadDutyOfficers}
                      disabled={isLoadingOfficers}
                    >
                      🔄 Recarregar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Visualização Atual */}
              <Card>
                <CardHeader>
                  <CardTitle>👁️ Visualização Atual</CardTitle>
                  <CardDescription>
                    Como as informações aparecem na tela principal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-medium mb-2 text-gray-700">
                        Informações Exibidas no Header:
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>
                            <strong>Oficial do Dia:</strong> {
                              dutyOfficers.officerName || "Não definido"
                            } {
                              dutyOfficers.officerName && `(${dutyOfficers.officerRank.toUpperCase()})`
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>
                            <strong>Contramestre:</strong> {
                              dutyOfficers.masterName || "Não definido"
                            } {
                              dutyOfficers.masterName && `(${dutyOfficers.masterRank.toUpperCase()})`
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        💡 <strong>Dica:</strong> As informações dos oficiais são exibidas no cabeçalho 
                        da tela principal e são atualizadas automaticamente em tempo real.
                      </p>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm text-amber-700">
                        ⚠️ <strong>Importante:</strong> Certifique-se de que os nomes estão corretos 
                        antes de salvar, pois eles serão exibidos publicamente.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba de Sistema */}
          <TabsContent value="sistema">
            <Tabs defaultValue="sistema" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="sistema" className="flex-1">⚙️ Sistema</TabsTrigger>
                <TabsTrigger value="militares" className="flex-1">👥 Militares</TabsTrigger>
              </TabsList>
              
              {/* Sub-aba Sistema */}
              <TabsContent value="sistema">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card de Configurações do Sistema */}
                  <Card>
                    <CardHeader>
                      <CardTitle>⚙️ Configurações do Sistema</CardTitle>
                      <CardDescription>
                        Ajuste os parâmetros de funcionamento do sistema de visualização
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="scrollSpeed">
                          🏃‍♂️ Velocidade de Rolagem do PLASA
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Select value={scrollSpeed} onValueChange={handleScrollSpeedChange}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Velocidade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="slow">🐌 Lenta</SelectItem>
                              <SelectItem value="normal">🚶‍♂️ Normal</SelectItem>
                              <SelectItem value="fast">🏃‍♂️ Rápida</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-muted-foreground">velocidade de scroll</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Define a velocidade com que o PLASA rola automaticamente pela tela.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Label htmlFor="escalaInterval">
                              ⚖️ Intervalo entre Escalas (segundos)
                            </Label>
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <span className="ml-2 text-blue-500 cursor-help text-sm">[?]</span>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <p className="text-sm">
                                  Define quanto tempo cada escala (Oficiais/Praças) será exibida antes de alternar para a outra.
                                </p>
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input 
                              id="escalaInterval" 
                              type="number" 
                              min="5" 
                              max="60" 
                              className="w-24"
                              value={Math.floor(documentAlternateInterval / 1000)}
                              onChange={handleDocumentAlternateIntervalChange}
                            />
                            <span className="text-sm text-muted-foreground">segundos entre escalas</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Label htmlFor="cardapioInterval">
                              🍽️ Intervalo do Cardápio (segundos)
                            </Label>
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <span className="ml-2 text-blue-500 cursor-help text-sm">[?]</span>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <p className="text-sm">
                                  Define quanto tempo o cardápio fica visível antes de voltar às escalas.
                                </p>
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input 
                              id="cardapioInterval" 
                              type="number" 
                              min="10" 
                              max="120" 
                              className="w-24"
                              defaultValue="15"
                            />
                            <span className="text-sm text-muted-foreground">segundos para cardápio</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="autoRestart">
                          🔄 Reinício Automático do PLASA
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Input 
                            id="autoRestart" 
                            type="number" 
                            min="2" 
                            max="10" 
                            className="w-24"
                            value={autoRestartDelay}
                            onChange={handleAutoRestartChange}
                          />
                          <span className="text-sm text-muted-foreground">segundos no final</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tempo de pausa no final do PLASA antes de reiniciar do topo.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card de Debug do Sistema */}
                  <Card>
                    <CardHeader>
                      <CardTitle>🔍 Informações do Sistema</CardTitle>
                      <CardDescription>
                        Status e informações técnicas do sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium mb-2 text-blue-800">📊 Status do Servidor</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><strong>Conectado:</strong> {serverStatus.connected ? '✅ Sim' : '❌ Não'}</p>
                            <p><strong>Última resposta:</strong> {serverStatus.lastResponse || 'N/A'}</p>
                            <p><strong>Documentos:</strong> {serverStatus.documents}</p>
                          </div>
                          <div>
                            <p><strong>Avisos:</strong> {serverStatus.notices}</p>
                            <p><strong>Última verificação:</strong> {serverStatus.lastCheck ? serverStatus.lastCheck.toLocaleTimeString('pt-BR') : 'Nunca'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button 
                          onClick={checkServerStatus}
                          disabled={isLoading}
                          className="w-full"
                        >
                          {isLoading ? 'Verificando...' : '🔄 Verificar Status do Servidor'}
                        </Button>
                        

                      </div>

                      <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <h4 className="font-medium mb-2 text-green-800">💡 Dicas de Debug</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-green-700">
                          <li>Verifique o console do navegador (F12) para logs detalhados</li>
                          <li>O botão "Listar Documentos" mostra todos os PDFs no servidor</li>
                          <li>Status do servidor é atualizado automaticamente</li>
                          <li>Documentos são processados em background</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Card de Logs do Sistema */}
                  <Card>
                    <CardHeader>
                      <CardTitle>📋 Logs do Sistema</CardTitle>
                      <CardDescription>
                        Informações técnicas e logs de funcionamento
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto text-sm font-mono bg-gray-100 p-3 rounded">
                        <div>✅ Sistema iniciado com sucesso</div>
                        <div>📡 Backend conectado: {getBackendUrl('/api/status')}</div>
                        <div>🔄 Auto-refresh ativo a cada 30 segundos</div>
                        <div>📱 Interface responsiva carregada</div>
                        <div>🎯 Componentes Radix UI inicializados</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Alertas Meteorológicos */}
                  <div className="lg:col-span-2">
                    <WeatherAlerts />
                  </div>

                  {/* Card de Manutenção do Sistema */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="bg-orange-50">
                      <CardTitle className="flex items-center gap-2">
                        🔧 Manutenção do Sistema
                      </CardTitle>
                      <CardDescription>
                        Ferramentas de manutenção e limpeza do sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Limpeza de Cache */}
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🧹</span>
                            <h4 className="font-medium text-yellow-800">Limpeza de Cache</h4>
                          </div>
                          <p className="text-sm text-yellow-700 mb-3">
                            Limpa cache de PDFs e páginas processadas no servidor.
                          </p>
                          <Button
                            onClick={async () => {
                              try {
                                const response = await fetch(getBackendUrl('/api/clear-cache'), { method: 'POST' });
                                if (response.ok) {
                                  // Limpar também cache do localStorage
                                  localStorage.removeItem('documentContext');
                                  localStorage.removeItem('noticeContext');
                                  localStorage.removeItem('lastDisplayState');
                                  
                                  toast({
                                    title: "Cache limpo",
                                    description: "Cache do servidor e navegador foi limpo com sucesso"
                                  });
                                } else {
                                  throw new Error('Falha na requisição');
                                }
                              } catch (error) {
                                toast({
                                  title: "Erro na limpeza",
                                  description: "Não foi possível limpar o cache do servidor",
                                  variant: "destructive"
                                });
                              }
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                          >
                            Limpar Cache
                          </Button>
                        </div>

                        {/* Limpar Cache do Navegador */}
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">💻</span>
                            <h4 className="font-medium text-purple-800">Cache do Navegador</h4>
                          </div>
                          <p className="text-sm text-purple-700 mb-3">
                            Limpa dados salvos localmente no navegador.
                          </p>
                          <Button
                            onClick={() => {
                              // Limpar localStorage
                              localStorage.clear();
                              
                              // Limpar sessionStorage
                              sessionStorage.clear();
                              
                              // Forçar reload da página
                              toast({
                                title: "Cache limpo",
                                description: "Recarregando página..."
                              });
                              
                              setTimeout(() => {
                                window.location.reload();
                              }, 1000);
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
                          >
                            Limpar e Recarregar
                          </Button>
                        </div>

                        {/* Recarregar Dados */}
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🔄</span>
                            <h4 className="font-medium text-blue-800">Recarregar Dados</h4>
                          </div>
                          <p className="text-sm text-blue-700 mb-3">
                            Força recarga dos dados do servidor para sincronização.
                          </p>
                          <Button
                            onClick={() => {
                              // Força recarregamento da página para sincronizar dados
                              window.location.reload();
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                          >
                            Recarregar
                          </Button>
                        </div>

                        {/* Informações do Sistema */}
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">📋</span>
                            <h4 className="font-medium text-green-800">Info Sistema</h4>
                          </div>
                          <p className="text-sm text-green-700 mb-3">
                            Ver informações detalhadas sobre arquivos e uso do sistema.
                          </p>
                          <Button
                            onClick={async () => {
                              try {
                                const response = await fetch(getBackendUrl('/api/list-pdfs'));
                                const data = await response.json();
                                console.log('📊 Informações do sistema:', data);
                                alert(`Sistema Status:
• Documentos: ${data.files ? data.files.length : 0}
• Backend: Online
• Storage: Operacional
• Última verificação: ${new Date().toLocaleString('pt-BR')}`);
                              } catch (error) {
                                console.error('Erro ao obter informações:', error);
                                alert('Erro ao acessar informações do sistema');
                              }
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full border-green-300 text-green-700 hover:bg-green-100"
                          >
                            Ver Info
                          </Button>
                        </div>

                        {/* Ajuda do Sistema */}
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">❓</span>
                            <h4 className="font-medium text-purple-800">Como Funciona</h4>
                          </div>
                          <p className="text-sm text-purple-700 mb-3">
                            Entenda como o sistema processa e exibe documentos.
                          </p>
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
                              >
                                Ver Ajuda
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="w-[400px] sm:w-[540px]">
                              <SheetHeader>
                                <SheetTitle>📖 Como Funciona o Sistema</SheetTitle>
                                <SheetDescription>
                                  Guia completo de funcionamento do sistema de visualização
                                </SheetDescription>
                              </SheetHeader>
                              <div className="mt-6 space-y-6 max-h-[80vh] overflow-y-auto">
                                <div>
                                  <h3 className="font-semibold mb-2">📄 PLASA (Plano de Serviço)</h3>
                                  <ul className="text-sm space-y-1 text-gray-600">
                                    <li>• PDFs são automaticamente convertidos para imagens</li>
                                    <li>• Rola automaticamente do início ao fim</li>
                                    <li>• Reinicia após intervalo configurável</li>
                                    <li>• Apenas um PLASA ativo por vez</li>
                                    <li>• Velocidade de rolagem configurável</li>
                                  </ul>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">📋 Escalas de Serviço</h3>
                                  <ul className="text-sm space-y-1 text-gray-600">
                                    <li>• Suportam PDFs e imagens diretas</li>
                                    <li>• Alternância automática no intervalo configurado</li>
                                    <li>• Suporte a categorias: Oficiais e Praças</li>
                                    <li>• Múltiplas escalas ativas simultaneamente</li>
                                    <li>• Exibição estática (sem scroll)</li>
                                  </ul>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">📢 Avisos Importantes</h3>
                                  <ul className="text-sm space-y-1 text-gray-600">
                                    <li>• Salvos no servidor backend</li>
                                    <li>• Alternância automática entre múltiplos avisos</li>
                                    <li>• Prioridades: Alta, Média, Baixa</li>
                                    <li>• Período de validade configurável</li>
                                    <li>• Sincronização entre dispositivos</li>
                                  </ul>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">🔧 Conversão PDF para Imagem</h3>
                                  <p className="text-sm text-gray-600">
                                    O sistema converte automaticamente PDFs para imagens (JPG) para máxima 
                                    compatibilidade e evitar problemas de CORS ou fontes faltando. As imagens 
                                    são armazenadas no servidor para carregamento rápido.
                                  </p>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">💡 Dicas de Uso</h3>
                                  <ul className="text-sm space-y-1 text-gray-600">
                                    <li>• Use PDFs com orientação paisagem para melhor qualidade</li>
                                    <li>• Imagens (JPG/PNG) são processadas mais rapidamente</li>
                                    <li>• Sistema mantém cache para performance</li>
                                    <li>• Avisos "Alta" prioridade têm destaque vermelho</li>
                                    <li>• Documentos inativos ficam salvos mas não aparecem</li>
                                  </ul>
                                </div>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              </div>
            </TabsContent>
            
            {/* Sub-aba Automação */}
            <TabsContent value="automacao">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card de Automação BONO já existente */}
              <Card>
                <CardHeader>
                  <CardTitle>⚙️ Configurações do Sistema</CardTitle>
                  <CardDescription>
                    Ajuste os parâmetros de funcionamento do sistema de visualização
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="scrollSpeed">
                      🏃‍♂️ Velocidade de Rolagem do PLASA
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Select value={scrollSpeed} onValueChange={handleScrollSpeedChange}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Velocidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">🐌 Lenta</SelectItem>
                          <SelectItem value="normal">🚶‍♂️ Normal</SelectItem>
                          <SelectItem value="fast">🏃‍♂️ Rápida</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">velocidade de scroll</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Define a velocidade com que o PLASA rola automaticamente pela tela.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="documentAlternateInterval">
                        ⏱️ Intervalo de Alternância entre Escalas (segundos)
                      </Label>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <span className="ml-2 text-blue-500 cursor-help text-sm">[?]</span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <p className="text-sm">
                            Define quanto tempo cada escala (Oficiais/Praças) será exibida antes de alternar para a outra. 
                            Esta configuração só tem efeito quando há mais de uma escala ativa.
                          </p>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input 
                        id="documentAlternateInterval" 
                        type="number" 
                        min="10" 
                        max="300" 
                        className="w-24"
                        value={documentAlternateInterval / 1000}
                        onChange={updateDocumentAlternateInterval}
                      />
                      <span className="text-sm text-muted-foreground">segundos</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recomendado: tempo suficiente para visualizar cada escala completamente.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="autoRestart">
                      🔄 Reinício Automático do PLASA
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        id="autoRestart" 
                        type="number" 
                        min="2" 
                        max="10" 
                        className="w-24"
                        value={autoRestartDelay}
                        onChange={handleAutoRestartChange}
                      />
                      <span className="text-sm text-muted-foreground">segundos no final</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tempo de pausa no final do PLASA antes de reiniciar do topo.
                    </p>
                  </div>
                </CardContent>
              </Card>


                </div>
              </TabsContent>
              
              {/* Sub-aba Militares */}
              <TabsContent value="militares">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>👥 Lista de Militares</CardTitle>
                  <CardDescription>
                    Militares disponíveis para escalas de serviço
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-blue-700">🎖️ Oficiais Disponíveis</h3>
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button size="sm" variant="outline" className="text-blue-600 border-blue-600">
                              ✏️ Editar
                            </Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>Gerenciar Oficiais</SheetTitle>
                              <SheetDescription>
                                Adicione, edite ou remova oficiais da lista
                              </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-4 max-h-96 overflow-y-auto">
                              {(dbOfficers.length > 0 ? dbOfficers : OFFICERS_DATA.map((o, index) => ({ id: index + 1, name: o.name, type: 'officer' as const }))).map((officer) => (
                                <div key={officer.id} className="flex items-center justify-between p-2 border rounded">
                                {editingOfficer?.id === officer.id ? (
  <Input
    value={editingOfficer.name}
    onChange={(e) => setEditingOfficer({
      id: editingOfficer.id,    // ✅ GARANTIDO QUE EXISTE
      name: e.target.value
                                        })}
                                        className="text-sm"
                                        autoFocus
                                      />
                                      <Button 
                                        size="sm" 
                                        onClick={saveEditOfficer}
                                        disabled={!editingOfficer.name.trim()}
                                        className="text-xs"
                                      >
                                        ✅
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={cancelEditOfficer}
                                        className="text-xs"
                                      >
                                        ❌
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="text-sm flex-1">{officer.name}</span>
                                      <div className="flex gap-1">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          className="text-xs"
                                          onClick={() => startEditOfficer(officer.id, officer.name)}
                                        >
                                          ✏️
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive" 
                                          className="text-xs"
                                          onClick={() => removeOfficer(officer.id, officer.name)}
                                        >
                                          🗑️
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 pt-4 border-t">
                              <Input 
                                placeholder="Adicionar novo oficial (ex: CT (IM) NOME)" 
                                className="mb-2"
                                value={newOfficerName}
                                onChange={(e) => setNewOfficerName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addOfficer()}
                              />
                              <Button 
                                className="w-full" 
                                variant="outline"
                                onClick={addOfficer}
                                disabled={!newOfficerName.trim()}
                              >
                                ➕ Adicionar Oficial
                              </Button>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-1 max-h-48 overflow-y-auto">
                        {OFFICERS_DATA.map((officer, index) => (
                          <div key={index} className="text-blue-800">
                            {officer.name}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total: {OFFICERS_DATA.length} oficiais
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-green-700">⭐ Contramesres Disponíveis</h3>
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button size="sm" variant="outline" className="text-green-600 border-green-600">
                              ✏️ Editar
                            </Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>Gerenciar Contramesres</SheetTitle>
                              <SheetDescription>
                                Adicione, edite ou remova Contramesres da lista
                              </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-4 max-h-96 overflow-y-auto">
                              {loadingMilitary ? (
                                <div className="text-center text-sm text-muted-foreground">Carregando militares...</div>
                              ) : (
                                (dbMasters.length > 0 ? dbMasters : MASTERS_DATA.map((m, index) => ({ id: index + 1, name: m.name, type: 'master' as const }))).map((master) => (
                                  <div key={master.id} className="flex items-center justify-between p-2 border rounded">
                                    {editingMaster?.id === master.id ? (
                                      <div className="flex-1 flex items-center gap-2">
                                        <Input
                                          value={editingMaster.name}
                                          onChange={(e) => setEditingMaster({
                                            ...editingMaster,
                                            name: e.target.value
                                          })}
                                          className="text-sm"
                                          autoFocus
                                        />
                                        <Button 
                                          size="sm" 
                                          onClick={saveEditMaster}
                                          disabled={!editingMaster.name.trim()}
                                          className="text-xs"
                                        >
                                          ✅
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={cancelEditMaster}
                                          className="text-xs"
                                        >
                                          ❌
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <span className="text-sm flex-1">{master.name}</span>
                                        <div className="flex gap-1">
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="text-xs"
                                            onClick={() => startEditMaster(master.id, master.name)}
                                          >
                                            ✏️
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="destructive" 
                                            className="text-xs"
                                            onClick={() => removeMaster(master.id, master.name)}
                                          >
                                            🗑️
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                            <div className="mt-4 pt-4 border-t">
                              <Input 
                                placeholder="Adicionar novo contramestre (ex: 1SG NOME)" 
                                className="mb-2"
                                value={newMasterName}
                                onChange={(e) => setNewMasterName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addMaster()}
                              />
                              <Button 
                                className="w-full" 
                                variant="outline"
                                onClick={addMaster}
                                disabled={!newMasterName.trim()}
                              >
                                ➕ Adicionar Contramestre
                              </Button>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-sm space-y-1 max-h-48 overflow-y-auto">
                        {MASTERS_DATA.map((master, index) => (
                          <div key={index} className="text-green-800">
                            {master.name}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total: {MASTERS_DATA.length} Contramesres
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>


            </div>

            {/* Informações sobre como funciona */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>❓ Como Funciona o Sistema</CardTitle>
                <CardDescription>
                  Entenda como o sistema processa e exibe os documentos e avisos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      📄 PLASA (Plano de Serviço)
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      <li>PDFs são automaticamente convertidos para imagens</li>
                      <li>Rola automaticamente e continuamente do início ao fim</li>
                      <li>Reinicia automaticamente após um intervalo configurável</li>
                      <li>Apenas um PLASA é exibido por vez (o mais recente ativo)</li>
                      <li>Velocidade de rolagem é configurável</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      📋 Escalas de Serviço
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      <li>Podem ser PDFs ou imagens diretas</li>
                      <li>São alternadas automaticamente no intervalo configurado</li>
                      <li>Suportam categorias: Oficiais e Praças</li>
                      <li>Múltiplas escalas podem estar ativas simultaneamente</li>
                      <li>Exibição estática (sem scroll automático)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      📢 Avisos Importantes
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      <li>Salvos diretamente no servidor backend</li>
                      <li>Alternância automática entre múltiplos avisos</li>
                      <li>Suporte a prioridades (Alta, Média, Baixa)</li>
                      <li>Período de validade configurável</li>
                      <li>Sincronização entre dispositivos</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-800">🔧 Conversão PDF para Imagem</h4>
                  <p className="text-sm text-blue-700">
                    O sistema converte automaticamente PDFs para imagens (JPG) para garantir máxima compatibilidade 
                    e evitar problemas de CORS, fontes faltando, ou incompatibilidades de navegador. 
                    As imagens são armazenadas no servidor e carregadas rapidamente.
                  </p>
                </div>
                
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2 text-green-800">💡 Dicas de Uso</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-green-700">
                    <li>Para melhor qualidade, use PDFs com orientação paisagem</li>
                    <li>Imagens (JPG/PNG) são processadas mais rapidamente que PDFs</li>
                    <li>O sistema mantém cache das páginas convertidas para performance</li>
                    <li>Avisos com prioridade "Alta" são exibidos com destaque vermelho</li>
                    <li>Documentos inativos permanecem salvos mas não são exibidos</li>
                    <li>Avisos são sincronizados automaticamente com o servidor</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Debug */}
          <TabsContent value="debug">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>🔍 Informações de Debug</CardTitle>
                  <CardDescription>
                    Informações técnicas para diagnóstico de problemas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">🌐 Configuração de Backend</h4>
                    <div className="text-sm font-mono bg-gray-100 p-3 rounded">
                      <div>Host: {import.meta.env.VITE_BACKEND_HOST || 'localhost'}</div>
                      <div>Porta: {import.meta.env.VITE_BACKEND_PORT || '3001'}</div>
                      <div>URL Base: {getBackendUrl('/')}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">📊 Estatísticas</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="font-medium text-blue-800">📄 PLASA/BONO</div>
                        <div>Total: {plasaDocuments.length}</div>
                        <div>Ativos: {plasaDocuments.filter(d => d.active).length}</div>
                        <div>PLASA: {plasaDocuments.filter(d => d.type === "plasa").length}</div>
                        <div>BONO: {plasaDocuments.filter(d => d.type === "bono").length}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="font-medium text-green-800">📋 Escalas/Cardápios</div>
                        <div>Total: {escalaDocuments.length}</div>
                        <div>Ativos: {escalaDocuments.filter(d => d.active).length}</div>
                        <div>Escalas: {escalaDocuments.filter(d => d.type === "escala").length}</div>
                        <div>Cardápios: {escalaDocuments.filter(d => d.type === "cardapio").length}</div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-3 rounded text-sm mt-4">
                      <div className="font-medium text-yellow-800">📢 Avisos</div>
                      <div>Total: {notices.length}</div>
                      <div>Ativos: {notices.filter(n => n.active).length}</div>
                      <div>Do Servidor: {notices.filter(n => !n.id.startsWith('local-')).length}</div>
                      <div>Locais: {notices.filter(n => n.id.startsWith('local-')).length}</div>
                      <div>Carregando: {isLoading ? "Sim" : "Não"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🛠️ Ferramentas de Teste</CardTitle>
                  <CardDescription>
                    Teste as conexões e funcionalidades do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={async () => {
                      try {
                        const response = await fetch(getBackendUrl('/api/status'));
                        const data = await response.json();
                        toast({
                          title: "✅ Backend Online",
                          description: `Servidor funcionando na versão ${data.version}`
                        });
                      } catch (error) {
                        toast({
                          title: "❌ Erro de Conexão",
                          description: "Não foi possível conectar com o backend",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    🔗 Testar Conexão Backend
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={async () => {
                      try {
                        const response = await fetch(getBackendUrl('/api/notices'));
                        const data = await response.json();
                        toast({
                          title: "📢 Avisos Carregados",
                          description: `${data.notices?.length || 0} avisos encontrados no servidor`
                        });
                        console.log("📢 Avisos do servidor:", data);
                      } catch (error) {
                        toast({
                          title: "❌ Erro ao Carregar Avisos",
                          description: "Não foi possível carregar avisos do servidor",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    📢 Testar Carregamento de Avisos
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={async () => {
                      try {
                        const response = await fetch(getBackendUrl('/api/list-pdfs'));
                        const data = await response.json();
                        toast({
                          title: "📄 Documentos Listados",
                          description: `${data.total} documentos encontrados no servidor`
                        });
                        console.log("📄 Documentos do servidor:", data);
                      } catch (error) {
                        toast({
                          title: "❌ Erro ao Listar",
                          description: "Não foi possível listar documentos",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    📋 Listar Documentos do Servidor
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      console.log("🔍 DEBUG - Estado do Contexto:");
                      console.log("PLASA Docs:", plasaDocuments);
                      console.log("Escala Docs:", escalaDocuments);
                      console.log("Notices:", notices);
                      console.log("Loading:", isLoading);
                      toast({
                        title: "🔍 Debug",
                        description: "Informações enviadas para o console (F12)"
                      });
                    }}
                  >
                    🖥️ Mostrar Estado no Console
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      toast({
                        title: "🧹 Storage Limpo",
                        description: "localStorage e sessionStorage foram limpos"
                      });
                    }}
                  >
                    🗑️ Limpar Storage do Navegador
                  </Button>

                  <div className="p-3 bg-gray-50 rounded text-xs font-mono">
                    <div className="font-medium mb-2">Comandos do Console:</div>
                    <div>• fetch('{getBackendUrl('/api/status')}').then(r={">"}r.json()).then(console.log)</div>
                    <div>• fetch('{getBackendUrl('/api/notices')}').then(r={">"}r.json()).then(console.log)</div>
                    <div>• window.location.reload() // Recarregar página</div>
                  </div>
                </CardContent>
              </Card>
               {/* Cardápio Documents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🍽️ Cardápios Semanais
                      <span className="text-sm font-normal text-gray-500">
                        ({escalaDocuments.filter(doc => doc.type === "cardapio").length})
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Cardápios da Semana - Exibição estática
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {escalaDocuments.filter(doc => doc.type === "cardapio").length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhum cardápio cadastrado.
                      </p>
                    ) : (
                      <ul className="space-y-2 max-h-64 overflow-y-auto">
                        {escalaDocuments.filter(doc => doc.type === "cardapio").map((doc) => (
                          <li key={doc.id} className="border rounded-md p-3 flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">🍽️</span>
                                <p className="font-medium truncate">{doc.title}</p>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  📅 {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                                </span>
                                {doc.url.includes('/uploads/') && (
                                  <span className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                    🌐 Servidor
                                  </span>
                                )}
                                <span className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                                  📊 Estático
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button 
                                variant={doc.active ? "default" : "outline"} 
                                size="sm"
                                onClick={() => toggleDocActive(doc)}
                                title={doc.active ? "Cardápio ativo" : "Cardápio inativo"}
                              >
                                {doc.active ? "✅" : "💤"}
                              </Button>
                              <Sheet>
                                <SheetTrigger asChild>
                                  <Button variant="outline" size="sm" title="Visualizar cardápio">👁️</Button>
                                </SheetTrigger>
                                <SheetContent className="w-[85vw] sm:max-w-4xl">
                                  <SheetHeader>
                                    <SheetTitle>🍽️ {doc.title}</SheetTitle>
                                    <SheetDescription>
                                      Visualização prévia do cardápio semanal
                                    </SheetDescription>
                                  </SheetHeader>
                                  <div className="mt-6 h-[80vh]">
                                    <iframe 
                                      src={doc.url} 
                                      className="w-full h-full border rounded"
                                      title={doc.title}
                                    />
                                  </div>
                                </SheetContent>
                              </Sheet>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => removeDocument(doc.id)}
                                title="Remover cardápio"
                              >
                                🗑️
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>


      </Tabs>

      </div>
    </div>
  );
};

export default Admin;