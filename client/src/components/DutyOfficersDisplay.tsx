import { useState, useEffect } from 'react';
import { Users, AlertCircle, RefreshCw, Clock } from 'lucide-react';

interface DutyOfficers {
  id: number;
  officerName: string; // Nome completo com graduação: "1º Tenente KARINE"
  masterName: string; // Nome completo com graduação: "1º Sargento RAFAELA"
  updatedAt: string;
}

export const DutyOfficersDisplay = () => {
  const [officers, setOfficers] = useState<DutyOfficers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Agora não precisa mais traduzir ranks pois já vem completo

  // Detectar se estamos no Replit ou local
  const getBackendUrl = (): string => {
    const currentHost = window.location.hostname;
    const currentOrigin = window.location.origin;

    // Detectar Replit primeiro (mais específico)
    const isReplit = currentHost.includes('replit.dev');
    if (isReplit) {
      return `${currentOrigin}/api/duty-officers`;
    }

    // Ambiente local
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return `http://localhost:5000/api/duty-officers`;
    }

    // Fallback para outros ambientes
    return `${currentOrigin}/api/duty-officers`;
  };

  const loadOfficers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = getBackendUrl();
      console.log('👮 Carregando oficiais de serviço...', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setOfficers(data.officers);
        console.log('👮 Oficiais carregados:', data.officers);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar oficiais';
      setError(errorMsg);
      console.error('❌ Erro ao carregar oficiais:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadOfficers();
  }, []);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      loadOfficers();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/80">
        <Users className="w-4 h-4" />
        <span className="text-sm">Carregando oficiais...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-white/80">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Oficiais indisponíveis</span>
        <button 
          onClick={loadOfficers}
          className="p-1 hover:bg-white/10 rounded"
          disabled={loading}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  if (!officers || (!officers.officerName && !officers.masterName)) {
    return (
      <div className="flex items-center gap-2 text-white/80">
        <Users className="w-4 h-4" />
        <span className="text-sm">Oficiais não definidos</span>
        <button 
          onClick={loadOfficers}
          className="p-1 hover:bg-white/10 rounded"
          title="Atualizar"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-800/20 to-blue-900/20 backdrop-blur-sm rounded-lg border border-blue-400/20 px-4 py-2 shadow-lg">
      {/* Ícone */}
      <div className="p-1.5 bg-blue-500/20 rounded-full">
        <Users className="w-4 h-4 text-blue-300" />
      </div>
      
      {/* Informações dos oficiais */}
      <div className="flex flex-col gap-1">
        {officers.officerName && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-300 font-medium">Oficial:</span>
            <span className="text-white font-semibold text-sm">
              {officers.officerName}
            </span>
          </div>
        )}
        
        {officers.masterName && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-300 font-medium">Contramestre:</span>
            <span className="text-white font-semibold text-sm">
              {officers.masterName}
            </span>
          </div>
        )}
      </div>
      
      {/* Botão de refresh */}
      <button 
        onClick={loadOfficers}
        className="p-1.5 hover:bg-blue-500/20 rounded-full transition-all duration-200 hover:scale-110"
        title="Atualizar oficiais de serviço"
        disabled={loading}
      >
        <RefreshCw className={`w-3 h-3 text-blue-300 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};