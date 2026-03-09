import { PrismaClient } from '@prisma/client';
import { PurchaseRepository } from '../src/repositories/purchase.repository.js';
import { SaleRepository } from '../src/repositories/sale.repository.js';
import { ScanRepository } from '../src/repositories/scan.repository.js';

const prisma = new PrismaClient();
const purchaseRepo = new PurchaseRepository();
const saleRepo = new SaleRepository();
const scanRepo = new ScanRepository();

async function main() {
  console.log('Clearing database...');
  await prisma.scanLog.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.inventoryLedger.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();

  console.log('Seeding data...');

  // 1. Create Suppliers
  const supplier1 = await prisma.supplier.create({
    data: { name: 'Acme Electronics', phone: '+1-555-0100', email: 'sales@acme.com', address: '123 Tech Lane' }
  });
  const supplier2 = await prisma.supplier.create({
    data: { name: 'Globex Corp', phone: '+1-555-0101', email: 'supply@globex.com' }
  });
  const supplier3 = await prisma.supplier.create({
    data: { name: 'SuperSupplies Co', phone: '+1-555-0102', email: 'orders@supersupplies.io' }
  });

  // 2. Create Customers
  const customer1 = await prisma.customer.create({
    data: { name: 'Bob Roberts', phone: '+1-555-0200', address: '456 Main St' }
  });
  const customer2 = await prisma.customer.create({
    data: { name: 'Alice Smith', phone: '+1-555-0201', email: 'alice@example.com' }
  });
  const customer3 = await prisma.customer.create({
    data: { name: 'Charlie Dean', phone: '+1-555-0202' }
  });

  // 3. Create Products and Variants
  const product1 = await prisma.product.create({
    data: {
      name: 'Wireless Mouse',
      sku: 'WM-001',
      description: 'Ergonomic wireless mouse',
      variants: {
        create: [
          { color: 'Black', sku: 'WM-001-BLK' },
          { color: 'White', sku: 'WM-001-WHT' }
        ]
      }
    },
    include: { variants: true }
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Mechanical Keyboard',
      sku: 'MK-002',
      description: 'RGB Mechanical keyboard with blue switches',
      variants: {
        create: [
          { color: 'Black', sku: 'MK-002-BLK' },
          { color: 'Grey', sku: 'MK-002-GRY' }
        ]
      }
    },
    include: { variants: true }
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Curved Monitor',
      sku: 'CM-003',
      description: '32-inch 4K Curved Monitor',
      variants: {
        create: [
          { color: 'Midnight Black', sku: 'CM-003-MB' }
        ]
      }
    },
    include: { variants: true }
  });

  console.log('Base records created.');

  // 4. Create Purchases (Auto-generates INVOICE numbers)
  await purchaseRepo.createPurchase({
    supplier_id: supplier1.id,
    items: [
      { variant_id: product1.variants[0].id, quantity: 150 }, // Black Mouse
      { variant_id: product1.variants[1].id, quantity: 50 },  // White Mouse
    ]
  });

  await purchaseRepo.createPurchase({
    supplier_id: supplier2.id,
    items: [
      { variant_id: product2.variants[0].id, quantity: 200 }, // Black Keyboard
    ]
  });

  await purchaseRepo.createPurchase({
    supplier_id: supplier3.id,
    items: [
      { variant_id: product3.variants[0].id, quantity: 30 }, // Monitor
      { variant_id: product2.variants[1].id, quantity: 45 }, // Grey Keyboard
    ]
  });

  console.log('Purchases recorded. Inventory stocked.');

  // 5. Create Sales (Auto-generates INVOICE numbers)
  await saleRepo.createSale({
    customer_id: customer1.id,
    items: [
      { variant_id: product1.variants[0].id, quantity: 5 },
      { variant_id: product2.variants[0].id, quantity: 2 },
    ]
  });

  await saleRepo.createSale({
    customer_id: customer2.id,
    items: [
      { variant_id: product3.variants[0].id, quantity: 1 },
    ]
  });

  await saleRepo.createSale({
    customer_id: customer3.id,
    items: [
      { variant_id: product1.variants[1].id, quantity: 10 },
    ]
  });

  console.log('Sales recorded. Inventory updated.');

  console.log('Seeding complete! Dashboard is ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
