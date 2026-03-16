export type RevaluationType = "Add Value" | "Subtract Value";

export type InventoryRevaluation = {
  id: number;
  date: string;
  type: RevaluationType;
  onAccount: string;
  notes: string;
};

export const inventoryRevaluationsMock: InventoryRevaluation[] = [
  { id: 1, date: "17/10/2021", type: "Add Value", onAccount: "Inventory Gain Account", notes: "" },
  { id: 2, date: "15/10/2021", type: "Subtract Value", onAccount: "Inventory Loss Account", notes: "Correction" },
];
