import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function buildSummaries() {
    console.log("Disabling RLS temporarily...");
    const tables = [
      "inventory_summaries", "dashboard_metrics", "inventory"
    ];

    for (const table of tables) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" NO FORCE ROW LEVEL SECURITY;`);
    }

    console.log("Building inventory summaries...");
    await prisma.$executeRawUnsafe(`
        INSERT INTO inventory_summaries (id, organization_id, warehouse_id, variant_id, total_quantity, reserved_quantity, updated_at)
        SELECT gen_random_uuid(), organization_id, warehouse_id, variant_id, quantity, 0, NOW() 
        FROM inventory
        ON CONFLICT DO NOTHING
    `);
    console.log("Inventory summaries built.");

    console.log("Re-enabling RLS...");
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`);
    }

    console.log("Done.");
}

buildSummaries().finally(() => prisma.$disconnect());
