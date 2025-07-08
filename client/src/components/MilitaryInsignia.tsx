import { getMilitaryInsigniaImage, getMilitaryInsigniaDescription, hasInsignia } from '@/../../shared/insigniaData';

interface MilitaryInsigniaProps {
  rank: string;
  specialty?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

export function MilitaryInsignia({ 
  rank, 
  specialty, 
  name, 
  size = 'md', 
  showDescription = false,
  className = ''
}: MilitaryInsigniaProps) {
  const insigniaImage = getMilitaryInsigniaImage(rank, specialty);
  const description = getMilitaryInsigniaDescription(rank, specialty);
  
  if (!hasInsignia(rank, specialty)) {
    return null; // Não exibe nada se não houver insígnia
  }

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {insigniaImage && (
        <img
          src={insigniaImage}
          alt={description || `Insígnia ${rank}`}
          className={`${sizeClasses[size]} object-contain`}
          onError={(e) => {
            // Fallback se a imagem não carregar
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      
      {showDescription && description && (
        <span className="text-sm text-gray-600">
          {description}
        </span>
      )}
      
      {name && (
        <span className="font-medium">
          {name}
        </span>
      )}
    </div>
  );
}

// Componente específico para exibir militar com insígnia
interface MilitaryWithInsigniaProps {
  military: {
    name: string;
    rank: string;
    specialty?: string | null;
    fullRankName?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showFullRank?: boolean;
  className?: string;
}

export function MilitaryWithInsignia({ 
  military, 
  size = 'md', 
  showFullRank = false,
  className = ''
}: MilitaryWithInsigniaProps) {
  const displayName = showFullRank && military.fullRankName 
    ? `${military.fullRankName} ${military.name}`
    : military.name;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <MilitaryInsignia 
        rank={military.rank}
        specialty={military.specialty}
        size={size}
      />
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">
          {displayName}
        </span>
        {military.specialty && (
          <span className="text-xs text-gray-500 uppercase">
            {military.specialty}
          </span>
        )}
      </div>
    </div>
  );
}

// Hook para buscar insígnia de um militar
export function useMilitaryInsignia(rank: string, specialty?: string | null) {
  return {
    hasInsignia: hasInsignia(rank, specialty),
    imagePath: getMilitaryInsigniaImage(rank, specialty),
    description: getMilitaryInsigniaDescription(rank, specialty)
  };
}