import React from 'react';

// Componente para exibir patentes militares com SVGs
export interface MilitaryRank {
  code: string;
  name: string;
  category: 'oficial-general' | 'oficial-superior' | 'oficial-intermediario' | 'oficial-subalterno' | 'graduado' | 'praca';
}

// Banco de dados de patentes
export const MILITARY_RANKS: Record<string, MilitaryRank> = {
  // Oficiais Generais
  'ALM': { code: 'ALM', name: 'Almirante', category: 'oficial-general' },
  'VE': { code: 'VE', name: 'Vice-Almirante', category: 'oficial-general' },
  'CE': { code: 'CE', name: 'Contra-Almirante', category: 'oficial-general' },
  
  // Oficiais Superiores
  'CMG': { code: 'CMG', name: 'Capitão-de-Mar-e-Guerra', category: 'oficial-superior' },
  'CF': { code: 'CF', name: 'Capitão-de-Fragata', category: 'oficial-superior' },
  'CC': { code: 'CC', name: 'Capitão-de-Corveta', category: 'oficial-superior' },
  
  // Oficial Intermediário
  'CT': { code: 'CT', name: 'Capitão-Tenente', category: 'oficial-intermediario' },
  
  // Oficiais Subalternos
  '1TEN': { code: '1TEN', name: 'Primeiro-Tenente', category: 'oficial-subalterno' },
  '2TEN': { code: '2TEN', name: 'Segundo-Tenente', category: 'oficial-subalterno' },
  'GM': { code: 'GM', name: 'Guarda-Marinha', category: 'oficial-subalterno' },
  
  // Graduados
  'SO': { code: 'SO', name: 'Suboficial', category: 'graduado' },
  '1SG': { code: '1SG', name: 'Primeiro-Sargento', category: 'graduado' },
  '2SG': { code: '2SG', name: 'Segundo-Sargento', category: 'graduado' },
  '3SG': { code: '3SG', name: 'Terceiro-Sargento', category: 'graduado' },
  'CB': { code: 'CB', name: 'Cabo', category: 'graduado' },
  
  // Praças
  'MN': { code: 'MN', name: 'Marinheiro', category: 'praca' }
};

