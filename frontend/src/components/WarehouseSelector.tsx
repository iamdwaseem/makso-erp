import { useEffect } from 'react';
import api from '../api';
import { useWarehouseStore } from '../store/warehouseStore';

export function WarehouseSelector({ dark }: { dark?: boolean } = {}) {
  const { currentWarehouseId, warehouses, setWarehouse, setWarehouses } = useWarehouseStore();

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await api.get('/warehouses');
        // Handle paginated response if applicable, though warehouses usually fit on one page
        const data = response.data.data || response.data;
        setWarehouses(data);
      } catch (error) {
        console.error('Failed to fetch warehouses:', error);
      }
    };

    fetchWarehouses();
  }, [setWarehouses]);

  const selectCls = dark
    ? "rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 max-w-[140px] sm:max-w-[240px] [color-scheme:dark] focus:outline-none"
    : "block max-w-[140px] sm:max-w-[240px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-gray-50";
  const labelCls = dark ? "hidden sm:block text-xs font-semibold text-white uppercase tracking-wider" : "hidden sm:block text-xs font-semibold text-gray-600 uppercase tracking-wider";

  return (
    <div className="flex items-center gap-2 min-w-0">
      <label htmlFor="warehouse-select" className={labelCls}>
        Warehouse
      </label>
      <select
        id="warehouse-select"
        value={currentWarehouseId}
        onChange={(e) => setWarehouse(e.target.value)}
        className={selectCls}
      >
        <option value="all">All Warehouses</option>
        {warehouses.map((warehouse) => (
          <option key={warehouse.id} value={warehouse.id}>
            {warehouse.name} ({warehouse.code})
          </option>
        ))}
      </select>
    </div>
  );
}
