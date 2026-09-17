import type {
  ProductRecipe,
  SmartComponent,
  SubProduct,
  Vendor,
  VendorProduct,
} from './types'

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'v1',
    code: 'METRO',
    name: 'Metro Foodservice Distribution',
    contactEmail: 'orders@metrofoods.com',
    contactPhone: '+60 3-7890 1234',
    deliveryTerms: 'Net 30, Mon/Wed/Fri Delivery',
  },
  {
    id: 'v2',
    code: 'APEX',
    name: 'Apex Farm Direct Produce',
    contactEmail: 'sales@apexfarm.com',
    contactPhone: '+60 3-5521 8890',
    deliveryTerms: 'COD / Next Day Morning',
  },
  {
    id: 'v3',
    code: 'ROMA',
    name: 'Roma Imports & Dairy Supply',
    contactEmail: 'supply@romaimports.com',
    contactPhone: '+60 3-2144 6789',
    deliveryTerms: 'Weekly Tuesday Drop',
  },
]

export const MOCK_VENDOR_PRODUCTS: VendorProduct[] = [
  {
    id: 'vp1',
    vendorId: 'v2',
    code: 'APX-BASIL-01',
    name: 'Fresh Genovese Basil Leaves',
    priceCents: 4500, // RM 45.00 per crate
    packaging: {
      deliveryUnit1: 'Crate',
      deliveryQty2: 5,
      deliveryUnit2: 'Bag',
      deliveryQty3: 1000,
      deliveryUnit3: 'g',
    },
  },
  {
    id: 'vp1_alt',
    vendorId: 'v1',
    code: 'MET-BASIL-02',
    name: 'Metro Hydroponic Basil Crate',
    priceCents: 5400, // RM 54.00 per crate
    packaging: {
      deliveryUnit1: 'Crate',
      deliveryQty2: 5,
      deliveryUnit2: 'Bag',
      deliveryQty3: 1000,
      deliveryUnit3: 'g',
    },
  },
  {
    id: 'vp2',
    vendorId: 'v3',
    code: 'ROM-EVOO-05',
    name: 'Extra Virgin Olive Oil Cold Pressed',
    priceCents: 16000, // RM 160.00 per carton of 4 tins
    packaging: {
      deliveryUnit1: 'Carton',
      deliveryQty2: 4,
      deliveryUnit2: 'Tin',
      deliveryQty3: 5000,
      deliveryUnit3: 'ml',
    },
  },
  {
    id: 'vp3',
    vendorId: 'v2',
    code: 'APX-TOM-10',
    name: 'Vine-Ripened Roma Tomatoes',
    priceCents: 3600, // RM 36.00 per 10kg box
    packaging: {
      deliveryUnit1: 'Box',
      deliveryQty2: 10,
      deliveryUnit2: 'kg',
      deliveryQty3: 1000,
      deliveryUnit3: 'g',
    },
  },
  {
    id: 'vp4',
    vendorId: 'v3',
    code: 'ROM-MOZZ-BLOCK',
    name: 'Low Moisture Whole Milk Mozzarella',
    priceCents: 12000, // RM 120.00 per case of 4 blocks
    packaging: {
      deliveryUnit1: 'Case',
      deliveryQty2: 4,
      deliveryUnit2: 'Block',
      deliveryQty3: 2500,
      deliveryUnit3: 'g',
    },
  },
  {
    id: 'vp5',
    vendorId: 'v1',
    code: 'MET-PEP-SLICED',
    name: 'Artisan Sliced Pepperoni',
    priceCents: 9800, // RM 98.00 per case of 5 packs
    packaging: {
      deliveryUnit1: 'Case',
      deliveryQty2: 5,
      deliveryUnit2: 'Pack',
      deliveryQty3: 1000,
      deliveryUnit3: 'g',
    },
  },
  {
    id: 'vp6',
    vendorId: 'v1',
    code: 'MET-FLR-00',
    name: 'Italian Type 00 Pizza Flour',
    priceCents: 5800, // RM 58.00 per 25kg sack
    packaging: {
      deliveryUnit1: 'Sack',
      deliveryQty2: 25,
      deliveryUnit2: 'kg',
      deliveryQty3: 1000,
      deliveryUnit3: 'g',
    },
  },
  {
    id: 'vp7',
    vendorId: 'v2',
    code: 'APX-SALAD-MIX',
    name: 'Gourmet Spring Salad Greens',
    priceCents: 4000, // RM 40.00 per crate of 4 tubs
    packaging: {
      deliveryUnit1: 'Crate',
      deliveryQty2: 4,
      deliveryUnit2: 'Tub',
      deliveryQty3: 1000,
      deliveryUnit3: 'g',
    },
  },
]

export const MOCK_SMART_COMPONENTS: SmartComponent[] = [
  {
    id: 'sc1',
    name: 'Fresh Basil Leaves',
    category: 'Produce',
    group: 'Herbs',
    inventoryUnit: 'Bag',
    recipeUnit: 'g',
    conversionRate: 1000, // 1 Bag = 1,000 g
    yieldPct: 85, // 85% usable yield after sorting and de-stemming
    looseUnit: 'Handful',
    looseToRecipeRatio: 25,
    primaryVendorProductId: 'vp1',
    alternativeVendorProductIds: ['vp1_alt'],
  },
  {
    id: 'sc2',
    name: 'Extra Virgin Olive Oil',
    category: 'Dry Goods',
    group: 'Oils',
    inventoryUnit: 'Tin',
    recipeUnit: 'ml',
    conversionRate: 5000, // 1 Tin = 5,000 ml
    yieldPct: 98, // 2% wall-clinging loss
    looseUnit: 'Squeeze Bottle',
    looseToRecipeRatio: 500,
    primaryVendorProductId: 'vp2',
    alternativeVendorProductIds: [],
  },
  {
    id: 'sc3',
    name: 'Fresh Roma Tomatoes',
    category: 'Produce',
    group: 'Vegetables',
    inventoryUnit: 'kg',
    recipeUnit: 'g',
    conversionRate: 1000, // 1 kg = 1,000 g
    yieldPct: 90, // 10% core and peeling waste
    looseUnit: 'Count',
    looseToRecipeRatio: 80,
    primaryVendorProductId: 'vp3',
    alternativeVendorProductIds: [],
  },
  {
    id: 'sc4',
    name: 'Shredded Mozzarella Cheese',
    category: 'Dairy',
    group: 'Cheese',
    inventoryUnit: 'Block',
    recipeUnit: 'g',
    conversionRate: 2500, // 1 Block = 2,500 g
    yieldPct: 98, // 2% grating loss
    looseUnit: 'Gastronorm Pan',
    looseToRecipeRatio: 1000,
    primaryVendorProductId: 'vp4',
    alternativeVendorProductIds: [],
  },
  {
    id: 'sc5',
    name: 'Sliced Pepperoni',
    category: 'Meat',
    group: 'Toppings',
    inventoryUnit: 'Pack',
    recipeUnit: 'g',
    conversionRate: 1000, // 1 Pack = 1,000 g
    yieldPct: 100, // 100% usable
    primaryVendorProductId: 'vp5',
    alternativeVendorProductIds: [],
  },
  {
    id: 'sc6',
    name: 'Caputo Pizza Flour',
    category: 'Dry Goods',
    group: 'Bakery',
    inventoryUnit: 'kg',
    recipeUnit: 'g',
    conversionRate: 1000, // 1 kg = 1,000 g
    yieldPct: 99,
    primaryVendorProductId: 'vp6',
    alternativeVendorProductIds: [],
  },
  {
    id: 'sc7',
    name: 'Spring Salad Mix',
    category: 'Produce',
    group: 'Salads',
    inventoryUnit: 'Tub',
    recipeUnit: 'g',
    conversionRate: 1000, // 1 Tub = 1,000 g
    yieldPct: 92, // 8% washing & sorting loss
    primaryVendorProductId: 'vp7',
    alternativeVendorProductIds: [],
  },
]

export const MOCK_SUB_PRODUCTS: SubProduct[] = [
  {
    id: 'sub1',
    name: 'House Marinara Sauce (5kg Batch)',
    group: 'Sauces',
    productionQty: 5000,
    productionUnit: 'g',
    recipeLines: [
      { componentId: 'sc3', recipeQty: 4800 }, // Tomatoes
      { componentId: 'sc2', recipeQty: 150 }, // EVOO
      { componentId: 'sc1', recipeQty: 50 }, // Fresh Basil
    ],
  },
  {
    id: 'sub2',
    name: 'Fresh Basil Pesto (1kg Batch)',
    group: 'Dressings',
    productionQty: 1000,
    productionUnit: 'g',
    recipeLines: [
      { componentId: 'sc1', recipeQty: 500 }, // Fresh Basil
      { componentId: 'sc2', recipeQty: 400 }, // Olive Oil
      { componentId: 'sc4', recipeQty: 100 }, // Cheese
    ],
  },
]

export const MOCK_PRODUCT_RECIPES: ProductRecipe[] = [
  {
    productId: 'p3', // Fresh Basil Salad (RRP $10.00)
    lines: [
      { componentId: 'sc7', quantity: 180, unit: 'g' }, // Salad greens
      { componentId: 'sc1', quantity: 25, unit: 'g' }, // Fresh Basil
      { componentId: 'sc2', quantity: 20, unit: 'ml' }, // EVOO dressing
      { componentId: 'sc4', quantity: 40, unit: 'g' }, // Mozzarella
    ],
    takeawayPackagingCents: 45,
  },
  {
    productId: 'p5', // Margherita Pizza (RRP $10.00)
    lines: [
      { componentId: 'sc6', quantity: 250, unit: 'g' }, // Flour for crust
      { subProductId: 'sub1', quantity: 120, unit: 'g' }, // House Marinara
      { componentId: 'sc4', quantity: 160, unit: 'g' }, // Mozzarella
      { componentId: 'sc1', quantity: 10, unit: 'g' }, // Basil garnish
      { componentId: 'sc2', quantity: 10, unit: 'ml' }, // EVOO drizzle
    ],
    takeawayPackagingCents: 60,
  },
  {
    productId: 'p12', // Pepperoni Slice (RRP $9.50)
    lines: [
      { componentId: 'sc6', quantity: 140, unit: 'g' }, // Flour
      { subProductId: 'sub1', quantity: 70, unit: 'g' }, // Marinara
      { componentId: 'sc4', quantity: 100, unit: 'g' }, // Cheese
      { componentId: 'sc5', quantity: 50, unit: 'g' }, // Pepperoni
    ],
    takeawayPackagingCents: 35,
  },
  {
    productId: 'p8', // Tomato Bisque (RRP $8.50)
    lines: [
      { subProductId: 'sub1', quantity: 320, unit: 'g' }, // Marinara base
      { componentId: 'sc2', quantity: 15, unit: 'ml' }, // EVOO
      { componentId: 'sc1', quantity: 8, unit: 'g' }, // Fresh Basil
    ],
    takeawayPackagingCents: 50,
  },
]
