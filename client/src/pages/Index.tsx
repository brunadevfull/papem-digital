import React, { useState, useEffect } from "react";
import PDFViewer from "@/components/PDFViewer";
import NoticeDisplay from "@/components/NoticeDisplay";
import { TemperatureDisplay } from "@/components/TemperatureDisplay";
import { DutyOfficersDisplay } from "@/components/DutyOfficersDisplay";
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
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState({
    day: "",
    month: "",
    weekday: ""
  });

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

  // Atualizar horário e data em tempo real
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Atualizar horário
      const timeString = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      });
      setCurrentTime(timeString);

      // Atualizar data
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const weekday = now.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
      
      setCurrentDate({ day, month, weekday });
    };

    // Atualizar imediatamente
    updateDateTime();
    
    // Configurar timer para atualizar a cada segundo
    const clockInterval = setInterval(updateDateTime, 1000);
    
    // Cleanup do timer
    return () => clearInterval(clockInterval);
  }, []);

  console.log("🏠 Index: Renderizando página principal", {
    activePlasa: activePlasaDoc?.title || 'nenhum',
    activeEscala: activeEscalaDoc?.title || 'nenhum',
    scrollSpeed,
    autoRestartDelay
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 flex flex-col p-2 sm:p-3 lg:p-4">
      {/* Header Compacto */}
      <header className="relative flex flex-col lg:flex-row items-center justify-between mb-3 p-3 bg-gradient-to-r from-slate-800/80 to-blue-900/80 backdrop-blur-xl rounded-lg shadow-xl border border-blue-400/30">
        {/* Logo e título */}
        <div className="flex items-center space-x-3 mb-2 lg:mb-0">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">⚓</span>
            </div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white shadow-lg animate-pulse"></div>
          </div>
          
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-300 to-white bg-clip-text text-transparent">
              PAPEM - Sistema Operacional
            </h1>
            <p className="text-blue-200/80 text-xs">Sistema de Visualização de Documentos</p>
          </div>
        </div>

        {/* Informações em linha horizontal - Layout corrigido */}
        <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-6 w-full">
          {/* Espaço vazio à esquerda para centralizar oficiais */}
          <div className="hidden lg:block flex-1"></div>
          
          {/* Oficiais de Serviço - Posição central */}
          <div className="flex-shrink-0">
            <DutyOfficersDisplay />
          </div>
          
          {/* Temperatura - Direita */}
          <div className="flex-1 flex justify-end">
            <TemperatureDisplay />
          </div>
          
          {/* Data e Hora */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-blue-200 text-xs font-medium uppercase">
                {currentDate.weekday}
              </div>
              <div className="text-white text-sm font-semibold">
                {new Date().toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </div>
            </div>
            
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-400/30">
              <div className="text-blue-200 text-xs uppercase text-center">
                Hora Oficial
              </div>
              <div className="text-white font-mono font-bold text-center text-lg">
                {currentTime}
              </div>
              <div className="text-amber-300 text-xs text-center opacity-90">
                🌅 {sunsetTime}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Responsivo */}
      <div className="flex-1 flex flex-col xl:flex-row gap-2 sm:gap-3 lg:gap-4 overflow-hidden">
        {/* PLASA - Adaptativo por tamanho de tela */}
        <div className="xl:w-3/5 w-full h-[45vh] xl:h-[calc(100vh-8rem)] min-h-[300px] xl:min-h-[500px]">
          <div className="h-full bg-gradient-to-br from-white/5 via-blue-900/20 to-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-blue-400/25 shadow-2xl hover:border-blue-400/40 transition-all duration-500 overflow-hidden">
            <PDFViewer
              documentType="plasa"
              title={activePlasaDoc?.title || "PLASA - Plano de Serviço Semanal"}
              scrollSpeed={scrollSpeed}
              autoRestartDelay={autoRestartDelay}
            />
          </div>
        </div>

        {/* Lado direito - Escala e Avisos */}
        <div className="xl:w-2/5 w-full h-[50vh] xl:h-[calc(100vh-8rem)] flex flex-col gap-2 sm:gap-3 lg:gap-4">
          {/* Escala de Serviço */}
          <div className="h-[65%] min-h-[200px] xl:min-h-[320px]">
            <div className="h-full bg-gradient-to-br from-white/5 via-blue-900/20 to-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-blue-400/25 shadow-2xl hover:border-blue-400/40 transition-all duration-500 overflow-hidden">
              <PDFViewer
                documentType="escala"
                title={activeEscalaDoc?.title || "Escala de Serviço Semanal"}
              />
            </div>
          </div>

          {/* Avisos Importantes */}
          <div className="h-[35%] min-h-[120px] xl:min-h-[180px]">
            <div className="h-full bg-gradient-to-br from-amber-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-amber-400/30 shadow-2xl hover:border-amber-400/50 transition-all duration-500 overflow-hidden">
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