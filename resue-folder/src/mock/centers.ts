export type CenterStatus = "Active" | "Inactive";

export type Center = {
  id: number;
  centerName: string;
  centerType: string;
  address: string | null;
  locationId: number;
  locationName: string;
  status: CenterStatus;
};

export const centersMock: Center[] = [
  { id: 1, centerName: "Main Warehouse", centerType: "Warehouse", address: "Port Saeed, Dubai", locationId: 1, locationName: "Dubai HQ", status: "Active" },
  { id: 2, centerName: "Tirur Branch", centerType: "Branch", address: "Tirur, Kerala", locationId: 1, locationName: "Dubai HQ", status: "Active" },
  { id: 3, centerName: "Kochi Office", centerType: "Head Office", address: "MG Road, Kochi", locationId: 2, locationName: "Abu Dhabi Branch", status: "Active" },
];
