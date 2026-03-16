// Item Groups / Categories
export type ItemGroup = { id: number; name: string; parentGroup?: string; unit?: string };
export const itemGroupsMock: ItemGroup[] = [
  { id: 1, name: "Stationery", unit: "PCS" },
  { id: 2, name: "Furniture", unit: "NO" },
  { id: 3, name: "Electronics", parentGroup: "Assets", unit: "PCS" },
  { id: 4, name: "Consumables", unit: "Box" },
];

// Units
export type Unit = {
  id: number;
  name: string;
  shortForm: string;
  decimalPlaces: number;
  baseUnit?: string;
  multiplier?: number;
};
export const unitsMock: Unit[] = [
  { id: 1, name: "Piece", shortForm: "PCS", decimalPlaces: 0 },
  { id: 2, name: "Number", shortForm: "NO", decimalPlaces: 0 },
  { id: 3, name: "Box", shortForm: "Box", decimalPlaces: 0 },
  { id: 4, name: "Kilogram", shortForm: "KG", decimalPlaces: 2 },
  { id: 5, name: "Dozen", shortForm: "DZ", decimalPlaces: 0, baseUnit: "Piece", multiplier: 12 },
];

// Brands
export type Brand = { id: number; name: string; code?: string };
export const brandsMock: Brand[] = [
  { id: 1, name: "Dell", code: "DEL" },
  { id: 2, name: "HP", code: "HP" },
  { id: 3, name: "Generic", code: "GEN" },
];
