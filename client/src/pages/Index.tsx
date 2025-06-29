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
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState({
    day: "",
    month: "",
    weekday: ""
  });
  const [temperature, setTemperature] = useState<string>("--°C");
  const [officialDuty, setOfficialDuty] = useState<string>("Oficial do Dia: Não definido");
  const [quartermasterNight, setQuartermasterNight] = useState<string>("Contramestre de Pernoite: Não definido");
  
  // Estados para os dados dos militares individuais
  const [oficialDiaData, setOficialDiaData] = useState<{rank: string, name: string}>({rank: "...", name: "Carregando..."});
  const [contramestreData, setContramestreData] = useState<{rank: string, name: string}>({rank: "...", name: "Carregando..."});

  // Estado para dados extraídos das escalas
  const [escalaExtractedData, setEscalaExtractedData] = useState<any>(null);

  useEffect(() => {
    const fetchTemperature = async () => {
      try {
        console.log('🌡️ Buscando temperatura...');
        
        // OPÇÃO 1: API gratuita alternativa (sem chave necessária)
        try {
          const response = await fetch(
            'https://wttr.in/Rio+de+Janeiro?format=j1'
          );
          
          if (response.ok) {
            const data = await response.json();
            const temp = data.current_condition[0].temp_C;
            setTemperature(`${temp}°C`);
            console.log('✅ Temperatura obtida via wttr.in:', `${temp}°C`);
            return;
          }
        } catch (error) {
          console.warn('⚠️ Falha na API wttr.in:', error);
        }

        // OPÇÃO 2: Fallback para temperatura estimada baseada na época do ano
        console.log('🔄 Usando temperatura estimada...');
        const now = new Date();
        const month = now.getMonth() + 1;
        const hour = now.getHours();
        
        let estimatedTemp = 25; // Temperatura base para Rio de Janeiro
        
        // Ajustar por estação do ano (hemisfério sul)
        if (month >= 12 || month <= 2) estimatedTemp = 28; // Verão
        else if (month >= 3 && month <= 5) estimatedTemp = 25; // Outono  
        else if (month >= 6 && month <= 8) estimatedTemp = 22; // Inverno
        else estimatedTemp = 26; // Primavera
        
        // Ajustar por horário do dia
        if (hour >= 6 && hour <= 12) estimatedTemp += 2; // Manhã/tarde
        else if (hour >= 13 && hour <= 17) estimatedTemp += 4; // Tarde quente
        else if (hour >= 18 && hour <= 22) estimatedTemp += 1; // Noite
        else estimatedTemp -= 3; // Madrugada
        
        setTemperature(`${estimatedTemp}°C*`);
        console.log('✅ Temperatura estimada:', `${estimatedTemp}°C*`);
        
      } catch (error) {
        console.error('❌ Erro ao buscar temperatura:', error);
        setTemperature("25°C*");
      }
    };

    fetchTemperature();
    // Atualizar temperatura a cada 30 minutos
    const tempInterval = setInterval(fetchTemperature, 30 * 60 * 1000);
    return () => clearInterval(tempInterval);
  }, []);
  
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

  // Buscar informações dos oficiais de serviço
  useEffect(() => {
    const fetchOfficerInfo = async () => {
      try {
        const response = await fetch('/api/duty-officers');
        if (response.ok) {
          const officers = await response.json();
          const oficialDia = officers.find((o: any) => o.role === 'oficial_dia');
          const contramestre = officers.find((o: any) => o.role === 'contramestre_pernoite');
          
          if (oficialDia) {
            setOfficialDuty(`Oficial do Dia: ${oficialDia.rank} ${oficialDia.name}`);
            setOficialDiaData({rank: oficialDia.rank, name: oficialDia.name});
          }
          
          if (contramestre) {
            setQuartermasterNight(`Contramestre de Pernoite: ${contramestre.rank} ${contramestre.name}`);
            setContramestreData({rank: contramestre.rank, name: contramestre.name});
          }
        } else {
          // Fallback se API não responder
          setOfficialDuty("Oficial do Dia: Não definido");
          setQuartermasterNight("Contramestre de Pernoite: Não definido");
        }
      } catch (error) {
        console.error('Erro ao buscar informações dos oficiais:', error);
        setOfficialDuty("Oficial do Dia: Erro ao carregar");
        setQuartermasterNight("Contramestre de Pernoite: Erro ao carregar");
      }
    };

    fetchOfficerInfo();
    
    // Atualizar a cada 5 minutos para pegar mudanças do admin
    const interval = setInterval(fetchOfficerInfo, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Função para carregar dados extraídos da escala
  const fetchEscalaExtractedData = async (filename: string) => {
  try {
    setIsLoadingExtraction(true);
    
    const getBackendUrl = (path: string) => {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `http://localhost:5000${path}`;
      }
      return `http://${window.location.hostname}:5000${path}`;
    };

    console.log('🔍 Buscando dados extraídos para arquivo:', filename);
    const response = await fetch(getBackendUrl(`/api/extracted-data-by-filename/${filename}`));
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.extractedData) {
        console.log('📊 Dados extraídos carregados:', {
          filename,
          totalMilitares: result.extractedData.estatisticas?.total_militares || 0,
          turnos: Object.keys(result.extractedData.turnos || {})
        });
        setEscalaExtractedData(result.extractedData);
      } else {
        console.log('⚠️ Nenhum dado extraído encontrado para:', filename);
        setEscalaExtractedData(null);
      }
    } else {
      console.log('⚠️ Dados extraídos não encontrados (HTTP', response.status, ')');
      setEscalaExtractedData(null);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar dados extraídos:', error);
    setEscalaExtractedData(null);
  } finally {
    setIsLoadingExtraction(false);
  }
};
  // Carregar dados extraídos quando escala ativa mudar
 useEffect(() => {
  if (activeEscalaDoc?.url) {
    console.log('🔍 Tentando buscar dados extraídos para escala:', activeEscalaDoc.title, 'URL:', activeEscalaDoc.url);
    
    const filename = activeEscalaDoc.url.split('/').pop();
    if (filename) {
      fetchEscalaExtractedData(filename);
    } else {
      console.log('❌ Não foi possível extrair filename da URL:', activeEscalaDoc.url);
      setEscalaExtractedData(null);
      setIsLoadingExtraction(false);
    }
  } else {
    setEscalaExtractedData(null);
    setIsLoadingExtraction(false);
  }
}, [activeEscalaDoc?.url]);

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

  // Log apenas quando há mudanças significativas
  useEffect(() => {
    console.log("🏠 Index: Documentos carregados", {
      activePlasa: activePlasaDoc?.title || 'nenhum',
      activeEscala: activeEscalaDoc?.title || 'nenhum'
    });
  }, [activePlasaDoc?.id, activeEscalaDoc?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 flex flex-col p-2 sm:p-3 lg:p-4">
      {/* Header Responsivo - Compacto */}
      <header className="relative flex flex-col lg:flex-row items-center justify-between mb-3 p-3 bg-gradient-to-r from-slate-800/80 to-blue-900/80 backdrop-blur-xl rounded-lg shadow-2xl border border-blue-400/30">
        {/* Logo e título */}
        <div className="flex items-center space-x-4 mb-3 lg:mb-0">
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm sm:text-lg">⚓</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white shadow-lg animate-pulse"></div>
          </div>
          
          <div className="text-center sm:text-left">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-300 to-white bg-clip-text text-transparent tracking-tight">
              PAPEM - Sistema Operacional
            </h1>
            <p className="text-blue-200/80 text-xs sm:text-sm font-medium">Sistema de Visualização de Documentos</p>
          </div>
        </div>

        {/* Informações dos Oficiais - Estilização com patentes */}
        <div className="flex flex-col xl:flex-row items-center gap-3 mb-3 lg:mb-0">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg px-4 py-3 border border-blue-400/30 shadow-lg">
            <div className="text-center xl:text-left space-y-2">
              {/* Oficial do Dia */}
              <div className="flex items-center justify-center xl:justify-start gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-lg">👨‍✈️</span>
                  <div className="bg-slate-800 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-400/30">
                    {oficialDiaData.rank}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-blue-200 text-xs font-medium">Oficial do Dia</div>
                  <div className="text-blue-50 text-sm font-semibold">{oficialDiaData.name}</div>
                </div>
              </div>
              
              {/* Contramestre de Pernoite */}
              <div className="flex items-center justify-center xl:justify-start gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-lg">🛡️</span>
                  <div className="bg-slate-800 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-400/30">
                    {contramestreData.rank}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-blue-200 text-xs font-medium">Contramestre de Pernoite</div>
                  <div className="text-blue-50 text-sm font-semibold">{contramestreData.name}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Temperatura */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-400/30 shadow-inner">
            <div className="text-blue-200 text-xs font-medium text-center">
              Temperatura
            </div>
            <div className="text-white font-bold text-center text-lg">
              🌡️ {temperature}
            </div>
          </div>
        </div>

        {/* Data e Hora Compacta */}
        <div className="flex items-center space-x-4 relative z-10">
          {/* Data Compacta */}
          <div className="text-right">
            <div className="text-blue-200 text-xs font-medium tracking-widest uppercase">
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
          
          {/* Separador compacto */}
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-blue-400/60 to-transparent shadow-lg"></div>
          
          {/* Horário Digital Compacto */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-blue-400/30 shadow-inner">
            <div className="text-blue-200 text-xs font-medium tracking-widest uppercase text-center">
              Hora Oficial
            </div>
            <div className="text-white font-mono font-bold tracking-wider text-center text-xl">
              {currentTime}
            </div>
            {/* Horário do Pôr do Sol */}
            <div className="text-amber-300 text-xs font-medium text-center mt-1 opacity-90">
              🌅 {sunsetTime}
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
             {activeEscalaDoc && (
  <EscalaStyledViewer
    key={activeEscalaDoc.id}
    pdfUrl={activeEscalaDoc.url}
    fileName={activeEscalaDoc.title}
    extractedData={escalaExtractedData}
    isLoading={isLoadingExtraction}
  />
              ) : (
                <div className="flex items-center justify-center h-full text-white/60">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">📋 Nenhuma Escala Ativa</h3>
                    <p className="text-sm">Configure escalas no painel administrativo</p>
                  </div>
                </div>
              )}
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