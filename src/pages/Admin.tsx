
import React, { useState } from "react";
import { Link } from "react-router-dom";
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

const Admin = () => {
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
    pageChangeInterval,
    documentAlternateInterval,
    setPageChangeInterval,
    setDocumentAlternateInterval
  } = useDisplay();
  
  const { toast } = useToast();
  
  // Form states
  const [newNotice, setNewNotice] = useState<Omit<Notice, "id">>({
    title: "",
    content: "",
    priority: "medium",
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000), // Default to 1 day
    active: true
  });
  
  const [selectedDocType, setSelectedDocType] = useState<"plasa" | "escala">("plasa");
  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docCategory, setDocCategory] = useState<"oficial" | "praca" | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Form handlers
  const handleNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNotice.title || !newNotice.content) {
      toast({
        title: "Erro",
        description: "Título e conteúdo são obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    addNotice(newNotice);
    
    toast({
      title: "Sucesso",
      description: "Aviso adicionado com sucesso."
    });
    
    // Reset form
    setNewNotice({
      title: "",
      content: "",
      priority: "medium",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      active: true
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Auto-populate title from filename if empty
      if (!docTitle) {
        let fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
        setDocTitle(fileName);
      }
      
      // In a real application, we'd upload to a server and get a URL
      // For demo purposes, create an object URL
      const fileUrl = URL.createObjectURL(file);
      setDocUrl(fileUrl);
    }
  };
  
  const handleDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!docTitle || (!docUrl && !selectedFile)) {
      toast({
        title: "Erro",
        description: "Título e arquivo do documento são obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    // For escala docs, category is required
    if (selectedDocType === "escala" && !docCategory) {
      toast({
        title: "Erro",
        description: "Selecione a categoria da escala (Oficial ou Praça).",
        variant: "destructive"
      });
      return;
    }
    
    addDocument({
      title: docTitle,
      url: docUrl,
      type: selectedDocType,
      category: selectedDocType === "escala" ? docCategory : undefined,
      active: true
    });
    
    toast({
      title: "Sucesso",
      description: "Documento adicionado com sucesso."
    });
    
    // Reset form
    setDocTitle("");
    setDocUrl("");
    setSelectedFile(null);
    setDocCategory(undefined);
  };
  
  const toggleNoticeActive = (notice: Notice) => {
    updateNotice({ ...notice, active: !notice.active });
    toast({
      title: notice.active ? "Aviso desativado" : "Aviso ativado",
      description: `O aviso "${notice.title}" foi ${notice.active ? "desativado" : "ativado"}.`
    });
  };
  
  const toggleDocActive = (doc: PDFDocument) => {
    updateDocument({ ...doc, active: !doc.active });
    toast({
      title: doc.active ? "Documento desativado" : "Documento ativado",
      description: `O documento "${doc.title}" foi ${doc.active ? "desativado" : "ativado"}.`
    });
  };
  
  const removeNotice = (id: string) => {
    if (confirm("Tem certeza que deseja remover este aviso?")) {
      deleteNotice(id);
      toast({
        title: "Aviso removido",
        description: "O aviso foi removido com sucesso."
      });
    }
  };
  
  const removeDocument = (id: string) => {
    if (confirm("Tem certeza que deseja remover este documento?")) {
      deleteDocument(id);
      toast({
        title: "Documento removido",
        description: "O documento foi removido com sucesso."
      });
    }
  };
  
  const updatePageInterval = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 5 && value <= 60) {
      setPageChangeInterval(value * 1000);
      toast({
        title: "Intervalo atualizado",
        description: `Páginas agora mudam a cada ${value} segundos.`
      });
    }
  };
  
  const updateDocumentAlternateInterval = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 10 && value <= 300) {
      setDocumentAlternateInterval(value * 1000);
      toast({
        title: "Intervalo de alternância atualizado",
        description: `Documentos agora alternam a cada ${value} segundos.`
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="bg-navy text-white p-4 rounded-lg shadow-lg mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-gray-200">Gerencie documentos e avisos do sistema de visualização</p>
          </div>
          <Link to="/">
            <Button variant="secondary">
              Visualizar Sistema
            </Button>
          </Link>
        </header>
        
        <Tabs defaultValue="documentos" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="documentos" className="flex-1">Documentos</TabsTrigger>
            <TabsTrigger value="avisos" className="flex-1">Avisos</TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex-1">Configurações</TabsTrigger>
          </TabsList>
          
          {/* Documents Tab */}
          <TabsContent value="documentos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload New Document Form */}
              <Card className="border-navy">
                <CardHeader className="bg-navy text-white">
                  <CardTitle>Adicionar Novo Documento</CardTitle>
                  <CardDescription className="text-gray-200">
                    Envie um novo documento PDF para o sistema
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleDocumentSubmit}>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="docType">Tipo de Documento</Label>
                      <Select 
                        value={selectedDocType} 
                        onValueChange={(value) => {
                          setSelectedDocType(value as "plasa" | "escala");
                          // Reset category when switching to PLASA
                          if (value === "plasa") {
                            setDocCategory(undefined);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plasa">PLASA - Plano de Serviço</SelectItem>
                          <SelectItem value="escala">Escala de Serviço</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Category selector for Escala documents */}
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
                            <SelectItem value="oficial">Oficiais</SelectItem>
                            <SelectItem value="praca">Praças</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="docTitle">Título do Documento</Label>
                      <Input 
                        id="docTitle" 
                        placeholder={`Ex: ${selectedDocType === "plasa" ? "PLASA - Maio 2025" : "Escala de Serviço - Maio 2025"}`}
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="docFile">Arquivo do Documento (PDF)</Label>
                      <Input 
                        id="docFile"
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        {selectedFile ? `Arquivo selecionado: ${selectedFile.name}` : "Nenhum arquivo selecionado"}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="docUrl">URL do Documento (alternativo)</Label>
                      <Input 
                        id="docUrl" 
                        placeholder="https://exemplo.com/documento.pdf"
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        type="url"
                      />
                      <p className="text-xs text-muted-foreground">
                        Se você não tiver um arquivo para upload, pode fornecer uma URL.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full bg-navy hover:bg-navy-light">
                      Adicionar Documento
                    </Button>
                  </CardFooter>
                </form>
              </Card>
              
              {/* Document Lists */}
              <div className="space-y-6">
                {/* PLASA Documents */}
                <Card>
                  <CardHeader>
                    <CardTitle>Documentos PLASA</CardTitle>
                    <CardDescription>
                      Planos de Serviço disponíveis no sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {plasaDocuments.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhum documento PLASA cadastrado.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {plasaDocuments.map((doc) => (
                          <li key={doc.id} className="border rounded-md p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant={doc.active ? "default" : "outline"} 
                                size="sm"
                                onClick={() => toggleDocActive(doc)}
                              >
                                {doc.active ? "Ativo" : "Inativo"}
                              </Button>
                              <Sheet>
                                <SheetTrigger asChild>
                                  <Button variant="outline" size="sm">Visualizar</Button>
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
                              >
                                Remover
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
                
                {/* Escala Documents */}
                <Card>
                  <CardHeader>
                    <CardTitle>Documentos de Escala</CardTitle>
                    <CardDescription>
                      Escalas de Serviço disponíveis no sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {escalaDocuments.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhum documento de Escala cadastrado.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {escalaDocuments.map((doc) => (
                          <li key={doc.id} className="border rounded-md p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">
                                {doc.title}
                                {doc.category && (
                                  <span className="ml-2 text-xs bg-navy text-white px-2 py-0.5 rounded-full">
                                    {doc.category === "oficial" ? "Oficiais" : "Praças"}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant={doc.active ? "default" : "outline"} 
                                size="sm"
                                onClick={() => toggleDocActive(doc)}
                              >
                                {doc.active ? "Ativo" : "Inativo"}
                              </Button>
                              <Sheet>
                                <SheetTrigger asChild>
                                  <Button variant="outline" size="sm">Visualizar</Button>
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
                              >
                                Remover
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
          </TabsContent>
          
          {/* Notices Tab */}
          <TabsContent value="avisos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* New Notice Form */}
              <Card className="border-navy">
                <CardHeader className="bg-navy text-white">
                  <CardTitle>Adicionar Novo Aviso</CardTitle>
                  <CardDescription className="text-gray-200">
                    Crie um novo aviso para exibir no sistema
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
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="noticePriority">Prioridade</Label>
                      <Select 
                        value={newNotice.priority} 
                        onValueChange={(value) => setNewNotice({...newNotice, priority: value as "high" | "medium" | "low"})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="low">Baixa</SelectItem>
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
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full bg-navy hover:bg-navy-light">
                      Adicionar Aviso
                    </Button>
                  </CardFooter>
                </form>
              </Card>
              
              {/* Notice List */}
              <Card>
                <CardHeader>
                  <CardTitle>Avisos Cadastrados</CardTitle>
                  <CardDescription>
                    Gerencie os avisos existentes no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {notices.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum aviso cadastrado.
                    </p>
                  ) : (
                    <ul className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {notices.map((notice) => (
                        <li key={notice.id} className={`border-l-4 ${
                          notice.priority === "high" ? "border-priority-high" :
                          notice.priority === "medium" ? "border-priority-medium" :
                          "border-priority-low"
                        } rounded-md p-4 bg-white shadow-sm`}>
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{notice.title}</h3>
                            <div className="flex gap-1">
                              <Button 
                                variant={notice.active ? "default" : "outline"} 
                                size="sm" 
                                onClick={() => toggleNoticeActive(notice)}
                              >
                                {notice.active ? "Ativo" : "Inativo"}
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => removeNotice(notice.id)}
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 my-2">{notice.content}</p>
                          <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                            <span>
                              Prioridade: {
                                notice.priority === "high" ? "Alta" :
                                notice.priority === "medium" ? "Média" : "Baixa"
                              }
                            </span>
                            <span>
                              {new Date(notice.startDate).toLocaleDateString('pt-BR')} até {new Date(notice.endDate).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="configuracoes">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>
                  Ajuste os parâmetros de funcionamento do sistema de visualização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="pageInterval">
                    Intervalo de Troca de Páginas (segundos)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      id="pageInterval" 
                      type="number" 
                      min="5" 
                      max="60" 
                      className="w-24"
                      value={pageChangeInterval / 1000}
                      onChange={updatePageInterval}
                    />
                    <span className="text-sm text-muted-foreground">segundos</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Define quanto tempo cada página do PDF será exibida antes de mudar para a próxima.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="documentAlternateInterval">
                      Intervalo de Alternância entre Escalas (segundos)
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
                    Recomendado: tempo suficiente para visualizar todas as páginas de cada documento.
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Instruções Gerais</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    <li>Todos os documentos devem estar no formato PDF.</li>
                    <li>Para melhor visualização, recomenda-se que os documentos tenham orientação paisagem.</li>
                    <li>É possível ter múltiplos documentos ativos de cada tipo, que serão alternados automaticamente.</li>
                    <li>As escalas de Oficiais e Praças serão alternadas automaticamente no intervalo configurado.</li>
                    <li>Avisos com prioridade "Alta" serão exibidos com destaque em vermelho.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
