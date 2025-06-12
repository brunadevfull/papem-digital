import React from "react";
import PDFViewer from "@/components/PDFViewer";
import NoticeDisplay from "@/components/NoticeDisplay";
import { useDisplay } from "@/context/DisplayContext";

const Index = () => {
  const { 
    activePlasaDoc, 
    activeEscalaDoc,
    scrollSpeed = "normal",
    autoRestartDelay = 3
  } = useDisplay();

  console.log("🏠 Index: Renderizando página principal", {
    activePlasa: activePlasaDoc?.title || 'nenhum',
    activeEscala: activeEscalaDoc?.title || 'nenhum',
    scrollSpeed,
    autoRestartDelay
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-dark to-navy flex flex-col p-2">
      {/* Header compacto com brasão */}
      <header className="bg-white rounded-lg shadow-lg p-2 mb-2 flex items-center justify-between">
        <div className="flex items-center">
          {/* Brasão da Marinha do Brasil */}
          <div className="w-12 h-12 mr-3 flex items-center justify-center">
            <img 
              src="/brasao-marinha.png" 
              alt="Brasão da Marinha do Brasil"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback caso não encontre o brasão
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-12 h-12 bg-navy flex items-center justify-center rounded-full"><div class="text-gold text-lg font-bold">MB</div></div>';
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-navy">Marinha do Brasil - PAPEM</h1>
            <p className="text-sm text-navy-light">Sistema de Visualização</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-bold text-navy">Documentos Oficiais</p>
          <p className="text-xs text-navy-light">{new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </header>
      
      {/* Main content area com mais espaço - 60% / 40% split */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden">
        {/* Left side - PLASA (60%) com mais altura */}
        <div className="lg:w-3/5 h-[calc(100vh-8rem)] min-h-[600px]">
          <PDFViewer 
            documentType="plasa" 
            title={activePlasaDoc?.title || "PLASA - Plano de Serviço Semanal"}
            scrollSpeed={scrollSpeed}
            autoRestartDelay={autoRestartDelay}
          />
        </div>
        
        {/* Right side - Escala and Notices (40%) */}
        <div className="lg:w-2/5 h-[calc(100vh-8rem)] min-h-[600px] flex flex-col gap-3">
          {/* Escala de Serviço - top 65% of right side (mais espaço) */}
          <div className="h-2/3 min-h-[400px]">
            <PDFViewer 
              documentType="escala" 
              title={activeEscalaDoc?.title || "Escala de Serviço Semanal"}
            />
          </div>
          
          {/* Notices - bottom 35% of right side */}
          <div className="h-1/3 min-h-[180px]">
            <NoticeDisplay />
          </div>
        </div>
      </div>
      
      {/* Footer compacto */}
      <footer className="mt-2 bg-white rounded-lg shadow-lg p-1 text-center text-xs text-navy-light">
        <p>&copy; {new Date().getFullYear()} Marinha do Brasil - PAPEM</p>
      </footer>
    </div>
  );
};

export default Index;