import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";

interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string | null;
  createdAt: string;
}

interface WarehouseDashboardStats {
  counts: {
    totalProducts?: number;
    totalVariants?: number;
    totalSuppliers?: number;
    totalCustomers?: number;
    totalPurchases?: number;
    totalSales?: number;
    totalUnits?: number;
  };
}

export function WarehouseManagement() {
  const { user: currentUser } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Warehouse | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [detailsWarehouse, setDetailsWarehouse] = useState<Warehouse | null>(null);
  const [detailsStats, setDetailsStats] = useState<WarehouseDashboardStats | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get("/warehouses");
      setWarehouses(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch warehouses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/warehouses", { name, code, location });
      setShowAddModal(false);
      setName(""); setCode(""); setLocation("");
      fetchWarehouses();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add warehouse");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteWarehouseModal = (warehouse: Warehouse) => {
    setDeleteCandidate(warehouse);
    setDeleteConfirmText("");
  };

  const handleDeleteWarehouse = async () => {
    if (!deleteCandidate) return;
    if (deleteConfirmText.trim().toUpperCase() !== deleteCandidate.code.toUpperCase()) return;
    setDeleteBusy(true);
    try {
      await api.delete(`/warehouses/${deleteCandidate.id}`);
      fetchWarehouses();
      setDeleteCandidate(null);
      setDeleteConfirmText("");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete warehouse");
    } finally {
      setDeleteBusy(false);
    }
  };

  const openDetailsModal = async (warehouse: Warehouse) => {
    setDetailsWarehouse(warehouse);
    setDetailsStats(null);
    setDetailsLoading(true);
    try {
      const [warehouseRes, statsRes] = await Promise.all([
        api.get(`/warehouses/${warehouse.id}`),
        api.get("/dashboard/stats", { params: { warehouseId: warehouse.id } })
      ]);
      const wh = warehouseRes.data?.data || warehouseRes.data;
      setDetailsWarehouse(wh || warehouse);
      setDetailsStats(statsRes.data || null);
    } catch (err) {
      console.error("Failed to load warehouse details", err);
      setDetailsWarehouse(warehouse);
    } finally {
      setDetailsLoading(false);
    }
  };

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="text-4xl mb-4">🚫</span>
        <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-500">Only administrators can manage warehouses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
          <p className="text-gray-500 text-sm">Create and manage your organization's physical locations.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 flex items-center justify-center gap-2"
        >
          <span>🏢</span> Add New Warehouse
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading warehouses...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map(wh => (
            <div key={wh.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                   <div className="bg-indigo-50 text-indigo-700 font-mono text-xs font-bold px-2 py-1 rounded-md">
                     {wh.code}
                   </div>
                   <button 
                    onClick={() => openDeleteWarehouseModal(wh)}
                     className="text-gray-300 hover:text-red-500 transition-colors"
                   >
                     <span className="text-lg">🗑️</span>
                   </button>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{wh.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                   <span>📍</span> {wh.location || "No location specified"}
                </p>
              </div>
              <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-50 flex items-center justify-between gap-2">
                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                   Added {new Date(wh.createdAt).toLocaleDateString()}
                 </span>
                 <button
                   onClick={() => openDetailsModal(wh)}
                   className="text-xs text-indigo-600 font-semibold hover:underline whitespace-nowrap"
                 >
                   View Details →
                 </button>
              </div>
            </div>
          ))}

          {warehouses.length === 0 && (
            <div className="col-span-full py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
              <p className="text-gray-400">No warehouses found. Start by adding one.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Warehouse Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Confirm Warehouse Deletion</h3>
              <p className="text-sm text-gray-500 mt-1">
                Type the warehouse code to confirm deletion.
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-3 overflow-y-auto">
              <p className="text-sm text-gray-700 break-words">
                Delete <b>{deleteCandidate.name}</b> (<span className="font-mono">{deleteCandidate.code}</span>)
              </p>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deleteCandidate.code}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setDeleteCandidate(null);
                    setDeleteConfirmText("");
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWarehouse}
                  disabled={deleteBusy || deleteConfirmText.trim().toUpperCase() !== deleteCandidate.code.toUpperCase()}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteBusy ? "Deleting..." : "Delete Warehouse"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Details Modal */}
      {detailsWarehouse && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-start gap-3 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words">{detailsWarehouse.name}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 break-all">
                  Code: <span className="font-mono">{detailsWarehouse.code}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setDetailsWarehouse(null);
                  setDetailsStats(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none min-w-8 min-h-8"
              >
                &times;
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
              {detailsLoading ? (
                <div className="py-10 text-center text-gray-400">Loading warehouse details...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Location</p>
                      <p className="mt-1 text-gray-800 break-words">{detailsWarehouse.location || "No location specified"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Created</p>
                      <p className="mt-1 text-gray-800">{new Date(detailsWarehouse.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {detailsStats?.counts && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Warehouse Summary</p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-blue-50 text-blue-700 rounded-xl p-3 border border-blue-100">
                          <p className="text-[10px] uppercase">Products</p>
                          <p className="text-lg font-bold">{detailsStats.counts.totalProducts ?? 0}</p>
                        </div>
                        <div className="bg-indigo-50 text-indigo-700 rounded-xl p-3 border border-indigo-100">
                          <p className="text-[10px] uppercase">Variants</p>
                          <p className="text-lg font-bold">{detailsStats.counts.totalVariants ?? 0}</p>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 rounded-xl p-3 border border-emerald-100">
                          <p className="text-[10px] uppercase">Units</p>
                          <p className="text-lg font-bold">{detailsStats.counts.totalUnits ?? 0}</p>
                        </div>
                        <div className="bg-violet-50 text-violet-700 rounded-xl p-3 border border-violet-100">
                          <p className="text-[10px] uppercase">Sales</p>
                          <p className="text-lg font-bold">{detailsStats.counts.totalSales ?? 0}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Warehouse Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white shrink-0">
              <h3 className="text-lg font-bold">New Warehouse</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddWarehouse} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Name</label>
                <input 
                  required 
                  placeholder="e.g. Dubai Main Hub"
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shortcut Code</label>
                <input 
                  required 
                  placeholder="e.g. DXB-1"
                  value={code} 
                  onChange={e => setCode(e.target.value.toUpperCase())} 
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Address</label>
                <textarea 
                  rows={2}
                  placeholder="Street, City, Country"
                  value={location} 
                  onChange={e => setLocation(e.target.value)} 
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button 
                disabled={submitting} 
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 mt-4 shadow-lg shadow-indigo-100"
              >
                {submitting ? "Creating..." : "Create Warehouse"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
