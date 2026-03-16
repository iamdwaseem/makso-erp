export type CashBankRow = {
  accountName: string;
  amount: string;
};

type CashBankTableProps = {
  rows: CashBankRow[];
  total: string;
  title?: string;
};

export default function CashBankTable({ rows, total, title = "CASH / CASH EQUIVALENTS" }: CashBankTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          {title}
        </h3>
        <span className="text-lg font-semibold tabular-nums text-gray-800">{total}</span>
      </div>
      <div className="overflow-hidden rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-2 text-left font-medium text-gray-600">Account Name</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.accountName}
                className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              >
                <td className="px-4 py-2.5 text-gray-800">{row.accountName}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-800">
                  {row.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
