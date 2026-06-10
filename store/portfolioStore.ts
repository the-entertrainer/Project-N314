import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  avgPrice: number;
}

interface PortfolioState {
  holdings: PortfolioHolding[];
  addHolding: (holding: PortfolioHolding) => void;
  removeHolding: (symbol: string) => void;
  updateQuantity: (symbol: string, quantity: number) => void;
  clearPortfolio: () => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      holdings: [],
      addHolding: (holding) =>
        set((state) => {
          const existing = state.holdings.findIndex(h => h.symbol === holding.symbol);
          if (existing !== -1) {
            const updated = [...state.holdings];
            updated[existing] = {
              ...updated[existing],
              quantity: updated[existing].quantity + holding.quantity,
              avgPrice: ((updated[existing].avgPrice * updated[existing].quantity) + (holding.avgPrice * holding.quantity)) / (updated[existing].quantity + holding.quantity)
            };
            return { holdings: updated };
          }
          return { holdings: [...state.holdings, holding] };
        }),
      removeHolding: (symbol) =>
        set((state) => ({
          holdings: state.holdings.filter(h => h.symbol !== symbol),
        })),
      updateQuantity: (symbol, quantity) =>
        set((state) => ({
          holdings: state.holdings.map(h =>
            h.symbol === symbol ? { ...h, quantity } : h
          ),
        })),
      clearPortfolio: () => set({ holdings: [] }),
    }),
    {
      name: 'n314-portfolio',
    }
  )
);
