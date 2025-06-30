/**
 * Utilitários para obter temperatura do Rio de Janeiro
 * Usa API gratuita do OpenWeatherMap
 */

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  feelsLike: number;
}

interface TemperatureCache {
  data: WeatherData | null;
  timestamp: number;
  error?: string;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos em millisegundos
const RIO_COORDS = { lat: -22.9068, lon: -43.1729 }; // Rio de Janeiro

// Cache local para evitar muitas requisições
let temperatureCache: TemperatureCache = {
  data: null,
  timestamp: 0
};

/**
 * Obtém temperatura atual do Rio de Janeiro
 * Retorna dados do cache se ainda válidos (menos de 30 min)
 */
export const getCurrentTemperature = async (): Promise<WeatherData | null> => {
  const now = Date.now();
  
  // Verificar se cache ainda é válido
  if (temperatureCache.data && (now - temperatureCache.timestamp) < CACHE_DURATION) {
    console.log("🌡️ Usando temperatura do cache");
    return temperatureCache.data;
  }

  try {
    console.log("🌡️ Buscando temperatura atualizada...");
    
    // Usar API gratuita do OpenWeatherMap
    // Nota: Esta API requer uma chave, mas tem versão gratuita
    const API_KEY = 'demo'; // Usuário deve fornecer chave real
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${RIO_COORDS.lat}&lon=${RIO_COORDS.lon}&appid=${API_KEY}&units=metric&lang=pt_br`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      // Fallback para API alternativa gratuita (sem chave)
      return await getTemperatureFromAlternativeAPI();
    }

    const data = await response.json();
    
    const weatherData: WeatherData = {
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      feelsLike: Math.round(data.main.feels_like)
    };

    // Atualizar cache
    temperatureCache = {
      data: weatherData,
      timestamp: now
    };

    console.log(`🌡️ Temperatura atualizada: ${weatherData.temp}°C`);
    return weatherData;

  } catch (error) {
    console.error("❌ Erro ao obter temperatura:", error);
    
    // Tentar API alternativa
    return await getTemperatureFromAlternativeAPI();
  }
};

/**
 * API alternativa gratuita (wttr.in) - não requer chave
 */
const getTemperatureFromAlternativeAPI = async (): Promise<WeatherData | null> => {
  try {
    console.log("🌡️ Tentando API alternativa...");
    
    // wttr.in é uma API gratuita que não requer chave
    const response = await fetch('https://wttr.in/Rio+de+Janeiro?format=j1');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const current = data.current_condition[0];
    
    const weatherData: WeatherData = {
      temp: parseInt(current.temp_C),
      description: current.weatherDesc[0].value.toLowerCase(),
      icon: '01d', // ícone padrão
      humidity: parseInt(current.humidity),
      feelsLike: parseInt(current.FeelsLikeC)
    };

    // Atualizar cache
    temperatureCache = {
      data: weatherData,
      timestamp: Date.now()
    };

    console.log(`🌡️ Temperatura obtida via API alternativa: ${weatherData.temp}°C`);
    return weatherData;

  } catch (error) {
    console.error("❌ Erro na API alternativa:", error);
    
    // Retornar dados simulados como último recurso (apenas para demonstração)
    const fallbackData: WeatherData = {
      temp: 24, // Temperatura típica do Rio
      description: "temperatura não disponível",
      icon: '01d',
      humidity: 65,
      feelsLike: 26
    };

    temperatureCache = {
      data: fallbackData,
      timestamp: Date.now(),
      error: "API indisponível"
    };

    return fallbackData;
  }
};

/**
 * Força atualização da temperatura (ignora cache)
 */
export const refreshTemperature = async (): Promise<WeatherData | null> => {
  temperatureCache.timestamp = 0; // Invalida cache
  return await getCurrentTemperature();
};

/**
 * Verifica se os dados de temperatura estão atualizados
 */
export const isTemperatureCacheValid = (): boolean => {
  const now = Date.now();
  return temperatureCache.data !== null && (now - temperatureCache.timestamp) < CACHE_DURATION;
};

/**
 * Obtém tempo restante até próxima atualização (em minutos)
 */
export const getMinutesUntilNextUpdate = (): number => {
  if (!temperatureCache.data) return 0;
  
  const now = Date.now();
  const elapsed = now - temperatureCache.timestamp;
  const remaining = CACHE_DURATION - elapsed;
  
  return Math.max(0, Math.ceil(remaining / (60 * 1000)));
};