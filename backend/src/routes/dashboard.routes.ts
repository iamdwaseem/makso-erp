import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/dashboard/stats", async (req, res) => {
  try {
    const [
      totalProducts,
      totalVariants,
      totalSuppliers,
      totalCustomers,
      totalPurchases,
      totalSales,
      inventoryRecords,
      recentLedger,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.variant.count(),
      prisma.supplier.count(),
      prisma.customer.count(),
      prisma.purchase.count(),
      prisma.sale.count(),
      prisma.inventory.findMany({
        include: { variant: { include: { product: true } } },
        orderBy: { quantity: "asc" },
      }),
      prisma.inventoryLedger.findMany({
        include: { variant: { include: { product: true } } },
        orderBy: { created_at: "desc" },
        take: 15,
      }),
    ]);

    const totalUnits = inventoryRecords.reduce((sum, i) => sum + i.quantity, 0);
    const lowStock = inventoryRecords.filter((i) => i.quantity < 10);

    res.json({
      counts: { totalProducts, totalVariants, totalSuppliers, totalCustomers, totalPurchases, totalSales, totalUnits },
      lowStock,
      recentActivity: recentLedger,
      inventory: inventoryRecords,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
