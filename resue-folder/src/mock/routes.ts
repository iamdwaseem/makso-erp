export type RouteStatus = "Active" | "Inactive";

export type Route = {
  id: number;
  routeName: string;
  description: string | null;
  status: RouteStatus;
};

export const routesMock: Route[] = [
  { id: 1, routeName: "North Route", description: "Northern delivery route", status: "Active" },
  { id: 2, routeName: "South Route", description: "Southern sales route", status: "Active" },
  { id: 3, routeName: "Central", description: null, status: "Inactive" },
];
