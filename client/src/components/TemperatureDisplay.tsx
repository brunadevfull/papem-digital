import { useState, useEffect } from 'react';
import { Thermometer, RefreshCw, AlertCircle } from 'lucide-react';
import { getCurrentTemperature, refreshTemperature, getMinutesUntilNextUpdate } from '../utils/temperatureUtils';

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  feelsLike: number;
}

export const TemperatureDisplay = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextUpdate, setNextUpdate] = useState(0);

  // Carregar temperatura inicial
  useEffect(() => {
    loadTemperature();
  }, []);

  // Atualizar contador de próxima atualização
  useEffect(() => {
    const interval = setInterval(() => {
      setNextUpdate(getMinutesUntilNextUpdate());
    }, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, [weather]);

  // Auto-refresh a cada 30 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      loadTemperature();
    }, 30 * 60 * 1000); // 30 minutos

    return () => clearInterval(interval);
  }, []);

  const loadTemperature = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getCurrentTemperature();
      if (data) {
        setWeather(data);
        setNextUpdate(getMinutesUntilNextUpdate());
      } else {
        setError("Dados não disponíveis");
      }
    } catch (err) {
      setError("Erro ao carregar temperatura");
      console.error("Erro na temperatura:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await refreshTemperature();
      if (data) {
        setWeather(data);
        setNextUpdate(getMinutesUntilNextUpdate());
      }
    } catch (err) {
      setError("Erro ao atualizar");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-red-800/30 to-red-900/30 backdrop-blur-sm rounded-lg border border-red-400/20 p-4 shadow-lg min-w-[240px]">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-300" />
          <span className="text-red-200 text-sm font-medium">Temp. indisponível</span>
        </div>
        <button 
          onClick={handleRefresh}
          className="p-2 hover:bg-red-500/20 rounded-full transition-all duration-200 hover:scale-110"
          disabled={loading}
          title="Tentar novamente"
        >
          <RefreshCw className={`w-4 h-4 text-red-300 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-lg border border-gray-400/20 p-4 shadow-lg min-w-[240px]">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-gray-300" />
          <span className="text-gray-200 text-sm font-medium">Carregando temperatura...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-orange-800/30 to-red-900/30 backdrop-blur-sm rounded-lg border border-orange-400/20 p-4 shadow-lg min-w-[240px]">
      {/* Cabeçalho com ícone e título */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-orange-500/20 rounded-full">
          <Thermometer className="w-5 h-5 text-orange-300" />
        </div>
        <h3 className="text-orange-200 text-sm font-semibold uppercase tracking-wide">
          Temperatura
        </h3>
        <button 
          onClick={handleRefresh}
          className="p-1.5 hover:bg-orange-500/20 rounded-full transition-all duration-200 hover:scale-110"
          disabled={loading}
          title="Atualizar temperatura"
        >
          <RefreshCw className={`w-3 h-3 text-orange-300 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Informações da temperatura */}
      <div className="w-full space-y-2">
        {/* Temperatura principal */}
        <div className="bg-slate-900/40 rounded-lg p-3 border border-orange-500/20 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {weather.temp}°C
          </div>
          <div className="text-xs text-orange-300 uppercase tracking-wider">
            Sensação {weather.feelsLike}°C
          </div>
        </div>
        
        {/* Detalhes */}
        <div className="bg-slate-900/40 rounded-lg p-3 border border-orange-500/20">
          <div className="text-center">
            <div className="text-white font-medium text-sm capitalize mb-1">
              {weather.description}
            </div>
            <div className="text-xs text-orange-400/70">
              Umidade: {weather.humidity}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};