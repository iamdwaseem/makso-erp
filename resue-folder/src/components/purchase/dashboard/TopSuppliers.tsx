type SupplierRow = { name: string; amount: number; count: number };

type TopSuppliersProps = {
  data: SupplierRow[];
  title?: string;
};

export default function TopSuppliers({ data, title = "TOP SUPPLIERS" }: TopSuppliersProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
        {title}
      </h3>
      <div className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
              <th className="pb-2 pr-4">Supplier</th>
              <th className="pb-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.name} className="border-b border-gray-100">
                <td className="py-2.5 pr-4 text-gray-800">{row.name}</td>
                <td className="py-2.5 text-right tabular-nums text-gray-800">
                  {row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ({row.count})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
