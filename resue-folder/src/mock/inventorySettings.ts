// Item Groups
export type ItemGroup = { id: number; name: string; parentGroup?: string; unit?: string };
export const itemGroupsMock: ItemGroup[] = [
  { id: 1, name: "Stationery", unit: "PCS" },
  { id: 2, name: "Furniture", unit: "NO" },
  { id: 3, name: "Electronics", parentGroup: "Assets", unit: "PCS" },
  { id: 4, name: "Consumables", unit: "Box" },
];

// Units
export type Unit = { id: number; name: string; shortForm: string; decimalPlaces: number; baseUnit?: string; multiplier?: number };
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

// Variants
export type Variant = { id: number; name: string; values: string };
export const variantsMock: Variant[] = [
  { id: 1, name: "Size", values: "S, M, L, XL" },
  { id: 2, name: "Color", values: "Red, Blue, Black" },
];

// Item Unit Conversion
export type ItemUnitConversion = { id: number; item: string; fromUnit: string; toUnit: string; multiplier: number };
export const itemUnitConversionsMock: ItemUnitConversion[] = [
  { id: 1, item: "A4 Paper", fromUnit: "Ream", toUnit: "Sheet", multiplier: 500 },
];

// Opening Inventory
export type OpeningInventory = { id: number; item: string; center: string; unit: string; quantity: number; value: number };
export const openingInventoryMock: OpeningInventory[] = [
  { id: 1, item: "Office Chair", center: "Tirur", unit: "PCS", quantity: 10, value: 25000 },
  { id: 2, item: "A4 Paper", center: "warehouse", unit: "Ream", quantity: 50, value: 4500 },
];

// Aisle / Rack / Shelves / Bins (simplified as Warehouse Locations)
export type WarehouseLocation = { id: number; type: "Aisle" | "Rack" | "Shelf" | "Bin"; name: string; parent?: string; center?: string };
export const warehouseLocationsMock: WarehouseLocation[] = [
  { id: 1, type: "Aisle", name: "A-01", center: "Tirur" },
  { id: 2, type: "Rack", name: "R-01", parent: "A-01" },
  { id: 3, type: "Shelf", name: "S-01", parent: "R-01" },
  { id: 4, type: "Bin", name: "B-01", parent: "S-01" },
];
