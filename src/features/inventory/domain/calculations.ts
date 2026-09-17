import type { Product } from '../../register/domain/types'
import type {
  ComponentCostSummary,
  ProductCostSummary,
  ProductRecipe,
  ProductRecipeLineCost,
  SmartComponent,
  SubProduct,
  SubProductCostSummary,
  SubProductLineCost,
  VendorProduct,
} from './types'

/**
 * Tier 1 Calculation: Cost per Inventory Unit
 * Formula: Vendor Price (Delivery Unit 1) / Delivery Quantity 2
 * e.g., RM 240 / 12 bottles = RM 20 per bottle
 */
export function calculateCostPerInventoryUnit(vp: VendorProduct): number {
  const qty2 = vp.packaging.deliveryQty2 > 0 ? vp.packaging.deliveryQty2 : 1
  return vp.priceCents / qty2
}

/**
 * Tier 2 Calculation: Recipe Unit Price with Yield Loss Adjustment
 * Formula: (Cost per Inventory Unit / Conversion Rate) / (Yield % / 100)
 * e.g., (RM 20 / 750 ml) / (95 / 100) = RM 0.02807 / ml
 */
export function calculateRecipeUnitPriceFromVendorProduct(
  vp: VendorProduct,
  component: SmartComponent,
): number {
  const costPerInv = calculateCostPerInventoryUnit(vp)
  const convRate = component.conversionRate > 0 ? component.conversionRate : 1
  const baseRecipeUnitCost = costPerInv / convRate
  const yieldFactor = component.yieldPct > 0 ? component.yieldPct / 100 : 1
  return baseRecipeUnitCost / yieldFactor
}

/**
 * Calculates single component summary including multi-vendor range (Low, High, Average, Primary)
 */
export function calculateComponentCostSummary(
  component: SmartComponent,
  vendorProductMap: Map<string, VendorProduct>,
): ComponentCostSummary {
  const primaryVp = vendorProductMap.get(component.primaryVendorProductId)

  let costPerInventoryUnitCents = 0
  let baseRecipePricePerUnitCents = 0
  let effectiveRecipePricePerUnitCents = 0

  if (primaryVp) {
    costPerInventoryUnitCents = calculateCostPerInventoryUnit(primaryVp)
    const convRate = component.conversionRate > 0 ? component.conversionRate : 1
    baseRecipePricePerUnitCents = costPerInventoryUnitCents / convRate
    const yieldFactor = component.yieldPct > 0 ? component.yieldPct / 100 : 1
    effectiveRecipePricePerUnitCents = baseRecipePricePerUnitCents / yieldFactor
  }

  // Collect all linked vendor products for Low / High / Avg pricing
  const allVpIds = Array.from(
    new Set([component.primaryVendorProductId, ...component.alternativeVendorProductIds]),
  )
  const validPrices: number[] = []

  for (const vpId of allVpIds) {
    const vp = vendorProductMap.get(vpId)
    if (vp) {
      validPrices.push(calculateRecipeUnitPriceFromVendorProduct(vp, component))
    }
  }

  const lowRecipePricePerUnitCents =
    validPrices.length > 0 ? Math.min(...validPrices) : effectiveRecipePricePerUnitCents
  const highRecipePricePerUnitCents =
    validPrices.length > 0 ? Math.max(...validPrices) : effectiveRecipePricePerUnitCents
  const avgRecipePricePerUnitCents =
    validPrices.length > 0
      ? validPrices.reduce((acc, p) => acc + p, 0) / validPrices.length
      : effectiveRecipePricePerUnitCents

  return {
    componentId: component.id,
    componentName: component.name,
    primaryVendorProductId: component.primaryVendorProductId,
    costPerInventoryUnitCents,
    baseRecipePricePerUnitCents,
    effectiveRecipePricePerUnitCents,
    lowRecipePricePerUnitCents,
    highRecipePricePerUnitCents,
    avgRecipePricePerUnitCents,
  }
}

/**
 * Sub-Product Calculation (Prep Batches, Sauces, Marinades)
 * Sum of ingredient lines divided by batch output quantity
 */
export function calculateSubProductCost(
  subProduct: SubProduct,
  componentSummaryMap: Map<string, ComponentCostSummary>,
): SubProductCostSummary {
  let totalBatchCostCents = 0
  const lines: SubProductLineCost[] = []

  for (const line of subProduct.recipeLines) {
    const compSummary = componentSummaryMap.get(line.componentId)
    const unitPriceCents = compSummary ? compSummary.effectiveRecipePricePerUnitCents : 0
    const lineCostCents = line.recipeQty * unitPriceCents
    totalBatchCostCents += lineCostCents

    lines.push({
      componentId: line.componentId,
      componentName: compSummary?.componentName || 'Unknown Ingredient',
      quantity: line.recipeQty,
      unit: 'rec',
      unitPriceCents,
      lineCostCents,
    })
  }

  const batchQty = subProduct.productionQty > 0 ? subProduct.productionQty : 1
  const unitCostCents = totalBatchCostCents / batchQty

  return {
    subProductId: subProduct.id,
    subProductName: subProduct.name,
    totalBatchCostCents,
    unitCostCents,
    productionQty: subProduct.productionQty,
    productionUnit: subProduct.productionUnit,
    lines,
  }
}

