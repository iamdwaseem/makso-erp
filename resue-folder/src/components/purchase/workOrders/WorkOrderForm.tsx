"use client";

import { useState } from "react";
import type { WorkOrderStatus } from "@/mock/workOrders";

type WorkOrderFormProps = {
  onSave: () => void;
  onCancel: () => void;
};

const STATUS_OPTIONS: WorkOrderStatus[] = ["Open", "In Progress", "Completed", "Closed"];

export default function WorkOrderForm({ onSave, onCancel }: WorkOrderFormProps) {
  const [workOrderNo, setWorkOrderNo] = useState("");
  const [date, setDate] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [assignedEmployee, setAssignedEmployee] = useState("");
  const [itemsProvided, setItemsProvided] = useState("");
  const [status, setStatus] = useState<WorkOrderStatus>("Open");
  const [remarks, setRemarks] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">Work Order No</label>
          <input
            type="text"
            value={workOrderNo}
            onChange={(e) => setWorkOrderNo(e.target.value)}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">Date</label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">Job Description</label>
          <input
            type="text"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">Assigned Employee</label>
          <input
            type="text"
            value={assignedEmployee}
            onChange={(e) => setAssignedEmployee(e.target.value)}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">Items Provided</label>
          <input
            type="text"
            value={itemsProvided}
            onChange={(e) => setItemsProvided(e.target.value)}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as WorkOrderStatus)}
            className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <button type="button" onClick={onCancel} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Save
        </button>
      </div>
    </form>
  );
}
