/*
 * Sistema de Visualização da Marinha do Brasil
 * Utilitários para Horário do Pôr do Sol
 * 
 * Autor: 2SG Bruna Rocha
 * Marinha do Brasil
 */

// Coordenadas do Rio de Janeiro
const RIO_LATITUDE = -22.9068; 
const RIO_LONGITUDE = -43.1729;

// Cache para evitar muitas requisições
let cachedSunset: string | null = null;
let lastFetchDate: string | null = null;

/**
 * Busca horário do pôr do sol via API confiável
 * Usa a API sunrise-sunset.org que é gratuita e precisa
 */
async function fetchSunsetFromAPI(): Promise<string> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Verificar cache
    if (cachedSunset && lastFetchDate === today) {
      return cachedSunset;
    }
    
    const url = `https://api.sunrise-sunset.org/json?lat=${RIO_LATITUDE}&lng=${RIO_LONGITUDE}&date=${today}&formatted=0`;
    
    console.log('🌅 Buscando horário do pôr do sol via API:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results?.sunset) {
      // A API retorna em UTC, converter para horário do Brasil (UTC-3)
      const sunsetUTC = new Date(data.results.sunset);
      
      // Criar um novo objeto Date e subtrair 3 horas para GMT-3 (horário do Brasil)
      const brasilOffset = 3 * 60 * 60 * 1000; // 3 horas em milissegundos
      const sunsetBrasil = new Date(sunsetUTC.getTime() - brasilOffset);
      
      const hours = sunsetBrasil.getUTCHours().toString().padStart(2, '0');
      const minutes = sunsetBrasil.getUTCMinutes().toString().padStart(2, '0');
      const sunset = `${hours}:${minutes}`;
      
      // Atualizar cache
      cachedSunset = sunset;
      lastFetchDate = today;
      
      console.log('✅ Pôr do sol UTC:', data.results.sunset);
      console.log('✅ Pôr do sol Brasil:', sunset);
      return sunset;
    } else {
      throw new Error('API retornou dados inválidos');
    }
  } catch (error) {
    console.error('❌ Erro ao buscar pôr do sol:', error);
    // Fallback para cálculo local em caso de erro
    return getLocalSunsetCalculation();
  }
}

/**
 * Cálculo local como fallback (algoritmo simplificado)
 */
function getLocalSunsetCalculation(): string {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Equação do tempo simplificada para o Rio de Janeiro
  const solarNoon = 12;
  const hourAngle = 15 * (solarNoon - 12);
  const declination = 23.45 * Math.sin((360/365) * (dayOfYear - 81) * Math.PI / 180);
  
  const latRad = RIO_LATITUDE * Math.PI / 180;
  const decRad = declination * Math.PI / 180;
  
  const sunsetHour = solarNoon + (Math.acos(-Math.tan(latRad) * Math.tan(decRad)) * 180 / Math.PI) / 15;
  
  // Ajuste para fuso horário do Brasil
  const adjustedHour = sunsetHour - 1; // Aproximação para Rio de Janeiro
  
  const hours = Math.floor(adjustedHour);
  const minutes = Math.floor((adjustedHour - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Obtém o horário do pôr do sol para hoje
 */
export async function getTodaySunset(): Promise<string> {
  try {
    return await fetchSunsetFromAPI();
  } catch (error) {
    console.warn('⚠️ Usando cálculo local como fallback');
    return getLocalSunsetCalculation();
  }
}

/**
 * Obtém o horário do pôr do sol formatado com texto
 */
export async function getSunsetWithLabel(): Promise<string> {
  const sunsetTime = await getTodaySunset();
  return `Pôr do sol: ${sunsetTime}`;
}