/**
 * Product Costing (Finished Menu Item COGS & Margins)
 * Combines direct smart components + batch sub-products + packaging
 */
export function calculateProductCost(
  recipe: ProductRecipe,
  product: Product,
  componentSummaryMap: Map<string, ComponentCostSummary>,
  subProductSummaryMap: Map<string, SubProductCostSummary>,
): ProductCostSummary {
  let ingredientsCostCents = 0
  let ingredientsCostLowCents = 0
  let ingredientsCostHighCents = 0
  const lineCosts: ProductRecipeLineCost[] = []

  for (const line of recipe.lines) {
    if (line.componentId) {
      const compSummary = componentSummaryMap.get(line.componentId)
      const unitPriceCents = compSummary ? compSummary.effectiveRecipePricePerUnitCents : 0
      const unitPriceLow = compSummary ? compSummary.lowRecipePricePerUnitCents : unitPriceCents
      const unitPriceHigh = compSummary ? compSummary.highRecipePricePerUnitCents : unitPriceCents
      const lineCost = line.quantity * unitPriceCents

      ingredientsCostCents += lineCost
      ingredientsCostLowCents += line.quantity * unitPriceLow
      ingredientsCostHighCents += line.quantity * unitPriceHigh

      lineCosts.push({
        type: 'component',
        id: line.componentId,
        name: compSummary?.componentName || 'Ingredient',
        quantity: line.quantity,
        unit: line.unit,
        unitPriceCents,
        lineCostCents: lineCost,
      })
    } else if (line.subProductId) {
      const subSummary = subProductSummaryMap.get(line.subProductId)
      const unitPriceCents = subSummary ? subSummary.unitCostCents : 0
      const lineCost = line.quantity * unitPriceCents

      ingredientsCostCents += lineCost
      ingredientsCostLowCents += lineCost
      ingredientsCostHighCents += lineCost

      lineCosts.push({
        type: 'subproduct',
        id: line.subProductId,
        name: subSummary?.subProductName || 'Prep Batch',
        quantity: line.quantity,
        unit: line.unit,
        unitPriceCents,
        lineCostCents: lineCost,
      })
    }
  }

  const packagingCostCents = recipe.takeawayPackagingCents || 0
  const totalCogsCents = ingredientsCostCents + packagingCostCents
  const cogsLowCents = ingredientsCostLowCents + packagingCostCents
  const cogsHighCents = ingredientsCostHighCents + packagingCostCents

  const sellingPrice = product.priceCents > 0 ? product.priceCents : 1
  const cogsPct = (totalCogsCents / sellingPrice) * 100
  const grossMarginCents = product.priceCents - totalCogsCents
  const grossMarginPct = ((product.priceCents - totalCogsCents) / sellingPrice) * 100

  let status: 'healthy' | 'warning' | 'critical' = 'healthy'
  if (cogsPct > 38) {
    status = 'critical'
  } else if (cogsPct > 32) {
    status = 'warning'
  }

  return {
    productId: product.id,
    productName: product.name,
    sellingPriceCents: product.priceCents,
    ingredientsCostCents,
    packagingCostCents,
    totalCogsCents,
    cogsPct,
    grossMarginCents,
    grossMarginPct,
    cogsLowCents,
    cogsHighCents,
    lineCosts,
    status,
  }
}

/**
 * Evaluates the entire dependency graph in topological order.
 * Any change to a single vendor product or conversion rate propagates
 * throughout all dependent smart components, subproducts, and products.
 */
export function calculateEntireCostGraph(params: {
  vendorProducts: VendorProduct[]
  components: SmartComponent[]
  subProducts: SubProduct[]
  recipes: ProductRecipe[]
  products: Product[]
}) {
  const { vendorProducts, components, subProducts, recipes, products } = params

  const vpMap = new Map(vendorProducts.map((vp) => [vp.id, vp]))
  const prodMap = new Map(products.map((p) => [p.id, p]))

  // 1. Calculate Component Costs
  const componentCosts = new Map<string, ComponentCostSummary>()
  for (const comp of components) {
    componentCosts.set(comp.id, calculateComponentCostSummary(comp, vpMap))
  }

  // 2. Calculate Sub-Product Costs
  const subProductCosts = new Map<string, SubProductCostSummary>()
  for (const sub of subProducts) {
    subProductCosts.set(sub.id, calculateSubProductCost(sub, componentCosts))
  }

  // 3. Calculate Product Costs
  const productCosts = new Map<string, ProductCostSummary>()
  for (const rec of recipes) {
    const product = prodMap.get(rec.productId)
    if (product) {
      productCosts.set(
        rec.productId,
        calculateProductCost(rec, product, componentCosts, subProductCosts),
      )
    }
  }

  return {
    componentCosts,
    subProductCosts,
    productCosts,
  }
}