// Componente SVG para cada patente
export const RankIcon: React.FC<{ rank: string; size?: number }> = ({ rank, size = 32 }) => {
  const rankData = MILITARY_RANKS[rank];
  
  if (!rankData) {
    return (
      <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center text-xs font-bold text-gray-600">
        ?
      </div>
    );
  }

  const renderRankSVG = () => {
    switch (rankData.category) {
      case 'oficial-general':
        return (
          <svg width={size} height={size} viewBox="0 0 48 32" className="drop-shadow-md">
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FFA500" />
                <stop offset="100%" stopColor="#FF8C00" />
              </linearGradient>
            </defs>
            <rect x="2" y="8" width="44" height="16" fill="url(#goldGradient)" stroke="#B8860B" strokeWidth="1" rx="2"/>
            {rank === 'ALM' && (
              <>
                <polygon points="8,12 12,16 8,20" fill="#FF0000"/>
                <polygon points="14,12 18,16 14,20" fill="#FF0000"/>
                <polygon points="20,12 24,16 20,20" fill="#FF0000"/>
                <polygon points="26,12 30,16 26,20" fill="#FF0000"/>
                <circle cx="36" cy="16" r="3" fill="#FFD700" stroke="#B8860B"/>
              </>
            )}
            {rank === 'VE' && (
              <>
                <polygon points="10,12 14,16 10,20" fill="#FF0000"/>
                <polygon points="16,12 20,16 16,20" fill="#FF0000"/>
                <polygon points="22,12 26,16 22,20" fill="#FF0000"/>
                <circle cx="32" cy="16" r="3" fill="#FFD700" stroke="#B8860B"/>
              </>
            )}
            {rank === 'CE' && (
              <>
                <polygon points="12,12 16,16 12,20" fill="#FF0000"/>
                <polygon points="18,12 22,16 18,20" fill="#FF0000"/>
                <circle cx="28" cy="16" r="3" fill="#FFD700" stroke="#B8860B"/>
              </>
            )}
          </svg>
        );
        
      case 'oficial-superior':
        return (
          <svg width={size} height={size} viewBox="0 0 48 32" className="drop-shadow-md">
            <rect x="2" y="12" width="44" height="8" fill="#1a1a1a" stroke="#333" strokeWidth="1" rx="1"/>
            {Array.from({ length: rank === 'CMG' ? 4 : rank === 'CF' ? 3 : 2 }, (_, i) => (
              <rect key={i} x={8 + i * 8} y="14" width="6" height="4" fill="#FFD700" />
            ))}
            <circle cx="6" cy="16" r="2" fill="#FFD700"/>
          </svg>
        );
        
      case 'oficial-intermediario':
        return (
          <svg width={size} height={size} viewBox="0 0 48 32" className="drop-shadow-md">
            <rect x="2" y="12" width="44" height="8" fill="#1a1a1a" stroke="#333" strokeWidth="1" rx="1"/>
            <rect x="8" y="14" width="6" height="4" fill="#FFD700" />
            <rect x="16" y="14" width="6" height="4" fill="#FFD700" />
            <circle cx="6" cy="16" r="2" fill="#FFD700"/>
          </svg>
        );
        
      case 'oficial-subalterno':
        return (
          <svg width={size} height={size} viewBox="0 0 48 32" className="drop-shadow-md">
            <rect x="2" y="12" width="44" height="8" fill="#1a1a1a" stroke="#333" strokeWidth="1" rx="1"/>
            {rank === '1TEN' && (
              <>
                <rect x="8" y="14" width="6" height="4" fill="#FFD700" />
                <circle cx="18" cy="16" r="2" fill="#FFD700"/>
              </>
            )}
            {rank === '2TEN' && (
              <circle cx="12" cy="16" r="2" fill="#FFD700"/>
            )}
            {rank === 'GM' && (
              <rect x="8" y="14" width="6" height="4" fill="#FFD700" />
            )}
            <circle cx="6" cy="16" r="2" fill="#FFD700"/>
          </svg>
        );
        
      case 'graduado':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" className="drop-shadow-md">
            <rect x="4" y="12" width="24" height="8" fill="#1a1a1a" stroke="#333" strokeWidth="1" rx="1"/>
            {rank === 'SO' && (
              <polygon points="12,14 16,18 12,22" fill="#FFD700"/>
            )}
            {rank === '1SG' && (
              <>
                <polygon points="8,16 12,12 12,20" fill="#FFD700"/>
                <polygon points="12,16 16,12 16,20" fill="#FFD700"/>
                <polygon points="16,16 20,12 20,20" fill="#FFD700"/>
              </>
            )}
            {rank === '2SG' && (
              <>
                <polygon points="10,16 14,12 14,20" fill="#FFD700"/>
                <polygon points="14,16 18,12 18,20" fill="#FFD700"/>
              </>
            )}
            {rank === '3SG' && (
              <polygon points="12,16 16,12 16,20" fill="#FFD700"/>
            )}
            {rank === 'CB' && (
              <polygon points="12,16 16,12 16,20" fill="#FFD700"/>
            )}
          </svg>
        );
        
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" className="drop-shadow-md">
            <rect x="4" y="12" width="24" height="8" fill="#1a1a1a" stroke="#333" strokeWidth="1" rx="1"/>
            <text x="16" y="18" textAnchor="middle" fill="#FFD700" fontSize="8" fontWeight="bold">MN</text>
          </svg>
        );
    }
  };

  return (
    <div className="flex items-center justify-center" title={rankData.name}>
      {renderRankSVG()}
    </div>
  );
};

// Componente principal para exibir oficial com patente
export const OfficerDisplay: React.FC<{ 
  rank: string; 
  name: string; 
  role: string;
  icon: string;
}> = ({ rank, name, role, icon }) => {
  const rankData = MILITARY_RANKS[rank];
  
  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg px-4 py-3 border border-blue-400/30 shadow-inner">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <RankIcon rank={rank} size={28} />
        </div>
        <div className="text-left">
          <div className="text-blue-100 text-xs font-semibold">
            {role}
          </div>
          <div className="text-blue-50 text-sm font-bold flex items-center gap-2">
            <span className="text-yellow-400">{rank}</span>
            <span>{name}</span>
          </div>
          {rankData && (
            <div className="text-blue-200 text-xs opacity-80">
              {rankData.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default { RankIcon, OfficerDisplay, MILITARY_RANKS };