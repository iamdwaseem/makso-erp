import { useEffect, useState } from "react";
import api from "../api";
import { useWarehouseStore } from "../store/warehouseStore";

export function Sales() {
  const [sales, setSales] = useState<any[]>([]);
  const currentWarehouseId = useWarehouseStore(state => state.currentWarehouseId);

  useEffect(() => {
    api.get("/sales").then(r => setSales(r.data.data)).catch(console.error);
  }, [currentWarehouseId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Sales History</h3>
          <p className="text-xs text-gray-400 mt-0.5">Sales are recorded from the Scan Station at checkout</p>
        </div>
        <p className="text-sm text-gray-500"><span className="font-semibold text-gray-900">{sales.length}</span> sales</p>
      </div>

      {sales.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
          No sales yet. Go to Scan Station to checkout items.
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map(s => {
            const totalUnits = s.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
            return (
              <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-orange-600 text-lg">📤</span>
                        <p className="text-sm font-semibold text-gray-900">Sold to <span className="text-green-700">{s.customer?.name || "Unknown"}</span></p>
                      </div>
                      {s.customer?.phone && <p className="text-xs text-gray-400 ml-7">📞 {s.customer.phone}</p>}
                      <p className="text-xs text-gray-400 ml-7 mt-0.5">{new Date(s.sale_date || s.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      {s.invoice_number && <p className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-mono">{s.invoice_number}</p>}
                      <p className="text-xs text-gray-500 mt-1"><span className="font-bold text-orange-600">-{totalUnits} units</span></p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50/50">
                  {s.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span className="text-gray-700">{item.variant?.product?.name} · {item.variant?.color} <span className="text-gray-400 font-mono text-xs">({item.variant?.sku})</span></span>
                      <span className="font-bold text-orange-600">-{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
