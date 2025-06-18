import React, { useEffect, useState, useRef } from "react";
import PDFViewer from "@/components/PDFViewer";
import NoticeDisplay from "@/components/NoticeDisplay";
import { useDisplay } from "@/context/DisplayContext";
import { Activity, Wifi, WifiOff, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState({ day: "", month: "", weekday: "" });
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [systemHealth, setSystemHealth] = useState(100);
  const wsRef = useRef<WebSocket | null>(null);
  
  const {
    activePlasaDoc,
    activeEscalaDoc,
    notices,
    scrollSpeed = "normal",
    autoRestartDelay = 3
  } = useDisplay();

  console.log("🏠 Index: Renderizando página principal", {
    activePlasa: activePlasaDoc?.title || 'nenhum',
    activeEscala: activeEscalaDoc?.title || 'nenhum',
    scrollSpeed,
    autoRestartDelay
  });

  // Função para obter horário atual
  const updateTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }));
    
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const weekday = now.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
    setCurrentDate({ day, month, weekday });
  };

  // WebSocket para notificações em tempo real
  const connectWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        setSystemHealth(100);
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setSystemHealth(75);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        setConnectionStatus('disconnected');
        setSystemHealth(50);
      };

    } catch (error) {
      setConnectionStatus('disconnected');
      setSystemHealth(25);
    }
  };

  // Initialize
  useEffect(() => {
    updateTime();
    connectWebSocket();
    
    const timeInterval = setInterval(updateTime, 1000);
    
    return () => {
      clearInterval(timeInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const activeNotices = notices.filter(n => n.active);
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 flex flex-col p-4">
      {/* Header simplificado para TV */}
      <header className="relative flex items-center justify-between px-8 py-6 bg-blue-900/40 backdrop-blur-md rounded-xl mb-6 border border-blue-600/30">
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
            <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-200 dark:from-blue-100 dark:via-cyan-100 dark:to-white bg-clip-text text-transparent hover:from-cyan-200 hover:to-white transition-all duration-700">
              Marinha do Brasil - PAPEM
            </h1>
            <p className="text-sm text-blue-300/90 dark:text-blue-200/80 font-medium tracking-wide">
              Sistema de Visualização Operacional
            </p>
          </div>
        </div>

        {/* Data e Hora para TV */}
        <div className="flex items-center space-x-6 relative z-10">
          {/* Data */}
          <div className="text-center">
            <div className="text-sm text-blue-200 font-medium uppercase tracking-wider">
              {currentDate.weekday}
            </div>
            <div className="text-xl text-white font-bold">
              {currentDate.day}/{currentDate.month}
            </div>
          </div>

          {/* Display de horário */}
          <div className="px-6 py-3 bg-blue-800/60 rounded-lg border border-blue-600/40">
            <div className="text-3xl font-mono font-bold text-white tabular-nums tracking-wider">
              {currentTime}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content com layout melhorado */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* PLASA - Lado esquerdo (60%) */}
        <div className="lg:w-3/5 h-[calc(100vh-9rem)] min-h-[650px]">
          <div className="h-full bg-blue-800/30 backdrop-blur-sm rounded-xl border border-blue-600/30 overflow-hidden">
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
            <div className="h-full bg-blue-800/30 backdrop-blur-sm rounded-xl border border-blue-600/30 overflow-hidden">
              <PDFViewer
                documentType="escala"
                title={activeEscalaDoc?.title || "Escala de Serviço Semanal"}
              />
            </div>
          </div>

          {/* Avisos Importantes - 35% da altura */}
          <div className="h-[35%] min-h-[200px]">
            <div className="h-full bg-blue-800/30 backdrop-blur-sm rounded-xl border border-blue-600/30 overflow-hidden">
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