import prisma from "../lib/prisma.js";
import { getEnv } from "../config/env.js";

/**
 * Service to validate consistency between the main inventory table 
 * and the pre-calculated inventory summaries.
 */
export class ValidationService {
  private shouldLog = getEnv().HTTP_LOGS === "true";
  /**
   * Performs a consistency check for a specific organization or all if null.
   * Compares SUM(inventory.quantity) vs inventory_summary.total_quantity
   */
  async validateInventoryConsistency(organizationId?: string) {
    if (this.shouldLog) {
      console.log(`[Validation] Starting inventory consistency check... ${organizationId || "All Organizations"}`);
    }
    
    // In a real high-scale system, we'd do this in batches or using a database query that finds mismatches.
    const mismatches = await (prisma as any).$queryRaw`
      SELECT 
        i.organization_id, 
        i.warehouse_id, 
        i.variant_id, 
        i.quantity as inventory_qty, 
        s.total_quantity as summary_qty
      FROM inventory i
      JOIN inventory_summaries s ON 
        i.organization_id = s.organization_id AND 
        i.warehouse_id = s.warehouse_id AND 
        i.variant_id = s.variant_id
      WHERE i.quantity != s.total_quantity
      ${organizationId ? (prisma as any).sql`AND i.organization_id = ${organizationId}` : (prisma as any).empty}
    `;

    if (mismatches.length > 0) {
      if (this.shouldLog) {
        console.error(`[Validation] Found ${mismatches.length} mismatches!`);
      }
      // Auto-fix if needed or just log
      for (const mismatch of mismatches) {
        if (this.shouldLog) {
          console.warn(`Mismatch in Org ${mismatch.organization_id}, Wh ${mismatch.warehouse_id}, Var ${mismatch.variant_id}: Inv ${mismatch.inventory_qty} != Sum ${mismatch.summary_qty}`);
        }
        
        // FIX: Update summary to match inventory
        await (prisma as any).inventorySummary.update({
          where: {
            organization_id_warehouse_id_variant_id: {
              organization_id: mismatch.organization_id,
              warehouse_id: mismatch.warehouse_id,
              variant_id: mismatch.variant_id
            }
          },
          data: { total_quantity: mismatch.inventory_qty }
        });
      }
      if (this.shouldLog) {
        console.log(`[Validation] Fixed ${mismatches.length} mismatches.`);
      }
    } else if (this.shouldLog) {
      console.log("[Validation] All inventory summaries are consistent.");
    }

    return mismatches;
  }
}
