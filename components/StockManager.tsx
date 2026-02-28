import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Trash2, Search, Hash, X, Check } from 'lucide-react';
import { POPULAR_STOCKS } from '../data/stockList';
import { PortfolioItem } from '../types';

interface StockManagerProps {
  portfolio: PortfolioItem[];
  onAddTicker: (ticker: string) => void;
  onRemoveTicker: (ticker: string) => void;
  onUpdateQuantity: (ticker: string, quantity: number) => void;
  onExecute: () => void;
  isExecuting: boolean;
  isAddModalOpen: boolean;
  closeAddModal: () => void;
}

// Swipeable Item Component
const SwipeableItem: React.FC<{
  item: PortfolioItem;
  onRemove: (symbol: string) => void;
  onUpdateQuantity: (symbol: string, qty: number) => void;
}> = ({ item, onRemove, onUpdateQuantity }) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isSwiped, setIsSwiped] = useState(false);

  // Minimum swipe distance
  const minSwipeDistance = 75;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      setIsSwiped(true);
      // Small delay to allow animation
      setTimeout(() => onRemove(item.symbol), 300);
    }
  };

  return (
    <div className="relative overflow-hidden mb-3 select-none">
      {/* Background for swipe action (Red) */}
      <div className={`absolute inset-0 bg-red-500/20 rounded-xl flex items-center justify-between px-6 transition-opacity ${isSwiped ? 'opacity-100' : 'opacity-0'}`}>
        <Trash2 className="text-red-500 w-6 h-6" />
        <Trash2 className="text-red-500 w-6 h-6" />
      </div>

      {/* Foreground Content */}
      <div
        className={`relative bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between transition-transform duration-300 ease-out ${isSwiped ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex-1">
          <div className="font-bold text-lg text-slate-200">{item.symbol}</div>
          <div className="text-xs text-slate-500 mt-1">Swipe to remove</div>
        </div>

        <div className="flex items-center gap-2" onTouchStart={(e) => e.stopPropagation()}>
          <div className="relative">
            <Hash className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="number"
              min="0"
              step="any"
              value={item.quantity === 0 ? '' : item.quantity}
              onChange={(e) => {
                let valString = e.target.value;
                if (valString.length > 5) {
                  valString = valString.slice(0, 5);
                }
                const val = parseFloat(valString);
                onUpdateQuantity(item.symbol, isNaN(val) ? 0 : val);
              }}
              className="w-24 bg-slate-800 border border-slate-700 rounded-lg py-2 pl-6 pr-3 text-sm text-right text-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="Qty"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const StockManager: React.FC<StockManagerProps> = ({
  portfolio,
  onAddTicker,
  onRemoveTicker,
  onUpdateQuantity,
  onExecute,
  isExecuting,
  isAddModalOpen,
  closeAddModal
}) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isAddModalOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isAddModalOpen]);

  // Filter stocks
  const suggestions = POPULAR_STOCKS.filter(stock =>
    stock.symbol.toLowerCase().includes(input.toLowerCase()) ||
    stock.name.toLowerCase().includes(input.toLowerCase())
  ).slice(0, 6);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setShowSuggestions(e.target.value.trim().length > 0);
  };

  const addTicker = (ticker: string) => {
    if (ticker.trim()) {
      onAddTicker(ticker.trim().toUpperCase());
      setInput('');
      setShowSuggestions(false);
      closeAddModal();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      addTicker(suggestions[0].symbol);
    } else if (input.trim()) {
      addTicker(input);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Portfolio List */}
      <div className="flex-1 overflow-y-auto min-h-[300px]">
        {portfolio.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4">
            <div className="bg-slate-800 p-4 rounded-full">
              <Search className="w-8 h-8 opacity-50" />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-slate-400">Your portfolio is empty</p>
              <p className="text-sm mt-1">Tap + to add stocks</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 pb-20">
            {portfolio.map((item) => (
              <SwipeableItem
                key={item.symbol}
                item={item}
                onRemove={onRemoveTicker}
                onUpdateQuantity={onUpdateQuantity}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Execution */}
      <div className="fixed bottom-20 left-4 right-4 z-30">
        <Button
          onClick={onExecute}
          isLoading={isExecuting}
          disabled={portfolio.length === 0}
          className="w-full shadow-xl shadow-indigo-500/30 py-4 text-lg font-bold rounded-2xl"
        >
          Find Dividends
        </Button>
      </div>

      {/* Add Stock Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md mx-4 rounded-2xl shadow-2xl p-4 relative">
            <button
              onClick={closeAddModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Add Stock</h3>

            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Symbol (e.g. AAPL)"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl py-4 pl-4 pr-12 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                autoComplete="off"
              />
              {input.trim() && (
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white p-2 rounded-lg"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}
            </form>

            {/* Suggestions List */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {suggestions.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => addTicker(stock.symbol)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-700 border-b border-slate-700/50 last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-white">{stock.symbol}</div>
                      <div className="text-xs text-slate-400">{stock.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};