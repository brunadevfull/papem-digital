/*
 * Alertas Meteorológicos Compactos - Página Principal
 * Mostra apenas temperatura, condição e hora da chuva
 */

import React, { useState, useEffect } from "react";

export const WeatherAlertsActive = () => {
  const [temperature, setTemperature] = useState<number>(23);
  const [condition, setCondition] = useState<string>('nublado');
  const [rainTime, setRainTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Tradução simples
  const translateCondition = (condition: string): string => {
    const translations: Record<string, string> = {
      'clear': 'céu limpo',
      'sunny': 'sol',
      'partly cloudy': 'parcialmente nublado',
      'cloudy': 'nublado',
      'overcast': 'encoberto',
      'light rain': 'chuva leve',
      'moderate rain': 'chuva moderada',
      'heavy rain': 'chuva forte',
      'thunderstorm': 'tempestade'
    };
    return translations[condition.toLowerCase()] || condition;
  };

  // Buscar dados de múltiplas fontes para maior precisão
  const fetchWeather = async () => {
    try {
      setLoading(true);
      
      // Tentar primeira fonte: wttr.in
      let temperature = 23;
      let condition = 'nublado';
      
      try {
        const response1 = await fetch('https://wttr.in/Rio+de+Janeiro?format=j1');
        if (response1.ok) {
          const data1 = await response1.json();
          const current1 = data1.current_condition[0];
          temperature = parseInt(current1.temp_C);
          condition = translateCondition(current1.weatherDesc[0].value);
          console.log('🌡️ wttr.in temperatura:', temperature, '°C');
        }
      } catch (e) {
        console.log('⚠️ wttr.in falhou, usando backup');
      }

      // Tentar segunda fonte: OpenWeatherMap (aproximação sem API key)
      try {
        const response2 = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-22.9068&longitude=-43.1729&current_weather=true&hourly=precipitation_probability&timezone=America/Sao_Paulo');
        if (response2.ok) {
          const data2 = await response2.json();
          const tempAlternativa = Math.round(data2.current_weather.temperature);
          console.log('🌡️ open-meteo temperatura:', tempAlternativa, '°C');
          
          // Se a diferença for muito grande (>5°C), usar a média
          if (Math.abs(temperature - tempAlternativa) <= 5) {
            temperature = Math.round((temperature + tempAlternativa) / 2);
            console.log('🌡️ Média das fontes:', temperature, '°C');
          } else {
            console.log('🌡️ Diferença muito grande, usando wttr.in');
          }
        }
      } catch (e) {
        console.log('⚠️ open-meteo falhou');
      }

      setTemperature(temperature);
      setCondition(condition);
      
      // Encontrar primeira hora FUTURA com chuva significativa (>50%)
      let firstRain = null;
      
      // Tentar obter dados de chuva do wttr.in se disponível
      try {
        const response1 = await fetch('https://wttr.in/Rio+de+Janeiro?format=j1');
        if (response1.ok) {
          const data1 = await response1.json();
          const today = data1.weather[0];
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinutes = now.getMinutes();
          
          today.hourly.slice(0, 24).forEach((hour: any, index: number) => {
            const hourTime = currentHour + index;
            const rainChance = parseInt(hour.chanceofrain);
            
            // Só considerar horas que ainda não passaram (com margem para minutos)
            let isFuture = false;
            if (index === 0) {
              // Para a primeira hora, só mostrar se ainda faltam pelo menos 30 minutos
              isFuture = currentMinutes < 30;
            } else {
              // Para outras horas, sempre futuras
              isFuture = true;
            }
            
            if (!firstRain && rainChance > 50 && isFuture) {
              firstRain = `${String(hourTime % 24).padStart(2, '0')}:00`;
            }
          });
        }
      } catch (e) {
        console.log('⚠️ Falha ao obter dados de chuva');
      }
      
      setRainTime(firstRain);
    } catch (err) {
      console.error('Erro meteorológico:', err);
      // Manter valores padrão em caso de erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    
    // Atualizar a cada 15 minutos
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-600/30 to-slate-900/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-400/30 shadow-lg text-center min-w-[180px]">
      {loading ? (
        <div className="text-blue-200 text-xs">Carregando...</div>
      ) : (
        <>
          {/* Temperatura e condição */}
          <div className="text-white text-sm font-medium mb-1">
            {temperature}°C, {condition}
          </div>
          
          {/* Hora da chuva - sem redundância */}
          {rainTime ? (
            <div className="text-yellow-300 text-xs font-bold">
              🌧️ Chuva às {rainTime}
            </div>
          ) : (
            <div className="text-green-300 text-xs">
              ☀️ Sem chuva prevista
            </div>
          )}
        </>
      )}
    </div>
  );
};