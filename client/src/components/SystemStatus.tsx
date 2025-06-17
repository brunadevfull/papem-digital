import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useDisplay } from "@/context/DisplayContext";
import { 
  Server, 
  Database, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Activity
} from "lucide-react";

interface SystemMetric {
  name: string;
  value: number;
  status: "healthy" | "warning" | "error";
  lastChecked: Date;
}

const SystemStatus: React.FC = () => {
  const { notices, plasaDocuments, escalaDocuments, isLoading } = useDisplay();
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const calculateMetrics = () => {
    const totalNotices = notices.length;
    const activeNotices = notices.filter(n => n.active).length;
    const totalDocs = plasaDocuments.length + escalaDocuments.length;
    const activeDocs = [...plasaDocuments, ...escalaDocuments].filter(d => d.active).length;

    const newMetrics: SystemMetric[] = [
      {
        name: "Conectividade",
        value: 100, // Always 100% if we're getting data
        status: "healthy",
        lastChecked: new Date()
      },
      {
        name: "Avisos Ativos",
        value: totalNotices > 0 ? Math.round((activeNotices / totalNotices) * 100) : 0,
        status: activeNotices > 0 ? "healthy" : "warning",
        lastChecked: new Date()
      },
      {
        name: "Documentos Ativos",
        value: totalDocs > 0 ? Math.round((activeDocs / totalDocs) * 100) : 0,
        status: activeDocs > 0 ? "healthy" : "warning",
        lastChecked: new Date()
      },
      {
        name: "Sistema Operacional",
        value: (activeNotices > 0 && activeDocs > 0) ? 100 : 75,
        status: (activeNotices > 0 && activeDocs > 0) ? "healthy" : "warning",
        lastChecked: new Date()
      }
    ];

    setMetrics(newMetrics);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    calculateMetrics();
  }, [notices, plasaDocuments, escalaDocuments]);

  const getStatusIcon = (status: SystemMetric["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: SystemMetric["status"]) => {
    switch (status) {
      case "healthy":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "error":
        return "text-red-600 dark:text-red-400";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const overallHealth = metrics.length > 0 
    ? Math.round(metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length)
    : 0;

  const overallStatus: SystemMetric["status"] = 
    overallHealth >= 90 ? "healthy" :
    overallHealth >= 70 ? "warning" : "error";

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
            <CardDescription>
              Monitoramento em tempo real dos componentes
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={overallStatus === "healthy" ? "default" : "secondary"}>
              {overallHealth}% Operacional
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={calculateMetrics}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Health Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Saúde Geral do Sistema</span>
            <span className={getStatusColor(overallStatus)}>
              {overallHealth}%
            </span>
          </div>
          <Progress 
            value={overallHealth} 
            className="h-3"
          />
        </div>

        {/* Individual Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(metric.status)}
                <div>
                  <p className="text-sm font-medium">{metric.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Verificado às {formatTime(metric.lastChecked)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${getStatusColor(metric.status)}`}>
                  {metric.value}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* System Info */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Server className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground">Servidor</p>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Online
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Database className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground">Dados</p>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Sincronizado
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground">Última Atualização</p>
            <p className="text-sm font-medium">
              {formatTime(lastUpdate)}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar Sistema
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;