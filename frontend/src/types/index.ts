export interface Product {
  id: string;
  name: string;
}

export interface Variant {
  id: string;
  sku: string;
  color: string;
  product: Product;
}

export interface InventoryItem {
  id: string;
  variantId: string;
  quantity: number;
  updatedAt: string;
  variant: Variant;
  supplier: { name: string; phone: string } | null;
}

export interface LedgerEntry {
  id: string;
  action: "IN" | "OUT";
  quantity: number;
  referenceType: string;
  referenceId: string;
  createdAt: string;
}

export interface DashboardStats {
  counts: {
    totalProducts: number;
    totalVariants: number;
    totalSuppliers: number;
    totalCustomers: number;
    totalPurchases: number;
    totalSales: number;
    totalUnits: number;
  };
  lowStock: any[];
  topStocked: any[];
  recentActivity: any[];
}
