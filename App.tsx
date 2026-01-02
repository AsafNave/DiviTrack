import React, { useState, useEffect, useCallback } from 'react';
import { StockManager } from './components/StockManager';
import { DividendAgenda } from './components/DividendAgenda';
import { AppState, DividendData, PortfolioItem } from './types';
import { fetchDividendData } from './services/yahooService';
import { CACHE_DURATION_MS, STORAGE_KEY_DATA, STORAGE_KEY_TICKERS } from './constants';
import { LayoutList, CalendarDays, Plus } from 'lucide-react';

const App: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [data, setData] = useState<DividendData | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stocks' | 'agenda'>('stocks');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const savedPortfolio = localStorage.getItem(STORAGE_KEY_TICKERS);
      if (savedPortfolio) {
        const parsed = JSON.parse(savedPortfolio);
        // Migration: Handle old string[] format
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          setPortfolio(parsed.map((symbol: string) => ({ symbol, quantity: 1 })));
        } else {
          setPortfolio(parsed);
        }
      }

      const savedData = localStorage.getItem(STORAGE_KEY_DATA);
      if (savedData) {
        const parsed: DividendData = JSON.parse(savedData);
        const now = Date.now();
        // Check cache validity
        if (now - parsed.lastUpdated < CACHE_DURATION_MS) {
          setData(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY_DATA);
        }
      }
    } catch (e) {
      console.error("Failed to load from storage", e);
    }
  }, []);

  // Save portfolio whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TICKERS, JSON.stringify(portfolio));
  }, [portfolio]);

  const handleAddTicker = (ticker: string) => {
    if (!portfolio.some(p => p.symbol === ticker)) {
      setPortfolio(prev => [...prev, { symbol: ticker, quantity: 1 }]);
    }
  };

  const handleRemoveTicker = (ticker: string) => {
    setPortfolio(prev => prev.filter(p => p.symbol !== ticker));
  };

  const handleUpdateQuantity = (ticker: string, quantity: number) => {
    setPortfolio(prev => prev.map(p => p.symbol === ticker ? { ...p, quantity } : p));
  };

  const handleExecute = useCallback(async () => {
    setIsExecuting(true);
    setError(null);
    setActiveTab('agenda'); // Switch to agenda tab on execute

    try {
      const tickers = portfolio.map(p => p.symbol);
      const result = await fetchDividendData(tickers);

      const newData: DividendData = {
        events: result.events,
        sources: result.sources,
        lastUpdated: Date.now()
      };

      setData(newData);
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(newData));
    } catch (err: any) {
      console.error("Error executing fetch:", err);
      setError(err.message || "Failed to fetch dividend data. Please try again.");
      setActiveTab('stocks'); // Switch back on error
    } finally {
      setIsExecuting(false);
    }
  }, [portfolio]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Mobile Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 h-14 px-4 flex items-center justify-between">
        <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          DiviTrack
        </h1>
        {activeTab === 'stocks' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="p-2 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        {error && (
          <div className="mx-4 mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center justify-between animate-fadeIn">
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="text-xs hover:underline">Dismiss</button>
          </div>
        )}

        <div className="max-w-3xl mx-auto h-full">
          {activeTab === 'stocks' ? (
            <StockManager
              portfolio={portfolio}
              onAddTicker={handleAddTicker}
              onRemoveTicker={handleRemoveTicker}
              onUpdateQuantity={handleUpdateQuantity}
              onExecute={handleExecute}
              isExecuting={isExecuting}
              isAddModalOpen={isAddModalOpen}
              closeAddModal={() => setIsAddModalOpen(false)}
            />
          ) : (
            <div className="p-4">
              <DividendAgenda
                data={data}
                portfolio={portfolio}
                isLoading={isExecuting}
              />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-slate-900 border-t border-slate-800 fixed bottom-0 w-full z-40 pb-safe">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'stocks' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LayoutList className="w-6 h-6" />
            <span className="text-[10px] font-medium">Portfolio</span>
          </button>

          <div className="w-px h-8 bg-slate-800"></div>

          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'agenda' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <CalendarDays className="w-6 h-6" />
            <span className="text-[10px] font-medium">Agenda</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;