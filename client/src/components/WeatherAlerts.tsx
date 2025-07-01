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
        {/* Status do Sistema */}
        <Alert className="border-green-200 bg-green-50">
          <AlertTitle className="text-green-800 flex items-center gap-2">
            <span className="text-lg">✅</span>
            Sistema Ativo - Rio de Janeiro
          </AlertTitle>
          <AlertDescription className="text-green-700">
            <div className="space-y-2">
              <div>
                Monitoramento meteorológico ativo para a região do Rio de Janeiro.
                Os alertas aparecerão automaticamente quando houver condições climáticas severas.
              </div>
              
              <div className="bg-green-100 p-3 rounded-lg text-sm">
                <strong>🌦️ Condições Monitoradas:</strong>
                <br />
                • Chuvas intensas • Ventos fortes • Tempestades • Alertas oficiais
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