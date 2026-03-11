import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../api";

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchCustomers = () => api.get("/customers", { params: { limit: 1000 } }).then(r => setCustomers(r.data.data)).catch(console.error);
  useEffect(() => { fetchCustomers(); }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.post("/customers", data);
      reset(); setShowForm(false); fetchCustomers();
    } catch (err: any) { alert(err.response?.data?.error || err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500"><span className="font-semibold text-gray-900">{customers.length}</span> customers registered</p>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {showForm ? "Cancel" : "+ Add Customer"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input {...register("name", { required: true })} placeholder="Customer Name *" className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <input {...register("phone", { required: true })} placeholder="Phone *" className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <input {...register("email")} placeholder="Email" type="email" className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <input {...register("address")} placeholder="Address" className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium">Save Customer</button>
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
            {customers.map(c => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm font-medium text-gray-900">{c.name}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{c.phone}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{c.email || "—"}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{c.address || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
