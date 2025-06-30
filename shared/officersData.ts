// Dados dos oficiais baseados no sistema da Marinha
// Extraído do quadro de oficiais da Pagadoria de Pessoal da Marinha

export interface OfficerData {
  name: string;
  rank: "1t" | "2t" | "ct" | "cc" | "cf";
  specialty?: string;
  fullRankName: string;
}

export interface MasterData {
  name: string;
  rank: "3sg" | "2sg" | "1sg";
  specialty?: string;
  fullRankName: string;
}

// Lista de oficiais disponíveis para serviço
export const OFFICERS_LIST: OfficerData[] = [
  // Capitães-de-Corveta (CC)
  { name: "TAMIRES", rank: "cc", specialty: "QC-IM", fullRankName: "Capitão-de-Corveta" },
  { name: "CHAVES", rank: "cc", specialty: "QC-IM", fullRankName: "Capitão-de-Corveta" },
  { name: "VIANA", rank: "cc", specialty: "RM2-T", fullRankName: "Capitão-de-Corveta" },
  { name: "PINA TRIGO", rank: "cc", specialty: "RM2-T", fullRankName: "Capitão-de-Corveta" },
  
  // Capitães-Tenentes (CT)
  { name: "KLEBER", rank: "ct", specialty: "IM", fullRankName: "Capitão-Tenente" },
  { name: "CRISTIANE MORETTO", rank: "ct", specialty: "IM", fullRankName: "Capitão-Tenente" },
  { name: "PAULA BALLARD", rank: "ct", specialty: "T", fullRankName: "Capitão-Tenente" },
  { name: "REJANE AMARAL", rank: "ct", specialty: "T", fullRankName: "Capitão-Tenente" },
  { name: "ROGÉRIO RIBEIRO", rank: "ct", specialty: "T", fullRankName: "Capitão-Tenente" },
  { name: "ELAINE ANDRADE", rank: "ct", specialty: "T", fullRankName: "Capitão-Tenente" },
  { name: "CAMILA", rank: "ct", specialty: "IM", fullRankName: "Capitão-Tenente" },
  { name: "AZEVEDO", rank: "ct", specialty: "IM", fullRankName: "Capitão-Tenente" },
  { name: "REGINA GRISI", rank: "ct", specialty: "IM", fullRankName: "Capitão-Tenente" },
  { name: "WILLIAM", rank: "ct", specialty: "T", fullRankName: "Capitão-Tenente" },
  { name: "YAGO", rank: "ct", specialty: "IM", fullRankName: "Capitão-Tenente" },
  { name: "MATEUS BARBOSA", rank: "ct", specialty: "IM", fullRankName: "Capitão-Tenente" },
  
  // Primeiros-Tenentes (1T)
  { name: "KARINE", rank: "1t", specialty: "RM2-T", fullRankName: "Primeiro-Tenente" },
  { name: "LEONARDO ANDRADE", rank: "1t", specialty: "IM", fullRankName: "Primeiro-Tenente" },
  { name: "ELIEZER", rank: "1t", specialty: "IM", fullRankName: "Primeiro-Tenente" },
  { name: "LARISSA CASTRO", rank: "1t", specialty: "RM2-T", fullRankName: "Primeiro-Tenente" },
  { name: "ALEXANDRIA", rank: "1t", specialty: "IM", fullRankName: "Primeiro-Tenente" },
  
  // Segundos-Tenentes (2T)
  { name: "MARCO MARTINS", rank: "2t", specialty: "AA", fullRankName: "Segundo-Tenente" },
  { name: "MACHADO", rank: "2t", specialty: "AA", fullRankName: "Segundo-Tenente" },
  
  // Capitães-de-Mar-e-Guerra (CMG)
  { name: "EIRAS", rank: "cf", specialty: "RM1-T", fullRankName: "Capitão-de-Mar-e-Guerra" },
  { name: "FERNANDO REIS", rank: "cf", specialty: "RM1-IM", fullRankName: "Capitão-de-Mar-e-Guerra" },
  { name: "EDER HYPÓLITO", rank: "cf", specialty: "RM1-T", fullRankName: "Capitão-de-Mar-e-Guerra" },
  { name: "VERÍSSIMO", rank: "cf", specialty: "RM1-T", fullRankName: "Capitão-de-Mar-e-Guerra" }
];

// Lista de contramestreS disponíveis para serviço
export const MASTERS_LIST: MasterData[] = [
  { name: "SILVA SANTOS", rank: "1sg", specialty: "Administração", fullRankName: "Primeiro-Sargento" },
  { name: "OLIVEIRA COSTA", rank: "1sg", specialty: "Logística", fullRankName: "Primeiro-Sargento" },
  { name: "SOUZA LIMA", rank: "2sg", specialty: "Comunicações", fullRankName: "Segundo-Sargento" },
  { name: "PEREIRA ROCHA", rank: "2sg", specialty: "Administração", fullRankName: "Segundo-Sargento" },
  { name: "FERREIRA ALVES", rank: "3sg", specialty: "Apoio", fullRankName: "Terceiro-Sargento" },
  { name: "RODRIGUES NUNES", rank: "3sg", specialty: "Manutenção", fullRankName: "Terceiro-Sargento" },
  { name: "MARTINS GOMES", rank: "1sg", specialty: "Segurança", fullRankName: "Primeiro-Sargento" },
  { name: "BARBOSA CARVALHO", rank: "2sg", specialty: "Operações", fullRankName: "Segundo-Sargento" }
];

// Função para obter dados completos de um oficial
export function getOfficerByName(name: string): OfficerData | undefined {
  return OFFICERS_LIST.find(officer => 
    officer.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(officer.name.toLowerCase())
  );
}

// Função para obter dados completos de um contramestre
export function getMasterByName(name: string): MasterData | undefined {
  return MASTERS_LIST.find(master => 
    master.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(master.name.toLowerCase())
  );
}

// Função para obter lista de oficiais por posto
export function getOfficersByRank(rank: string): OfficerData[] {
  return OFFICERS_LIST.filter(officer => officer.rank === rank);
}

// Função para obter lista de contramesters por graduação
export function getMastersByRank(rank: string): MasterData[] {
  return MASTERS_LIST.filter(master => master.rank === rank);
}

// Mapas de tradução para exibição
export const RANK_DISPLAY_MAP = {
  "ct": "CT",
  "cc": "CC", 
  "cf": "CMG",
  "1t": "1º TEN",
  "2t": "2º TEN",
  "1sg": "1º SG",
  "2sg": "2º SG", 
  "3sg": "3º SG"
};

export const RANK_FULL_NAME_MAP = {
  "ct": "Capitão-Tenente",
  "cc": "Capitão-de-Corveta",
  "cf": "Capitão-de-Mar-e-Guerra", 
  "1t": "Primeiro-Tenente",
  "2t": "Segundo-Tenente",
  "1sg": "Primeiro-Sargento",
  "2sg": "Segundo-Sargento",
  "3sg": "Terceiro-Sargento"
};