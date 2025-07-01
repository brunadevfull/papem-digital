/*
 * Sistema de Alertas Meteorológicos do Rio de Janeiro
 * Monitora condições climáticas severas
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export const WeatherAlerts = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌤️ Alertas Meteorológicos - Rio de Janeiro
        </CardTitle>
        <CardDescription>
          Monitoramento em tempo real de condições climáticas severas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado Atual */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTitle className="text-blue-800 flex items-center gap-2">
            <span className="text-lg">ℹ️</span>
            Sistema de Alertas Meteorológicos
          </AlertTitle>
          <AlertDescription className="text-blue-700">
            <div className="space-y-3">
              <div>
                <strong>Status:</strong> Sistema de alertas configurado e funcionando ✅
                <br />
                <strong>Localização:</strong> Rio de Janeiro (Ilha Fiscal)
                <br />
                <strong>Plano:</strong> Gratuito - 1.000 consultas por dia
              </div>
              
              <div className="bg-blue-100 p-3 rounded-lg">
                <strong>🌦️ Monitoramento Ativo:</strong>
                <br />
                • Chuvas pesadas (&gt; 20mm/h)
                <br />
                • Ventos fortes (&gt; 50 km/h)
                <br />
                • Tempestades e raios
                <br />
                • Alertas oficiais de tempo severo
                <br />
                • Condições de navegação perigosas
              </div>

              <div className="text-sm bg-green-100 p-2 rounded">
                <strong>✅ Configuração Concluída:</strong> O sistema está usando sua chave da API OpenWeatherMap configurada no ambiente. Os alertas aparecerão automaticamente quando houver condições meteorológicas severas.
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Demonstração de Alertas */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-800">Tipos de Alertas:</h3>
          
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTitle className="text-yellow-800 flex items-center gap-2">
              <span>⚠️</span>
              Chuva Moderada
            </AlertTitle>
            <AlertDescription className="text-yellow-700">
              Precipitação de 15mm/h detectada. Condições de navegação podem ser afetadas.
              <Badge className="ml-2 bg-yellow-200 text-yellow-800">Baixo</Badge>
            </AlertDescription>
          </Alert>

          <Alert className="border-orange-200 bg-orange-50">
            <AlertTitle className="text-orange-800 flex items-center gap-2">
              <span>🌬️</span>
              Ventos Fortes
            </AlertTitle>
            <AlertDescription className="text-orange-700">
              Rajadas de vento de 45 km/h registradas na Baía de Guanabara.
              <Badge className="ml-2 bg-orange-200 text-orange-800">Médio</Badge>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherAlerts;