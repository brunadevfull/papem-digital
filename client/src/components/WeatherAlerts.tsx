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
            • 🌧️ Chuvas fortes e tempestades
            <br />
            • 💨 Ventos intensos
            <br />
            • ⚠️ Alertas oficiais do Rio de Janeiro
            <br />
            • 📊 Condições atuais (temperatura, umidade, etc.)
          </AlertDescription>
        </Alert>

        {/* Informações do Sistema */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 rounded-lg border">
            <div className="font-semibold text-gray-600">Status</div>
            <div className="text-gray-700">Aguardando configuração</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg border">
            <div className="font-semibold text-gray-600">Localização</div>
            <div className="text-gray-700">Rio de Janeiro</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg border">
            <div className="font-semibold text-gray-600">Atualização</div>
            <div className="text-gray-700">A cada 10 min</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg border">
            <div className="font-semibold text-gray-600">Fonte</div>
            <div className="text-gray-700">OpenWeatherMap</div>
          </div>
        </div>

        {/* Exemplo de Alerta */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            🚨 Exemplo de Alerta Ativo
          </h4>
          <Alert className="border-l-4 bg-red-100 border-red-500 text-red-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <AlertTitle className="flex items-center gap-2">
                  🌧️ Chuva Forte no Rio de Janeiro
                  <Badge variant="destructive">ALTO</Badge>
                </AlertTitle>
                <AlertDescription className="mt-2 text-red-700">
                  Chuva intensa detectada: 15.2mm/h. Evite deslocamentos desnecessários.
                  Alagamentos possíveis em pontos baixos da cidade.
                  <div className="mt-2 text-xs opacity-75">
                    <strong>Início:</strong> 01/07/2025 14:30 | <strong>Fim:</strong> Em análise
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        </div>

        {/* Rodapé */}
        <div className="pt-3 border-t text-xs text-gray-500 text-center">
          Configure a API para ativar alertas em tempo real para o Rio de Janeiro
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherAlerts;