import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Role } from '@somnob/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Somnob POS database seed...');

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin123!@#', saltRounds);
  const managerPasswordHash = await bcrypt.hash('Manager123!@#', saltRounds);
  const cashierPasswordHash = await bcrypt.hash('Cashier123!@#', saltRounds);
  const clerkPasswordHash = await bcrypt.hash('Clerk123!@#', saltRounds);

  const cashierPinHash = await bcrypt.hash('1234', saltRounds);
  const clerkPinHash = await bcrypt.hash('5678', saltRounds);

  // 1. Create Business
  const business = await prisma.business.create({
    data: {
      name: 'Somnob Retail Group',
      baseCurrency: 'USD',
    },
  });
  console.log(`🏢 Created Business: ${business.name} (${business.id})`);

  // 2. Create Stores
  const flagshipStore = await prisma.store.create({
    data: {
      businessId: business.id,
      name: 'BKK1 Flagship Store',
      code: 'STR-001',
      phone: '+855 23 888 999',
      address: 'Street 302, BKK1, Phnom Penh, Cambodia',
    },
  });

  const secondaryStore = await prisma.store.create({
    data: {
      businessId: business.id,
      name: 'Toul Kork Branch',
      code: 'STR-002',
      phone: '+855 23 777 666',
      address: 'Street 315, Toul Kork, Phnom Penh, Cambodia',
    },
  });
  console.log(`🏬 Created Stores: ${flagshipStore.name} & ${secondaryStore.name}`);

  // 3. Create Exchange Rates (1 USD = 4100 KHR)
  await prisma.storeExchangeRate.createMany({
    data: [
      {
        storeId: flagshipStore.id,
        fromCurrency: 'USD',
        toCurrency: 'KHR',
        rate: 4100.0,
      },
      {
        storeId: secondaryStore.id,
        fromCurrency: 'USD',
        toCurrency: 'KHR',
        rate: 4100.0,
      },
    ],
  });
  console.log('💱 Seeded store exchange rates ($1 = 4,100៛)');

  // 4. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      businessId: business.id,
      email: 'admin@somnob.com',
      passwordHash: adminPasswordHash,
      fullName: 'Panha Uong (Owner)',
      role: Role.SUPER_ADMIN,
    },
  });

  const branchManager = await prisma.user.create({
    data: {
      businessId: business.id,
      email: 'manager@somnob.com',
      passwordHash: managerPasswordHash,
      fullName: 'Dara Sok (BKK1 Manager)',
      role: Role.BRANCH_MANAGER,
    },
  });

  const cashier = await prisma.user.create({
    data: {
      businessId: business.id,
      email: 'cashier@somnob.com',
      passwordHash: cashierPasswordHash,
      fullName: 'Sophea Chan (Cashier)',
      role: Role.CASHIER,
      pinCodeHash: cashierPinHash,
    },
  });

  const stockClerk = await prisma.user.create({
    data: {
      businessId: business.id,
      email: 'clerk@somnob.com',
      passwordHash: clerkPasswordHash,
      fullName: 'Vireak Men (Inventory Clerk)',
      role: Role.STOCK_CLERK,
      pinCodeHash: clerkPinHash,
    },
  });
  console.log('👥 Seeded Users (Admin, Manager, Cashier, Stock Clerk)');

  // 5. Assign User Store Relationships
  await prisma.userStore.createMany({
    data: [
      { userId: superAdmin.id, storeId: flagshipStore.id, isDefault: true },
      { userId: superAdmin.id, storeId: secondaryStore.id, isDefault: false },
      { userId: branchManager.id, storeId: flagshipStore.id, isDefault: true },
      { userId: cashier.id, storeId: flagshipStore.id, isDefault: true },
      { userId: stockClerk.id, storeId: flagshipStore.id, isDefault: true },
    ],
  });

  // 6. Create Cash Register at Flagship Store
  const register = await prisma.cashRegister.create({
    data: {
      storeId: flagshipStore.id,
      name: 'Register 1 - Front Counter',
      code: 'REG-01',
    },
  });
  console.log(`🖥️ Created Cash Register: ${register.name} (${register.code})`);

  // 7. Seed Catalog Categories
  const beverageCategory = await prisma.category.create({
    data: {
      businessId: business.id,
      name: 'Beverages',
      slug: 'beverages',
      sortOrder: 1,
    },
  });

  const waterCategory = await prisma.category.create({
    data: {
      businessId: business.id,
      name: 'Water & Hydration',
      slug: 'water-hydration',
      parentId: beverageCategory.id,
      sortOrder: 2,
    },
  });

  const snackCategory = await prisma.category.create({
    data: {
      businessId: business.id,
      name: 'Snacks & Packaged Food',
      slug: 'snacks-packaged-food',
      sortOrder: 3,
    },
  });

  const apparelCategory = await prisma.category.create({
    data: {
      businessId: business.id,
      name: 'Apparel & Clothing',
      slug: 'apparel-clothing',
      sortOrder: 4,
    },
  });
  console.log('🏷️ Seeded Catalog Categories');

  // 8. Seed Products with Variants, Barcodes, Retail & Wholesale Pricing
  const cokeProduct = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: beverageCategory.id,
      name: 'Coca Cola Can',
      description: 'Refreshing carbonated soft drink 330ml',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
      hasVariants: false,
      variants: {
        create: [
          {
            variantName: '330ml Can',
            sku: 'COKE-330',
            barcode: '8850123456789',
            costPriceUsd: 0.4,
            sellingPriceUsd: 0.75,
            wholesalePriceUsd: 0.6,
            minWholesaleQty: 12,
            unitOfMeasure: 'CAN',
          },
        ],
      },
    },
    include: { variants: true },
  });

  const beerProduct = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: beverageCategory.id,
      name: 'Angkor Premium Beer',
      description: 'National beer of Cambodia 330ml can',
      imageUrl: 'https://images.unsplash.com/photo-1608270191763-7140f7d5c762?auto=format&fit=crop&w=400&q=80',
      hasVariants: false,
      variants: {
        create: [
          {
            variantName: '330ml Can',
            sku: 'BEER-330',
            barcode: '8850987654321',
            costPriceUsd: 0.8,
            sellingPriceUsd: 1.25,
            wholesalePriceUsd: 1.0,
            minWholesaleQty: 24,
            unitOfMeasure: 'CAN',
          },
        ],
      },
    },
    include: { variants: true },
  });

  const waterProduct = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: waterCategory.id,
      name: 'Vital Mineral Water 500ml Case',
      description: 'Purified mineral drinking water, case of 24 bottles',
      imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80',
      hasVariants: false,
      variants: {
        create: [
          {
            variantName: 'Case (24x 500ml)',
            sku: 'VITAL-500-CASE',
            barcode: '8850111222333',
            costPriceUsd: 2.8,
            sellingPriceUsd: 4.5,
            wholesalePriceUsd: 3.8,
            minWholesaleQty: 3,
            unitOfMeasure: 'CASE',
          },
        ],
      },
    },
    include: { variants: true },
  });

  const snackProduct = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: snackCategory.id,
      name: 'Lays Classic Potato Chips',
      description: 'Crispy salted potato chips 50g',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
      hasVariants: false,
      variants: {
        create: [
          {
            variantName: '50g Bag',
            sku: 'LAYS-50',
            barcode: '8850444555666',
            costPriceUsd: 0.6,
            sellingPriceUsd: 1.1,
            wholesalePriceUsd: 0.9,
            minWholesaleQty: 10,
            unitOfMeasure: 'BAG',
          },
        ],
      },
    },
    include: { variants: true },
  });

  // Clothing Product with Multiple Size Variants
  const tshirtProduct = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: apparelCategory.id,
      name: 'Angkor Heritage Graphic T-Shirt',
      description: '100% combed cotton streetwear t-shirt with Angkor temple artwork. Available in sizes S to XXL.',
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
      hasVariants: true,
      variants: {
        create: [
          {
            variantName: 'Black - Small (S)',
            sku: 'TSHIRT-BLK-S',
            barcode: '884900111002',
            size: 'S',
            color: 'Black',
            costPriceUsd: 4.5,
            sellingPriceUsd: 12.0,
            wholesalePriceUsd: 9.5,
            minWholesaleQty: 10,
            unitOfMeasure: 'PCS',
          },
          {
            variantName: 'Black - Medium (M)',
            sku: 'TSHIRT-BLK-M',
            barcode: '884900111003',
            size: 'M',
            color: 'Black',
            costPriceUsd: 4.5,
            sellingPriceUsd: 12.0,
            wholesalePriceUsd: 9.5,
            minWholesaleQty: 10,
            unitOfMeasure: 'PCS',
          },
          {
            variantName: 'Black - Large (L)',
            sku: 'TSHIRT-BLK-L',
            barcode: '884900111004',
            size: 'L',
            color: 'Black',
            costPriceUsd: 4.5,
            sellingPriceUsd: 12.0,
            wholesalePriceUsd: 9.5,
            minWholesaleQty: 10,
            unitOfMeasure: 'PCS',
          },
          {
            variantName: 'Black - Extra Large (XL)',
            sku: 'TSHIRT-BLK-XL',
            barcode: '884900111005',
            size: 'XL',
            color: 'Black',
            costPriceUsd: 5.0,
            sellingPriceUsd: 13.5,
            wholesalePriceUsd: 10.5,
            minWholesaleQty: 10,
            unitOfMeasure: 'PCS',
          },
          {
            variantName: 'Black - Double Extra Large (XXL)',
            sku: 'TSHIRT-BLK-XXL',
            barcode: '884900111006',
            size: 'XXL',
            color: 'Black',
            costPriceUsd: 5.5,
            sellingPriceUsd: 14.5,
            wholesalePriceUsd: 11.5,
            minWholesaleQty: 10,
            unitOfMeasure: 'PCS',
          },
        ],
      },
    },
    include: { variants: true },
  });

  const hoodieProduct = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: apparelCategory.id,
      name: 'Somnob Premium Fleece Hoodie',
      description: 'Heavyweight fleece pullover hoodie with front kangaroo pocket.',
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80',
      hasVariants: true,
      variants: {
        create: [
          {
            variantName: 'Grey - Small (S)',
            sku: 'HOODIE-GRY-S',
            barcode: '884900222001',
            size: 'S',
            color: 'Heather Grey',
            costPriceUsd: 12.0,
            sellingPriceUsd: 26.0,
            wholesalePriceUsd: 21.0,
            minWholesaleQty: 5,
            unitOfMeasure: 'PCS',
          },
          {
            variantName: 'Grey - Medium (M)',
            sku: 'HOODIE-GRY-M',
            barcode: '884900222002',
            size: 'M',
            color: 'Heather Grey',
            costPriceUsd: 12.0,
            sellingPriceUsd: 26.0,
            wholesalePriceUsd: 21.0,
            minWholesaleQty: 5,
            unitOfMeasure: 'PCS',
          },
          {
            variantName: 'Grey - Large (L)',
            sku: 'HOODIE-GRY-L',
            barcode: '884900222003',
            size: 'L',
            color: 'Heather Grey',
            costPriceUsd: 12.0,
            sellingPriceUsd: 26.0,
            wholesalePriceUsd: 21.0,
            minWholesaleQty: 5,
            unitOfMeasure: 'PCS',
          },
          {
            variantName: 'Grey - Extra Large (XL)',
            sku: 'HOODIE-GRY-XL',
            barcode: '884900222004',
            size: 'XL',
            color: 'Heather Grey',
            costPriceUsd: 13.0,
            sellingPriceUsd: 28.0,
            wholesalePriceUsd: 22.5,
            minWholesaleQty: 5,
            unitOfMeasure: 'PCS',
          },
        ],
      },
    },
    include: { variants: true },
  });

  // 9. Initialize Initial Stock for Flagship Store
  const allVariants = [
    ...cokeProduct.variants,
    ...beerProduct.variants,
    ...waterProduct.variants,
    ...snackProduct.variants,
    ...tshirtProduct.variants,
    ...hoodieProduct.variants,
  ];

  for (const variant of allVariants) {
    await prisma.inventoryBalance.create({
      data: {
        storeId: flagshipStore.id,
        variantId: variant.id,
        quantityOnHand: 100, // Starting stock for quick demo
        quantityReserved: 0,
        reorderPoint: 10,
      },
    });
  }
  console.log('📦 Seeded Products, Barcodes, Pricing, and Starting Stock');

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
