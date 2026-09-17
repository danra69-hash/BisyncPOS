import type { MoneyCents } from '../../../core/types/money'

export type Vendor = {
  id: string
  name: string
  code: string
  contactEmail?: string
  contactPhone?: string
  deliveryTerms?: string
}

export type VendorPackaging = {
  /** Delivery/Supply UOM (Unit 1, e.g. "Carton", "Crate", "Box", "Case") */
  deliveryUnit1: string
  /** Number of Inventory Units (Unit 2) inside one Delivery Unit 1 (e.g. 12 Bottles per Carton) */
  deliveryQty2: number
  /** Inventory UOM (Unit 2, e.g. "Bottle", "Bag", "Block", "Tin") */
  deliveryUnit2: string
  /** Optional inner size per Inventory Unit in Recipe Units (e.g. 750 ml per bottle, 1000 g per bag) */
  deliveryQty3?: number
  /** Alternate/Inner UOM (Unit 3, e.g. "ml", "g") */
  deliveryUnit3?: string
}

export type VendorProduct = {
  id: string
  vendorId: string
  code: string
  name: string
  /** Price in minor units (cents) per Delivery Unit 1 */
  priceCents: MoneyCents
  packaging: VendorPackaging
}

export type SmartComponent = {
  id: string
  name: string
  category: string
  group: string
  /** The unit in which stock is held/counted (e.g. "Bottle", "Bag", "kg", "Block") */
  inventoryUnit: string
  /** The unit in which culinary recipes measure this component (e.g. "ml", "g", "pcs") */
  recipeUnit: string
  /**
   * Conversion multiplier: How many Recipe Units are in ONE Inventory Unit?
   * e.g., 1 Bottle = 750 ml -> conversionRate = 750.
   * e.g., 1 kg = 1000 g -> conversionRate = 1000.
   */
  conversionRate: number
  /**
   * Usable yield percentage (0 - 100).
   * Accounts for trimming, peeling, shrinkage, cooking loss.
   * e.g. 85 means 85% usable (15% loss). Effective Cost = Base Cost / 0.85.
   */
  yieldPct: number
  /** Optional loose unit for spot counting */
  looseUnit?: string
  looseToRecipeRatio?: number
  /** Selected active supplier product */
  primaryVendorProductId: string
  /** Alternative supplier products for range & average analysis */
  alternativeVendorProductIds: string[]
}

export type SubProductRecipeLine = {
  componentId: string
  recipeQty: number
}

export type SubProduct = {
  id: string
  name: string
  group: string
  /** Batch output yield, e.g. 1000 g of Pesto, or 5000 ml of Tomato Sauce */
  productionQty: number
  /** Unit of the batch output, e.g. "g" or "ml" */
  productionUnit: string
  recipeLines: SubProductRecipeLine[]
}

export type ProductRecipeLine = {
  componentId?: string
  subProductId?: string
  quantity: number
  unit: string
}

export type ProductRecipe = {
  productId: string
  lines: ProductRecipeLine[]
  takeawayPackagingCents: MoneyCents
}

// -------------------------------------------------------------
// Reactive Cost Calculation Summaries
// -------------------------------------------------------------

export type ComponentCostSummary = {
  componentId: string
  componentName: string
  primaryVendorProductId: string
  /** Cost per single Inventory Unit (e.g. 1 bottle or 1 kg) in cents (floating point for precision) */
  costPerInventoryUnitCents: number
  /** Base cost per Recipe Unit without yield adjustment (cents) */
  baseRecipePricePerUnitCents: number
  /** Effective cost per Recipe Unit with yield factor accounted (cents) */
  effectiveRecipePricePerUnitCents: number
  /** Low, High, and Average price per recipe unit across all linked vendors */
  lowRecipePricePerUnitCents: number
  highRecipePricePerUnitCents: number
  avgRecipePricePerUnitCents: number
}

export type SubProductLineCost = {
  componentId: string
  componentName: string
  quantity: number
  unit: string
  unitPriceCents: number
  lineCostCents: number
}

export type SubProductCostSummary = {
  subProductId: string
  subProductName: string
  totalBatchCostCents: number
  /** Cost per 1 unit of the batch (e.g. per gram or per ml) */
  unitCostCents: number
  productionQty: number
  productionUnit: string
  lines: SubProductLineCost[]
}

export type ProductRecipeLineCost = {
  type: 'component' | 'subproduct'
  id: string
  name: string
  quantity: number
  unit: string
  unitPriceCents: number
  lineCostCents: number
}

export type ProductCostSummary = {
  productId: string
  productName: string
  sellingPriceCents: MoneyCents
  ingredientsCostCents: number
  packagingCostCents: number
  totalCogsCents: number
  cogsPct: number
  grossMarginCents: number
  grossMarginPct: number
  cogsLowCents: number
  cogsHighCents: number
  lineCosts: ProductRecipeLineCost[]
  status: 'healthy' | 'warning' | 'critical'
}
