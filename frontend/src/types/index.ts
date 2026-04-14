export interface Product {
  id: string;
  name: string;
  sku?: string;
}

export interface Variant {
  id: string;
  sku: string;
  color: string;
  size?: string | null;
  product: Product;
}

export interface InventoryItem {
  id: string;
  variantId: string;
  quantity: number;
  updatedAt: string;
  variant: Variant;
  warehouse?: { id: string; name: string; code?: string | null } | null;
  supplier: { name: string; code?: string; phone?: string | null } | null;
  lastPurchase?: { id: string; invoice_number: string; created_at: string } | null;
  lastSale?: { id: string; invoice_number: string; created_at: string } | null;
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
