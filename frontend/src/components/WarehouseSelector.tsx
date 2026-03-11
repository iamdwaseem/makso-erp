import { useEffect } from 'react';
import api from '../api';
import { useWarehouseStore } from '../store/warehouseStore';

export function WarehouseSelector() {
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

  return (
    <div className="flex items-center gap-2 min-w-0">
      <label htmlFor="warehouse-select" className="hidden sm:block text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Warehouse
      </label>
      <select
        id="warehouse-select"
        value={currentWarehouseId}
        onChange={(e) => setWarehouse(e.target.value)}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-xs sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5 max-w-[140px] sm:max-w-[240px] transition-all hover:bg-white"
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
