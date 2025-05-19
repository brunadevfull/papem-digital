
import React from "react";
import PDFViewer from "@/components/PDFViewer";
import NoticeDisplay from "@/components/NoticeDisplay";
import { useDisplay } from "@/context/DisplayContext";

const Index = () => {
  const { activePlasaDoc, activeEscalaDoc } = useDisplay();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-dark to-navy flex flex-col p-4">
      {/* Header with Navy logo and title */}
      <header className="bg-white rounded-lg shadow-lg p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-navy flex items-center justify-center rounded-full mr-4">
            <div className="text-gold text-2xl font-bold">MB</div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Marinha do Brasil</h1>
            <p className="text-navy-light">Pagadoria de Pessoal da Marinha (PAPEM)</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xl font-bold text-navy">Sistema de Visualização</p>
          <p className="text-navy-light">Documentos Oficiais</p>
        </div>
      </header>
      
      {/* Main content area with 60% / 40% split */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4">
        {/* Left side - PLASA (60%) */}
        <div className="lg:w-3/5 h-[calc(100vh-12rem)]">
          <PDFViewer 
            documentType="plasa" 
            title={activePlasaDoc?.title || "PLASA - Plano de Serviço"} 
          />
        </div>
        
        {/* Right side - Escala and Notices (40%) */}
        <div className="lg:w-2/5 h-[calc(100vh-12rem)] flex flex-col gap-4">
          {/* Escala de Serviço - top 60% of right side */}
          <div className="h-3/5">
            <PDFViewer 
              documentType="escala" 
              title={activeEscalaDoc?.title || "Escala de Serviço"} 
            />
          </div>
          
          {/* Notices - bottom 40% of right side */}
          <div className="h-2/5">
            <NoticeDisplay />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-4 bg-white rounded-lg shadow-lg p-2 text-center text-navy-light">
        <p>&copy; {new Date().getFullYear()} Marinha do Brasil - PAPEM</p>
      </footer>
    </div>
  );
};

export default Index;
