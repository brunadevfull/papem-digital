
import React, { useState, useEffect, useRef } from "react";
import { useDisplay } from "@/context/DisplayContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PDFViewerProps {
  documentType: "plasa" | "escala";
  title: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ documentType, title }) => {
  const { pageChangeInterval } = useDisplay();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5); // Placeholder, would normally come from PDF.js
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);
  
  // Simulate PDF loading and page changes
  useEffect(() => {
    setLoading(true);
    
    // Simulate loading delay
    const loadTimer = setTimeout(() => {
      setLoading(false);
      
      // Random total pages between 3-10 for demo purposes
      setTotalPages(Math.floor(Math.random() * 8) + 3);
    }, 1500);
    
    return () => {
      clearTimeout(loadTimer);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [documentType]);
  
  // Set up page rotation interval
  useEffect(() => {
    if (!loading && totalPages > 1) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      // Use non-null assertion as we're setting it right away
      timerRef.current = window.setInterval(() => {
        setCurrentPage(prev => prev >= totalPages ? 1 : prev + 1);
      }, pageChangeInterval);
      
      return () => {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }
      };
    }
  }, [loading, totalPages, pageChangeInterval]);

  return (
    <Card className="h-full overflow-hidden border-navy">
      <CardHeader className="bg-navy text-white py-2">
        <CardTitle className="text-center flex items-center justify-between">
          <span>{title}</span>
          <span className="text-sm">
            {loading ? "Carregando..." : `Página ${currentPage} de ${totalPages}`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-3rem)] flex items-center justify-center bg-white">
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-navy">Carregando documento...</p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* This would be replaced with actual PDF.js rendering */}
            <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4">
              <div className="bg-white shadow-lg w-full h-full flex items-center justify-center p-10 border">
                <p className="text-2xl text-center text-navy">
                  {documentType === "plasa" 
                    ? `Plano de Serviço - Página ${currentPage}`
                    : `Escala de Serviço - Página ${currentPage}`
                  }
                  <br />
                  <span className="text-sm text-gray-500">
                    Aqui seria exibido o conteúdo real do PDF usando PDF.js
                  </span>
                </p>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 bg-navy text-white px-3 py-1 rounded-full text-sm">
              {currentPage}/{totalPages}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
