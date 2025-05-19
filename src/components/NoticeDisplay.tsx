
import React, { useState, useEffect } from "react";
import { useDisplay, Notice } from "@/context/DisplayContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NoticeDisplay: React.FC = () => {
  const { getActiveNotices } = useDisplay();
  const [visibleNoticeIndex, setVisibleNoticeIndex] = useState(0);
  const [activeNotices, setActiveNotices] = useState<Notice[]>([]);
  
  // Get active notices and sort by priority
  useEffect(() => {
    const notices = getActiveNotices().sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    setActiveNotices(notices);
  }, [getActiveNotices]);
  
  // Rotate through notices
  useEffect(() => {
    if (activeNotices.length <= 1) return;
    
    const rotationInterval = setInterval(() => {
      setVisibleNoticeIndex(prev => (prev + 1) % activeNotices.length);
    }, 10000); // Rotate every 10 seconds
    
    return () => clearInterval(rotationInterval);
  }, [activeNotices.length]);
  
  if (activeNotices.length === 0) {
    return (
      <Card className="h-full border-navy">
        <CardHeader className="bg-navy text-white py-2">
          <CardTitle className="text-center">Avisos</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-3rem)]">
          <p className="text-center text-muted-foreground">Nenhum aviso ativo no momento.</p>
        </CardContent>
      </Card>
    );
  }
  
  const currentNotice = activeNotices[visibleNoticeIndex];
  
  // Get background color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-priority-high";
      case "medium": return "bg-priority-medium";
      case "low": return "bg-priority-low";
      default: return "bg-navy";
    }
  };
  
  // Format date to display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Card className="h-full border-navy overflow-hidden">
      <CardHeader className={`${getPriorityColor(currentNotice.priority)} text-white py-2`}>
        <CardTitle className="text-center flex justify-between items-center">
          <span>Avisos</span>
          {activeNotices.length > 1 && (
            <span className="text-sm">
              {visibleNoticeIndex + 1}/{activeNotices.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 h-[calc(100%-3rem)] flex flex-col">
        <div 
          key={currentNotice.id} 
          className="animate-rotate-notice flex flex-col h-full"
        >
          <h3 className="text-xl font-bold text-navy mb-2">{currentNotice.title}</h3>
          <p className="flex-1 text-gray-700 mb-4">{currentNotice.content}</p>
          <div className="text-sm text-gray-500 mt-auto">
            <p>Válido de {formatDate(currentNotice.startDate)} até {formatDate(currentNotice.endDate)}</p>
          </div>
        </div>
        
        {activeNotices.length > 1 && (
          <div className="flex justify-center gap-1 mt-4">
            {activeNotices.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-2 h-2 rounded-full ${idx === visibleNoticeIndex ? 'bg-navy' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NoticeDisplay;
