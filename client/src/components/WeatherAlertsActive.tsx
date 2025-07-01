/*
 * Sistema de Alertas Meteorológicos Ativos para o Rio de Janeiro
 * Exibe alertas baseados nas condições meteorológicas atuais
 */

import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Cloud, Droplets, Wind } from "lucide-react";

interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  description: string;
  main: string;
  pressure: number;
  clouds: number;
}

interface WeatherAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const WeatherAlertsActive = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWeatherData = async () => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Rio%20de%20Janeiro,BR&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}&units=metric&lang=pt_br`
      );
      
      if (response.ok) {
        const data = await response.json();
        const weatherData: WeatherData = {
          temp: Math.round(data.main.temp),
          humidity: data.main.humidity,
          windSpeed: data.wind?.speed || 0,
          description: data.weather[0].description,
          main: data.weather[0].main,
          pressure: data.main.pressure,
          clouds: data.clouds?.all || 0
        };
        setWeather(weatherData);
        generateAlerts(weatherData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados meteorológicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (data: WeatherData) => {
    const newAlerts: WeatherAlert[] = [];

    // Alerta de alta umidade
    if (data.humidity > 85) {
      newAlerts.push({
        id: 'humidity-high',
        type: 'warning',
        title: '🌫️ Alta Umidade',
        description: `Umidade em ${data.humidity}%. Possível formação de névoa ou nevoeiro.`,
        icon: '💧',
        color: 'yellow'
      });
    }

    // Alerta de vento forte
    if (data.windSpeed > 10) {
      newAlerts.push({
        id: 'wind-strong',
        type: 'warning',
        title: '💨 Ventos Fortes',
        description: `Velocidade do vento: ${Math.round(data.windSpeed * 3.6)} km/h. Cuidado com objetos soltos.`,
        icon: '🌪️',
        color: 'orange'
      });
    }

    // Alerta de temperatura alta
    if (data.temp > 32) {
      newAlerts.push({
        id: 'temp-high',
        type: 'warning',
        title: '🌡️ Temperatura Elevada',
        description: `Temperatura de ${data.temp}°C. Mantenha-se hidratado e evite exposição prolongada ao sol.`,
        icon: '☀️',
        color: 'red'
      });
    }

    // Alerta de temperatura baixa
    if (data.temp < 15) {
      newAlerts.push({
        id: 'temp-low',
        type: 'info',
        title: '🌡️ Temperatura Baixa',
        description: `Temperatura de ${data.temp}°C. Vista roupas adequadas.`,
        icon: '🧥',
        color: 'blue'
      });
    }

    // Alerta de tempo instável
    if (data.main === 'Rain' || data.main === 'Thunderstorm') {
      newAlerts.push({
        id: 'precipitation',
        type: 'danger',
        title: '🌧️ Precipitação Ativa',
        description: `${data.description}. Cuidado ao se locomover e tenha guarda-chuva.`,
        icon: '☔',
        color: 'red'
      });
    }

    // Alerta de céu muito nublado
    if (data.clouds > 80) {
      newAlerts.push({
        id: 'clouds-heavy',
        type: 'info',
        title: '☁️ Céu Muito Nublado',
        description: `Cobertura de nuvens: ${data.clouds}%. ${data.description}.`,
        icon: '☁️',
        color: 'gray'
      });
    }

    // Se não há alertas específicos, mostrar status normal
    if (newAlerts.length === 0) {
      newAlerts.push({
        id: 'normal',
        type: 'info',
        title: '✅ Condições Normais',
        description: `${data.temp}°C, ${data.description}. Condições meteorológicas estáveis para atividades navais.`,
        icon: '🌤️',
        color: 'green'
      });
    }

    setAlerts(newAlerts);
  };

  useEffect(() => {
    fetchWeatherData();
    // Atualizar a cada 30 minutos
    const interval = setInterval(fetchWeatherData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        <p className="mt-2 text-sm text-gray-600">Verificando condições meteorológicas...</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-red-800">Erro de Conexão</AlertTitle>
        <AlertDescription className="text-red-700">
          Não foi possível conectar ao serviço meteorológico. Verificando novamente em breve.
        </AlertDescription>
      </Alert>
    );
  }

  const getAlertClasses = (color: string) => {
    switch (color) {
      case 'red':
        return {
          container: 'border-red-200 bg-red-50',
          title: 'text-red-800',
          description: 'text-red-700',
          badge: 'text-red-600 border-red-300'
        };
      case 'yellow':
        return {
          container: 'border-yellow-200 bg-yellow-50',
          title: 'text-yellow-800',
          description: 'text-yellow-700',
          badge: 'text-yellow-600 border-yellow-300'
        };
      case 'orange':
        return {
          container: 'border-orange-200 bg-orange-50',
          title: 'text-orange-800',
          description: 'text-orange-700',
          badge: 'text-orange-600 border-orange-300'
        };
      case 'green':
        return {
          container: 'border-green-200 bg-green-50',
          title: 'text-green-800',
          description: 'text-green-700',
          badge: 'text-green-600 border-green-300'
        };
      case 'blue':
        return {
          container: 'border-blue-200 bg-blue-50',
          title: 'text-blue-800',
          description: 'text-blue-700',
          badge: 'text-blue-600 border-blue-300'
        };
      default:
        return {
          container: 'border-gray-200 bg-gray-50',
          title: 'text-gray-800',
          description: 'text-gray-700',
          badge: 'text-gray-600 border-gray-300'
        };
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const classes = getAlertClasses(alert.color);
        return (
          <Alert 
            key={alert.id} 
            className={classes.container}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{alert.icon}</span>
              <div className="flex-1">
                <AlertTitle className={`${classes.title} font-medium`}>
                  {alert.title}
                </AlertTitle>
                <AlertDescription className={`${classes.description} text-sm mt-1`}>
                  {alert.description}
                </AlertDescription>
                <div className="mt-2">
                  <Badge variant="outline" className={classes.badge}>
                    Rio de Janeiro - {new Date().toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Badge>
                </div>
              </div>
            </div>
          </Alert>
        );
      })}
      
      <div className="text-xs text-gray-500 text-center mt-3">
        Última atualização: {new Date().toLocaleString('pt-BR')}
      </div>
    </div>
  );
};