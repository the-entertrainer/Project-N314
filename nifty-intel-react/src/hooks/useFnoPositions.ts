import { useStockStore } from '@/store/stockStore';
import type { FnoPosition } from '@/types';

export function useFnoPositions() {
  const positions = useStockStore((state) => state.fnoPositions);
  const addPosition = useStockStore((state) => state.addPosition);
  const removePosition = useStockStore((state) => state.removePosition);

  return {
    positions,
    addPosition: (pos: Omit<FnoPosition, 'id'>) => addPosition(pos),
    removePosition,
  };
}
