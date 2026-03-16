export type CenterType = {
  id: number;
  name: string;
  description: string | null;
};

export const centerTypesMock: CenterType[] = [
  { id: 1, name: "Warehouse", description: "Storage and distribution" },
  { id: 2, name: "Head Office", description: "Corporate headquarters" },
  { id: 3, name: "Branch", description: "Regional branch office" },
  { id: 4, name: "Vehicle", description: "Mobile sales or delivery" },
];
