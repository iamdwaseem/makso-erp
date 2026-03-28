import { PrismaClient } from "@prisma/client";
import { getTenantContext } from "./context.js";

const basePrisma = new PrismaClient({
  // Query logging is opt-in to avoid noisy terminal output under load.
  log: process.env.PRISMA_QUERY_LOG === "true" ? ["query", "error", "warn"] : ["error", "warn"],
});

/** Unextended client — use for interactive transactions that already manage RLS + must not nest via $extends query middleware. */
export const prismaBase = basePrisma;

/**
 * Prisma Client extended with PostgreSQL Row-Level Security support.
 * 
 * For every query, it checks the AsyncLocalStorage for an organizationId.
 * If found, it executes 'SET LOCAL app.organization_id' within a transaction
 * to ensure the RLS policies are applied correctly for that specific request.
 */
const RLS_APPLIED = Symbol('RLS_APPLIED');

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const context = getTenantContext();
        if (!context?.organizationId) return query(args);

        const client = this as any;
        if (client[RLS_APPLIED]) return query(args);

        return basePrisma.$transaction(async (tx: any) => {
          tx[RLS_APPLIED] = true;
          await tx.$executeRawUnsafe(`SET LOCAL app.organization_id = '${context.organizationId}'`);
          await tx.$executeRawUnsafe(`SET LOCAL app.allowed_warehouse_ids = '${context.allowedWarehouseIds?.join(",") || ""}'`);
          
          const modelName = model[0].toLowerCase() + model.slice(1);
          if (tx[modelName] && tx[modelName][operation]) {
            return tx[modelName][operation](args);
          }
          return query(args);
        });
      },
    },
    // Raw query handlers
    $queryRaw: async ({ args, query }) => {
      const context = getTenantContext();
      if (!context?.organizationId) return query(args);
      return basePrisma.$transaction(async (tx: any) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.organization_id = '${context.organizationId}'`);
        await tx.$executeRawUnsafe(`SET LOCAL app.allowed_warehouse_ids = '${context.allowedWarehouseIds?.join(",") || ""}'`);
        return tx.$queryRaw(args);
      });
    },
    $executeRaw: async ({ args, query }) => {
      const context = getTenantContext();
      if (!context?.organizationId) return query(args);
      return basePrisma.$transaction(async (tx: any) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.organization_id = '${context.organizationId}'`);
        await tx.$executeRawUnsafe(`SET LOCAL app.allowed_warehouse_ids = '${context.allowedWarehouseIds?.join(",") || ""}'`);
        return tx.$executeRaw(args);
      });
    }
  },
});

export default prisma;
