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
      <div className="flex items-center gap-2 text-white/80">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Temp. indisponível</span>
        <button 
          onClick={handleRefresh}
          className="p-1 hover:bg-white/10 rounded"
          disabled={loading}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex items-center gap-2 text-white/80">
        <Thermometer className="w-4 h-4" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-white">
      <Thermometer className="w-4 h-4" />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">
            {weather.temp}°C
          </span>
          <span className="text-xs text-white/70">
            Sensação {weather.feelsLike}°C
          </span>
          <button 
            onClick={handleRefresh}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            disabled={loading}
            title="Atualizar temperatura"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/60">
          <span className="capitalize">{weather.description}</span>
          <span>Umidade: {weather.humidity}%</span>
        </div>
      </div>
    </div>
  );
};