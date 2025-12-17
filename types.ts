export interface Stock {
  symbol: string;
}

export interface PortfolioItem {
  symbol: string;
  quantity: number;
}

export interface DividendEvent {
  symbol: string;
  exDate: string; // YYYY-MM-DD
  payDate: string; // YYYY-MM-DD
  amount: number;
  currency: string;
  frequency?: string;
  status?: 'Confirmed' | 'Estimated';
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface DividendData {
  events: DividendEvent[];
  sources: GroundingSource[];
  lastUpdated: number;
}

export interface AppState {
  portfolio: PortfolioItem[];
  dividendData: DividendData | null;
  isLoading: boolean;
  error: string | null;
}