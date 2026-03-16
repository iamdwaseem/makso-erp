export type WorkOrderStatus = "Open" | "In Progress" | "Completed" | "Closed";

export type WorkOrder = {
  id: number;
  workOrderNo: string;
  date: string;
  jobDescription: string;
  assignedEmployee: string;
  itemsProvided: string;
  status: WorkOrderStatus;
  remarks: string;
};

export const workOrdersMock: WorkOrder[] = [
  { id: 1, workOrderNo: "WO001", date: "15 Mar 2025", jobDescription: "Office supplies restock", assignedEmployee: "Mohammed Hussen", itemsProvided: "Stationery set", status: "Completed", remarks: "" },
  { id: 2, workOrderNo: "WO002", date: "14 Mar 2025", jobDescription: "Warehouse audit", assignedEmployee: "John", itemsProvided: "Clipboard, forms", status: "In Progress", remarks: "" },
  { id: 3, workOrderNo: "WO003", date: "13 Mar 2025", jobDescription: "Equipment maintenance", assignedEmployee: "Rahul", itemsProvided: "Tools kit", status: "Open", remarks: "Pending approval" },
  { id: 4, workOrderNo: "WO004", date: "10 Mar 2025", jobDescription: "Inventory count", assignedEmployee: "Ali", itemsProvided: "Scanner", status: "Closed", remarks: "" },
];
