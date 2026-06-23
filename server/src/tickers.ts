// Référentiel non exhaustif de tickers BRVM courants (zone UEMOA).
// L'utilisateur peut saisir des tickers libres en plus de cette liste.

export interface TickerRef {
  ticker: string;
  name: string;
  sector: string;
}

export const BRVM_TICKERS: TickerRef[] = [
  { ticker: "SNTS", name: "Sonatel", sector: "Télécommunications" },
  { ticker: "ONTBF", name: "ONATEL Burkina Faso", sector: "Télécommunications" },
  { ticker: "ORAC", name: "Orange Côte d'Ivoire", sector: "Télécommunications" },

  { ticker: "ETIT", name: "Ecobank Transnational Inc.", sector: "Finance" },
  { ticker: "ECOC", name: "Ecobank Côte d'Ivoire", sector: "Finance" },
  { ticker: "BOAS", name: "Bank of Africa Sénégal", sector: "Finance" },
  { ticker: "BOAC", name: "Bank of Africa Côte d'Ivoire", sector: "Finance" },
  { ticker: "BOAB", name: "Bank of Africa Bénin", sector: "Finance" },
  { ticker: "BOABF", name: "Bank of Africa Burkina Faso", sector: "Finance" },
  { ticker: "BOAM", name: "Bank of Africa Mali", sector: "Finance" },
  { ticker: "BOAN", name: "Bank of Africa Niger", sector: "Finance" },
  { ticker: "SGBC", name: "Société Générale Côte d'Ivoire", sector: "Finance" },
  { ticker: "SIBC", name: "Société Ivoirienne de Banque", sector: "Finance" },
  { ticker: "NSBC", name: "NSIA Banque Côte d'Ivoire", sector: "Finance" },
  { ticker: "ORGT", name: "Oragroup", sector: "Finance" },
  { ticker: "CBIBF", name: "Coris Bank International", sector: "Finance" },

  { ticker: "TTLC", name: "TotalEnergies Marketing Côte d'Ivoire", sector: "Distribution" },
  { ticker: "TTLS", name: "TotalEnergies Marketing Sénégal", sector: "Distribution" },
  { ticker: "SHEC", name: "Vivo Energy Côte d'Ivoire", sector: "Distribution" },
  { ticker: "CFAC", name: "CFAO Motors Côte d'Ivoire", sector: "Distribution" },
  { ticker: "BNBC", name: "Bernabé Côte d'Ivoire", sector: "Distribution" },
  { ticker: "PRSC", name: "Tractafric Motors Côte d'Ivoire", sector: "Distribution" },

  { ticker: "PALC", name: "Palm Côte d'Ivoire", sector: "Agro-industrie" },
  { ticker: "SPHC", name: "SAPH", sector: "Agro-industrie" },
  { ticker: "SOGC", name: "SOGB", sector: "Agro-industrie" },
  { ticker: "SCRC", name: "Sucrivoire", sector: "Agro-industrie" },
  { ticker: "SICC", name: "SICOR", sector: "Agro-industrie" },

  { ticker: "NTLC", name: "Nestlé Côte d'Ivoire", sector: "Industrie" },
  { ticker: "UNXC", name: "Uniwax", sector: "Industrie" },
  { ticker: "FTSC", name: "Filtisac", sector: "Industrie" },
  { ticker: "STBC", name: "SITAB", sector: "Industrie" },
  { ticker: "SLBC", name: "Solibra", sector: "Industrie" },
  { ticker: "SMBC", name: "Société Multinationale de Bitumes", sector: "Industrie" },
  { ticker: "CABC", name: "SICABLE", sector: "Industrie" },
  { ticker: "SEMC", name: "Crown SIEM", sector: "Industrie" },

  { ticker: "SDCC", name: "SODECI", sector: "Services publics" },
  { ticker: "CIEC", name: "CIE", sector: "Services publics" },
  { ticker: "ABJC", name: "Servair Abidjan", sector: "Services" },
  { ticker: "SVOC", name: "Movis Côte d'Ivoire", sector: "Transport" },
  { ticker: "LNBB", name: "Loterie Nationale du Bénin", sector: "Services" },
];
