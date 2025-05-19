
import React, { useState, useEffect, useRef } from "react";
import { useDisplay } from "@/context/DisplayContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PDFViewerProps {
  documentType: "plasa" | "escala";
  title: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ documentType, title }) => {
  const { pageChangeInterval, activeEscalaDoc } = useDisplay();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5); // Placeholder, would normally come from PDF.js
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);
  
  // Simulate PDF loading and page changes
  useEffect(() => {
    setLoading(true);
    setCurrentPage(1); // Reset to first page when document changes
    
    // Simulate loading delay
    const loadTimer = setTimeout(() => {
      setLoading(false);
      
      // Random total pages between 3-10 for demo purposes
      // For PLASA, set random pages (as mentioned, it varies)
      // For Escala, just one page is enough based on the examples
      if (documentType === "plasa") {
        setTotalPages(Math.floor(Math.random() * 5) + 2); // 2-6 pages for PLASA
      } else {
        setTotalPages(1); // Escala is usually just one page
      }
    }, 1500);
    
    return () => {
      clearTimeout(loadTimer);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [documentType, activeEscalaDoc?.id]);
  
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

  // Display category subtitle for escala documents
  const categorySubtitle = documentType === "escala" && activeEscalaDoc?.category ? 
    `(${activeEscalaDoc.category === "oficial" ? "Oficiais" : "Praças"})` : 
    "";

  // Function to determine which image to display based on document type and category
  const getDocumentImage = () => {
    if (documentType === "plasa") {
      return "/lovable-uploads/8c1ec57b-2391-4a98-9fc7-5c4e55a162e0.png";
    } else if (documentType === "escala") {
      // Use the appropriate image based on the category
      if (activeEscalaDoc?.category === "oficial") {
        return "/lovable-uploads/8c1ec57b-2391-4a98-9fc7-5c4e55a162e0.png";
      } else {
        return "/lovable-uploads/ecf9c29e-dfcd-4c3a-bb9e-ede0338bd624.png";
      }
    }
    return "";
  };

  return (
    <Card className="h-full overflow-hidden border-navy">
      <CardHeader className="bg-navy text-white py-2">
        <CardTitle className="text-center flex items-center justify-between">
          <div className="flex items-center">
            <span>{title}</span>
            {categorySubtitle && <span className="ml-2 text-sm">{categorySubtitle}</span>}
          </div>
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
            {/* PDF container with proper A4 aspect ratio and scaling */}
            <div className="w-full h-full overflow-auto flex items-center justify-center bg-gray-100 p-4">
              <div className="bg-white shadow-lg w-full max-h-full aspect-[1/1.414] flex items-center justify-center p-4 border overflow-hidden">
                <img 
                  src={getDocumentImage()} 
                  alt={documentType === "plasa" ? "PLASA - Plano de Serviço" : "Escala de Serviço"}
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 text-center text-sm text-gray-500 bg-white/70 py-1">
                  Simulação de PDF - Página {currentPage} de {totalPages}
                </div>
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
