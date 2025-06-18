import React, { useEffect, useState, useRef } from "react";
import { Bell, X, AlertTriangle, Info, CheckCircle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDisplay } from "@/context/DisplayContext";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  timestamp: Date;
  read: boolean;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  timestamp: string;
}

const RealtimeNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { notices, plasaDocuments, escalaDocuments, refreshNotices } = useDisplay();

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
    
    // Show toast notification
    toast(notification.title, {
      description: notification.message,
      duration: 5000,
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // WebSocket connection management
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setIsConnected(true);
        
        addNotification({
          title: "Sistema Conectado",
          message: "Notificações em tempo real ativadas",
          type: "success"
        });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'connected':
        addNotification({
          title: "Conectado",
          message: message.message || "Sistema conectado",
          type: "success"
        });
        break;

      case 'notice_created':
        addNotification({
          title: "Novo Aviso",
          message: `Aviso criado: ${message.data?.title}`,
          type: "info"
        });
        refreshNotices();
        break;

      case 'notice_updated':
        addNotification({
          title: "Aviso Atualizado",
          message: `Aviso modificado: ${message.data?.title}`,
          type: "info"
        });
        refreshNotices();
        break;

      case 'notice_deleted':
        addNotification({
          title: "Aviso Removido",
          message: "Um aviso foi removido do sistema",
          type: "warning"
        });
        refreshNotices();
        break;

      case 'document_created':
        addNotification({
          title: "Novo Documento",
          message: `Documento adicionado: ${message.data?.title}`,
          type: "info"
        });
        refreshNotices();
        break;

      case 'document_updated':
        addNotification({
          title: "Documento Atualizado",
          message: `Documento modificado: ${message.data?.title}`,
          type: "info"
        });
        refreshNotices();
        break;

      case 'document_deleted':
        addNotification({
          title: "Documento Removido",
          message: "Um documento foi removido do sistema",
          type: "warning"
        });
        refreshNotices();
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Monitor system changes
  useEffect(() => {
    const activeNotices = notices.filter(n => n.active);
    const activeDocuments = [...plasaDocuments, ...escalaDocuments].filter(d => d.active);

    // Check for high priority notices
    const highPriorityNotices = activeNotices.filter(n => n.priority === "high");
    if (highPriorityNotices.length > 0) {
      highPriorityNotices.forEach(notice => {
        addNotification({
          title: "Aviso de Alta Prioridade",
          message: `${notice.title} - ${notice.content.substring(0, 100)}...`,
          type: "warning"
        });
      });
    }

    // System status notifications
    if (activeDocuments.length === 0) {
      addNotification({
        title: "Sistema sem Documentos Ativos",
        message: "Nenhum documento está ativo no momento. Verifique as configurações.",
        type: "warning"
      });
    }

    // Document rotation notification
    if (escalaDocuments.filter(d => d.active).length > 1) {
      addNotification({
        title: "Rotação de Escalas Ativa",
        message: `Sistema alternando entre ${escalaDocuments.filter(d => d.active).length} escalas.`,
        type: "info"
      });
    }
  }, [notices, plasaDocuments, escalaDocuments]);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "warning": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "error": return <X className="h-4 w-4 text-red-500" />;
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 max-h-96 overflow-hidden z-50 border-border bg-background">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notificações</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Marcar todas como lidas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-80">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.read ? "bg-muted/20" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="h-4 w-4 opacity-50 hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default RealtimeNotifications;