"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";

const glassInput =
  "rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/20 focus:border-white/25";

export function WarehouseSelector() {
  const { warehouseId, setWarehouseId } = useGlobalFilter();
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    api
      .getWarehouses({ limit: 100 })
      .then((list) => {
        setWarehouses(list);
        // If current selection is not "all" and not in the list (e.g. stale after reseed), reset to "all"
        if (warehouseId && warehouseId !== "all") {
          const ids = list.map((w) => w.id);
          if (!ids.includes(warehouseId)) setWarehouseId("all");
        }
      })
      .catch(() => setWarehouses([]));
  }, [warehouseId, setWarehouseId]);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <label htmlFor="warehouse-select" className="hidden text-xs font-semibold uppercase tracking-wider text-white/60 sm:block">
        Warehouse
      </label>
      <select
        id="warehouse-select"
        value={warehouseId}
        onChange={(e) => setWarehouseId(e.target.value)}
        className={`max-w-[140px] sm:max-w-[200px] ${glassInput} bg-white/10 transition-colors hover:bg-white/15`}
      >
        <option value="all">All</option>
        {warehouses.map((w) => (
          <option key={w.id} value={w.id} className="bg-gray-900 text-white">
            {w.name}
          </option>
        ))}
      </select>
    </div>
  );
}
