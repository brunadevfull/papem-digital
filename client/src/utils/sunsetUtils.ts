/*
 * Sistema de Visualização da Marinha do Brasil
 * Utilitários para Cálculo do Pôr do Sol
 * 
 * Autor: 2SG Bruna Rocha
 * Marinha do Brasil
 */

// Coordenadas do Rio de Janeiro
const DEFAULT_LATITUDE = -22.9068; 
const DEFAULT_LONGITUDE = -43.1729;

/**
 * Calcula o horário do pôr do sol para uma data específica
 * Baseado no algoritmo astronômico padrão
 */
export function calculateSunset(date: Date, latitude: number = DEFAULT_LATITUDE, longitude: number = DEFAULT_LONGITUDE): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Converter para dia juliano
  const a = Math.floor((14 - month) / 12);
  const y = year - a;
  const m = month + 12 * a - 3;
  
  const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  // Cálculos astronômicos simplificados
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) * Math.PI) / 180;
  const lambda = ((L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI) / 180;
  
  // Declinação solar
  const delta = Math.asin(0.39782 * Math.sin(lambda));
  
  // Ângulo horário do pôr do sol
  const latRad = (latitude * Math.PI) / 180;
  const cosH = -Math.tan(latRad) * Math.tan(delta);
  
  // Verificar se o sol se põe (regiões polares podem não ter pôr do sol)
  if (cosH < -1) {
    return "00:00"; // Sol da meia-noite
  }
  if (cosH > 1) {
    return "23:59"; // Sol não se põe
  }
  
  const H = Math.acos(cosH);
  const sunsetHour = 12 + (H * 180) / (15 * Math.PI);
  
  // Correção para fuso horário brasileiro (UTC-3)
  const correctedHour = sunsetHour - 3;
  
  // Converter para formato HH:MM
  const hours = Math.floor(correctedHour);
  const minutes = Math.floor((correctedHour - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Obtém o horário do pôr do sol para hoje
 */
export function getTodaySunset(): string {
  return calculateSunset(new Date());
}

/**
 * Obtém o horário do pôr do sol formatado com texto
 */
export function getSunsetWithLabel(): string {
  const sunsetTime = getTodaySunset();
  return `Pôr do sol: ${sunsetTime}`;
}