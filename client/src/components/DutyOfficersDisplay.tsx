import { useState, useEffect } from 'react';
import { Users, AlertCircle, RefreshCw } from 'lucide-react';

interface DutyOfficers {
  id: number;
  officerName: string;
  officerRank: "1t" | "2t" | "ct";
  masterName: string;
  masterRank: "3sg" | "2sg" | "1sg";
  updatedAt: string;
}

export const DutyOfficersDisplay = () => {
  const [officers, setOfficers] = useState<DutyOfficers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para traduzir ranks
  const translateRank = (rank: string): string => {
    const rankMap: Record<string, string> = {
      '1t': '1º Tenente',
      '2t': '2º Tenente', 
      'ct': 'Capitão-Tenente',
      '3sg': '3º Sargento',
      '2sg': '2º Sargento',
      '1sg': '1º Sargento'
    };
    return rankMap[rank] || rank;
  };

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
    <div className="flex items-center gap-3 text-white">
      <Users className="w-4 h-4" />
      <div className="flex flex-col gap-1">
        {officers.officerName && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">Oficial de Serviço:</span>
            <img 
              src={`/rank-insignias/${officers.officerRank}.svg`}
              alt={`Patente ${officers.officerRank.toUpperCase()}`}
              className="w-8 h-4 object-contain"
              onError={(e) => {
                // Fallback se imagem não carregar
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="font-medium text-sm">
              {translateRank(officers.officerRank)} {officers.officerName}
            </span>
          </div>
        )}
        {officers.masterName && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">Contramestre de Serviço:</span>
            <img 
              src={`/rank-insignias/${officers.masterRank}.svg`}
              alt={`Patente ${officers.masterRank.toUpperCase()}`}
              className="w-8 h-4 object-contain"
              onError={(e) => {
                // Fallback se imagem não carregar
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="font-medium text-sm">
              {translateRank(officers.masterRank)} {officers.masterName}
            </span>
          </div>
        )}
      </div>
      <button 
        onClick={loadOfficers}
        className="p-1 hover:bg-white/10 rounded transition-colors"
        disabled={loading}
        title="Atualizar oficiais"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};