import React, { useMemo, useState } from 'react';
import { DividendData, DividendEvent, PortfolioItem } from '../types';
import { Calendar, DollarSign, ExternalLink, Clock, AlertCircle } from 'lucide-react';

interface DividendAgendaProps {
  data: DividendData | null;
  portfolio: PortfolioItem[];
  isLoading: boolean;
}

const USD_TO_ILS_RATE = 3.65; // Approximate fixed rate for estimation

export const DividendAgenda: React.FC<DividendAgendaProps> = ({ data, portfolio, isLoading }) => {
  const [currency, setCurrency] = useState<'USD' | 'ILS'>('USD');
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year' | 'all'>('all');

  // Helper to normalize currency strings
  const normalizeCurrency = (curr: string) => {
    if (!curr) return 'USD';
    const c = curr.toUpperCase();
    if (c.includes('US') || c.includes('$')) return 'USD';
    if (c.includes('IL') || c.includes('NIS') || c.includes('SHEKEL')) return 'ILS';
    return c;
  };

  // Helper to convert amount to selected currency
  const convertAmount = (amount: number, fromCurrency: string, targetCurrency: 'USD' | 'ILS') => {
    const from = normalizeCurrency(fromCurrency);
    if (from === targetCurrency) return amount;

    if (targetCurrency === 'ILS') {
      // From USD (or other) to ILS
      return from === 'USD' ? amount * USD_TO_ILS_RATE : amount;
    } else {
      // From ILS to USD
      return from === 'ILS' ? amount / USD_TO_ILS_RATE : amount;
    }
  };

  const filteredEvents = useMemo(() => {
    if (!data?.events) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let cutoff = new Date(now);

    if (timeFilter === 'week') cutoff.setDate(now.getDate() + 7);
    else if (timeFilter === 'month') cutoff.setDate(now.getDate() + 30);
    else if (timeFilter === 'year') cutoff.setDate(now.getDate() + 365);
    else cutoff.setFullYear(now.getFullYear() + 100);

    return data.events
      .filter(e => {
        // Parse date string (YYYY-MM-DD) to local midnight to ensure fair comparison
        const [y, m, d] = e.payDate.split('-').map(Number);
        const payDate = new Date(y, m - 1, d);
        return payDate >= now && payDate <= cutoff;
      })
      .sort((a, b) => new Date(a.payDate).getTime() - new Date(b.payDate).getTime());
  }, [data, timeFilter]);

  const stats = useMemo(() => {
    const totalAmount = filteredEvents.reduce((acc, curr) => {
      const quantity = portfolio.find(p => p.symbol === curr.symbol)?.quantity || 0;
      const amountPerShare = convertAmount(curr.amount, curr.currency, currency);
      return acc + (amountPerShare * quantity);
    }, 0);

    return {
      total: totalAmount,
      count: filteredEvents.length,
      avg: filteredEvents.length ? totalAmount / filteredEvents.length : 0
    };
  }, [filteredEvents, currency, portfolio]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 animate-pulse py-20">
        <div className="w-16 h-16 bg-slate-800 rounded-full"></div>
        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        <div className="h-4 bg-slate-800 rounded w-1/4"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-800 rounded-3xl mt-4">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-medium text-slate-300 mb-2">Ready to track</h3>
        <p className="text-slate-500 max-w-sm">
          Calculations will appear here.
        </p>
      </div>
    );
  }

  const currencySymbol = currency === 'USD' ? '$' : '₪';

  return (
    <div className="flex flex-col h-full space-y-6 pb-20">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Agenda</h2>
          {/* Currency Toggle */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${currency === 'USD' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              USD
            </button>
            <button
              onClick={() => setCurrency('ILS')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${currency === 'ILS' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              ILS
            </button>
          </div>
        </div>

        {/* Time Filter Tabs */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 overflow-x-auto no-scrollbar">
          {(['week', 'month', 'year', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium capitalize whitespace-nowrap transition-all ${timeFilter === t ? 'bg-slate-700 text-white shadow border border-slate-600' : 'text-slate-400'}`}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="w-16 h-16 text-indigo-400" />
          </div>
          <p className="text-xs text-indigo-200 mb-1 font-medium uppercase tracking-wider">Total Income</p>
          <div className="text-3xl font-bold text-white tracking-tight">
            {currencySymbol}{stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Events</p>
          <div className="text-xl font-bold text-white">{stats.count}</div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Avg</p>
          <div className="text-xl font-bold text-emerald-400">
            {currencySymbol}{stats.avg.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wide text-slate-500">
          Upcoming
        </h3>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
            No dividends found.
          </div>
        ) : (
          filteredEvents.map((event, idx) => {
            const quantity = portfolio.find(p => p.symbol === event.symbol)?.quantity || 0;
            const rawAmount = convertAmount(event.amount, event.currency, currency);
            const totalPayout = rawAmount * quantity;

            return (
              <div key={`${event.symbol}-${idx}`} className="relative pl-6 pb-2 last:pb-0">
                {/* Timeline Line */}
                <div className="absolute left-0 top-3 bottom-0 w-px bg-slate-800 last:bottom-auto last:h-full"></div>
                <div className="absolute left-[-4px] top-3 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-slate-950"></div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{event.symbol}</span>
                        {event.status === 'Estimated' && (() => {
                          const [y, m, d] = event.exDate.split('-').map(Number);
                          const exDate = new Date(y, m - 1, d);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return exDate >= today;
                        })() && (
                            <span className="px-1.5 py-0.5 text-[9px] uppercase bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
                              Est
                            </span>
                          )}
                      </div>
                      <div className="text-sm text-slate-400 mt-1 flex flex-col gap-0.5">
                        <div>X-date: <span className="text-slate-300">{event.exDate}</span></div>
                        <div className="text-xs text-slate-500">
                          {quantity} × {currencySymbol}{rawAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-400 flex items-center justify-end">
                        <span className="text-sm text-emerald-500/70 mr-1">{currencySymbol}</span>
                        {totalPayout.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Pay: <span className="text-slate-300">{event.payDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Grounding Sources */}
      {data.sources.length > 0 && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            Sources
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.uri}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800 transition-colors max-w-full truncate"
              >
                {source.title} <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};