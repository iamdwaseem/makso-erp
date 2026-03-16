export type LocationStatus = "Active" | "Inactive";

export type Location = {
  id: number;
  locationName: string;
  locationType: string;
  description: string | null;
  status: LocationStatus;
};

export const locationsMock: Location[] = [
  { id: 1, locationName: "Dubai HQ", locationType: "Head Office", description: "Main headquarters", status: "Active" },
  { id: 2, locationName: "Abu Dhabi Branch", locationType: "Branch", description: "Northern region", status: "Active" },
  { id: 3, locationName: "Sharjah Warehouse", locationType: "Warehouse", description: null, status: "Active" },
];
