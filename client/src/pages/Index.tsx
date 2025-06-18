import React, { useState, useEffect } from "react";
import PDFViewer from "@/components/PDFViewer";
import NoticeDisplay from "@/components/NoticeDisplay";
import { useDisplay } from "@/context/DisplayContext";
import { getSunsetWithLabel } from "@/utils/sunsetUtils";

const Index = () => {
  const {
    activePlasaDoc,
    activeEscalaDoc,
    scrollSpeed = "normal",
    autoRestartDelay = 3
  } = useDisplay();

  const [sunsetTime, setSunsetTime] = useState<string>("--:--");

  // Buscar horário do pôr do sol
  useEffect(() => {
    const fetchSunset = async () => {
      try {
        const sunset = await getSunsetWithLabel();
        setSunsetTime(sunset);
      } catch (error) {
        console.error('Erro ao buscar pôr do sol:', error);
        setSunsetTime("Pôr do sol: --:--");
      }
    };

    fetchSunset();
    
    // Atualizar a cada hora
    const interval = setInterval(fetchSunset, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  console.log("🏠 Index: Renderizando página principal", {
    activePlasa: activePlasaDoc?.title || 'nenhum',
    activeEscala: activeEscalaDoc?.title || 'nenhum',
    scrollSpeed,
    autoRestartDelay
  });

  // Função para obter horário atual
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Função para obter data atual
  const getCurrentDate = () => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const weekday = now.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
    return { day, month, weekday };
  };

  const currentDate = getCurrentDate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 flex flex-col p-3">
      {/* Header Premium */}
      <header className="relative flex items-center justify-between px-8 py-4 bg-gradient-to-r from-slate-800/90 via-blue-900/80 to-slate-800/90 backdrop-blur-3xl rounded-2xl mb-4 shadow-2xl border border-blue-400/30 hover:border-blue-400/50 transition-all duration-500">
        {/* Efeito de brilho sutil */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/8 to-transparent rounded-2xl"></div>
        
        <div className="flex items-center space-x-5 relative z-10">
          {/* Brasão da Marinha com fallback melhorado */}
          <div className="w-14 h-14 flex items-center justify-center relative group">
            <img 
              src="/brasao-marinha.png" 
              alt="Brasão da Marinha do Brasil"
              className="w-full h-full object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback elegante caso não encontre o brasão
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-14 h-14 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center rounded-full shadow-2xl border-2 border-amber-400/60 hover:border-amber-400 transition-all duration-300 group-hover:scale-105">
                      <div class="text-amber-300 text-lg font-bold tracking-wider drop-shadow-md">MB</div>
                    </div>
                  `;
                }
              }}
            />
          </div>

          {/* Título com animação de gradiente */}
          <div className="space-y-1">
            <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent hover:from-cyan-200 hover:to-white transition-all duration-700">
              Marinha do Brasil - PAPEM
            </h1>
            <p className="text-sm text-blue-300/90 font-medium tracking-wide">
              Sistema de Visualização Operacional
            </p>

          </div>
        </div>

        {/* Data e Hora Melhorada */}
        <div className="flex items-center space-x-6 relative z-10">
          {/* Data Completa */}
          <div className="text-right">
            <div className="text-blue-200 text-xs font-medium tracking-widest uppercase">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}
            </div>
            <div className="text-white text-lg font-semibold">
              {new Date().toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
          </div>
          
          {/* Separador elegante */}
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-blue-400/60 to-transparent shadow-lg"></div>
          
          {/* Horário Digital Melhorado */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl px-6 py-3 border border-blue-400/30 shadow-inner">
            <div className="text-blue-200 text-xs font-medium tracking-widest uppercase text-center mb-1">
              Hora Oficial
            </div>
            <div className="text-white font-mono text-3xl font-bold tracking-wider text-center">
              {new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
              })}
            </div>
            {/* Horário do Pôr do Sol */}
            <div className="text-amber-300 text-xs font-medium text-center mt-2 opacity-90">
              🌅 {sunsetTime}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content com layout melhorado */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* PLASA - Lado esquerdo (60%) */}
        <div className="lg:w-3/5 h-[calc(100vh-9rem)] min-h-[650px]">
          <div className="h-full bg-gradient-to-br from-white/5 via-blue-900/20 to-white/5 backdrop-blur-sm rounded-2xl border border-blue-400/25 shadow-2xl hover:border-blue-400/40 transition-all duration-500 overflow-hidden">
            <PDFViewer
              documentType="plasa"
              title={activePlasaDoc?.title || "PLASA - Plano de Serviço Semanal"}
              scrollSpeed={scrollSpeed}
              autoRestartDelay={autoRestartDelay}
            />
          </div>
        </div>

        {/* Lado direito - Escala e Avisos (40%) */}
        <div className="lg:w-2/5 h-[calc(100vh-9rem)] min-h-[650px] flex flex-col gap-4">
          {/* Escala de Serviço - 65% da altura */}
          <div className="h-[65%] min-h-[420px]">
            <div className="h-full bg-gradient-to-br from-white/5 via-blue-900/20 to-white/5 backdrop-blur-sm rounded-2xl border border-blue-400/25 shadow-2xl hover:border-blue-400/40 transition-all duration-500 overflow-hidden">
              <PDFViewer
                documentType="escala"
                title={activeEscalaDoc?.title || "Escala de Serviço Semanal"}
              />
            </div>
          </div>

          {/* Avisos Importantes - 35% da altura */}
          <div className="h-[35%] min-h-[200px]">
            <div className="h-full bg-gradient-to-br from-amber-900/20 to-orange-900/20 backdrop-blur-sm rounded-2xl border border-amber-400/30 shadow-2xl hover:border-amber-400/50 transition-all duration-500 overflow-hidden">
              <NoticeDisplay />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Premium */}
      <footer className="mt-4 bg-gradient-to-r from-slate-800/70 to-blue-900/70 backdrop-blur-xl rounded-xl shadow-xl border border-blue-400/25 py-2 px-4 text-center">
        <p className="text-xs text-blue-200/80 font-medium">
          &copy; {new Date().getFullYear()} Marinha do Brasil - PAPEM | Sistema Operacional v2.0
        </p>
      </footer>
    </div>
  );
};

export default Index;