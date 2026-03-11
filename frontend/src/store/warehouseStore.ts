import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface WarehouseState {
  currentWarehouseId: string | 'all';
  warehouses: Warehouse[];
  setWarehouse: (id: string) => void;
  setWarehouses: (warehouses: Warehouse[]) => void;
  clearWarehouses: () => void;
}

export const useWarehouseStore = create<WarehouseState>()(
  persist(
    (set) => ({
      currentWarehouseId: 'all',
      warehouses: [],
      setWarehouse: (id) => set({ currentWarehouseId: id }),
      setWarehouses: (warehouses) => set({ warehouses }),
      clearWarehouses: () => set({ warehouses: [], currentWarehouseId: 'all' }),
    }),
    {
      name: 'wareflow-warehouse-storage',
    }
  )
);
