import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../api";

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchSuppliers = () => api.get("/suppliers").then(r => setSuppliers(r.data)).catch(console.error);
  useEffect(() => { fetchSuppliers(); }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.post("/suppliers", data);
      reset(); setShowForm(false); fetchSuppliers();
    } catch (err: any) { alert(err.response?.data?.error || err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500"><span className="font-semibold text-gray-900">{suppliers.length}</span> suppliers registered</p>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {showForm ? "Cancel" : "+ Add Supplier"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input {...register("name", { required: true })} placeholder="Supplier Name *" className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <input {...register("phone", { required: true })} placeholder="Phone *" className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <input {...register("email")} placeholder="Email" type="email" className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <input {...register("address")} placeholder="Address" className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium">Save Supplier</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Address</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm font-medium text-gray-900">{s.name}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{s.phone}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{s.email || "—"}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{s.address || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
