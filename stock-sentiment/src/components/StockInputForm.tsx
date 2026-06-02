import React, { useState } from 'react';
import { SearchIcon } from './icons/SearchIcon';

const EXCHANGES = ['NSE', 'BSE', 'NASDAQ', 'NYSE', 'LSE', 'TSE'];

interface Props {
  initialSymbol: string;
  selectedExchange: string;
  onExchangeChange: (exchange: string) => void;
  onSubmit: (symbol: string, exchange: string) => void;
  isLoading: boolean;
}

const StockInputForm: React.FC<Props> = ({
  initialSymbol,
  selectedExchange,
  onExchangeChange,
  onSubmit,
  isLoading,
}) => {
  const [symbol, setSymbol] = useState(initialSymbol);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(symbol.trim().toUpperCase(), selectedExchange);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center bg-gray-800 rounded-full shadow-lg border border-gray-700 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/30 transition-all">
        <select
          value={selectedExchange}
          onChange={e => onExchangeChange(e.target.value)}
          disabled={isLoading}
          aria-label="Select exchange"
          className="bg-transparent text-gray-300 text-sm font-medium pl-5 pr-2 py-4 rounded-l-full outline-none cursor-pointer disabled:opacity-50"
        >
          {EXCHANGES.map(ex => (
            <option key={ex} value={ex} className="bg-gray-800">
              {ex}
            </option>
          ))}
        </select>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        <input
          type="text"
          value={symbol}
          onChange={e => setSymbol(e.target.value)}
          disabled={isLoading}
          placeholder="e.g., INFY, AAPL, MSFT"
          aria-label="Stock symbol"
          className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-4 outline-none disabled:opacity-50 text-sm"
        />

        <button
          type="submit"
          disabled={isLoading || !symbol.trim()}
          aria-label="Analyze stock"
          className="m-1.5 p-3 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-white rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <SearchIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </form>
  );
};

export default StockInputForm;
