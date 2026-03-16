"use client";

import { useMemo, useState } from "react";
import WorkOrderTable from "@/components/purchase/workOrders/WorkOrderTable";
import WorkOrderFilters from "@/components/purchase/workOrders/WorkOrderFilters";
import WorkOrderForm from "@/components/purchase/workOrders/WorkOrderForm";
import { workOrdersMock } from "@/mock/workOrders";

type ViewMode = "list" | "form";

export default function WorkOrdersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [dateRange, setDateRange] = useState("");
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("all");
  const [workOrderNo, setWorkOrderNo] = useState("");

  const filtered = useMemo(() => {
    let list = workOrdersMock;
    if (status !== "all") list = list.filter((o) => o.status === status);
    if (workOrderNo) list = list.filter((o) => o.workOrderNo.toLowerCase().includes(workOrderNo.toLowerCase()));
    if (employee) list = list.filter((o) => o.assignedEmployee.toLowerCase().includes(employee.toLowerCase()));
    return list;
  }, [status, workOrderNo, employee]);

  return (
    <div className="p-6">
      {viewMode === "list" && (
        <>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">WORK ORDERS</h1>
              <WorkOrderFilters
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                employee={employee}
                onEmployeeChange={setEmployee}
                status={status}
                onStatusChange={setStatus}
                workOrderNo={workOrderNo}
                onWorkOrderNoChange={setWorkOrderNo}
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setViewMode("form")} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                NEW
              </button>
              <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                EXPORT
              </button>
            </div>
          </div>
          <WorkOrderTable orders={filtered} onView={() => {}} />
        </>
      )}
      {viewMode === "form" && (
        <>
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">NEW WORK ORDER</h1>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <WorkOrderForm onSave={() => setViewMode("list")} onCancel={() => setViewMode("list")} />
          </div>
        </>
      )}
    </div>
  );
}
