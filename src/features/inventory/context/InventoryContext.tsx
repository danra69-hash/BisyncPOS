import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MOCK_PRODUCTS } from '../../register/domain/catalog'
import { calculateEntireCostGraph } from '../domain/calculations'
import {
  MOCK_PRODUCT_RECIPES,
  MOCK_SMART_COMPONENTS,
  MOCK_SUB_PRODUCTS,
  MOCK_VENDOR_PRODUCTS,
  MOCK_VENDORS,
} from '../domain/mockData'
import type {
  ComponentCostSummary,
  ProductCostSummary,
  ProductRecipe,
  SmartComponent,
  SubProduct,
  SubProductCostSummary,
  Vendor,
  VendorPackaging,
  VendorProduct,
} from '../domain/types'

type CascadeEvent = {
  id: string
  timestamp: string
  title: string
  detail: string
  impact: string
}

type InventoryContextValue = {
  vendors: Vendor[]
  vendorProducts: VendorProduct[]
  components: SmartComponent[]
  subProducts: SubProduct[]
  recipes: ProductRecipe[]
  componentCosts: Map<string, ComponentCostSummary>
  subProductCosts: Map<string, SubProductCostSummary>
  productCosts: Map<string, ProductCostSummary>
  recentEvents: CascadeEvent[]
  updateVendorProductPrice: (id: string, priceCents: number) => void
  updateVendorProductPackaging: (id: string, packaging: Partial<VendorPackaging>) => void
  updateComponent: (id: string, updates: Partial<SmartComponent>) => void
  updateSubProduct: (id: string, updates: Partial<SubProduct>) => void
  updateRecipe: (productId: string, updates: Partial<ProductRecipe>) => void
  resetToDefaults: () => void
}

const STORAGE_KEY = 'bisync_inventory_v1'

const InventoryContext = createContext<InventoryContextValue | null>(null)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [vendors] = useState<Vendor[]>(() => {
    return MOCK_VENDORS
  })

  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_vp`)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // ignore
      }
    }
    return MOCK_VENDOR_PRODUCTS
  })

  const [components, setComponents] = useState<SmartComponent[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_sc`)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // ignore
      }
    }
    return MOCK_SMART_COMPONENTS
  })

  const [subProducts, setSubProducts] = useState<SubProduct[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_sub`)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // ignore
      }
    }
    return MOCK_SUB_PRODUCTS
  })

  const [recipes, setRecipes] = useState<ProductRecipe[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_recipes`)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // ignore
      }
    }
    return MOCK_PRODUCT_RECIPES
  })

  const [recentEvents, setRecentEvents] = useState<CascadeEvent[]>([])

  function logCascade(title: string, detail: string, impact: string) {
    const newEvent: CascadeEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      title,
      detail,
      impact,
    }
    setRecentEvents((prev) => [newEvent, ...prev.slice(0, 19)])
  }

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_vp`, JSON.stringify(vendorProducts))
  }, [vendorProducts])

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_sc`, JSON.stringify(components))
  }, [components])

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_sub`, JSON.stringify(subProducts))
  }, [subProducts])

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_recipes`, JSON.stringify(recipes))
  }, [recipes])

  // Reactive DAG evaluation: automatically recalculates on ANY state change
  const { componentCosts, subProductCosts, productCosts } = useMemo(() => {
    return calculateEntireCostGraph({
      vendorProducts,
      components,
      subProducts,
      recipes,
      products: MOCK_PRODUCTS,
    })
  }, [vendorProducts, components, subProducts, recipes])

  // Mutations
  function updateVendorProductPrice(id: string, priceCents: number) {
    const vp = vendorProducts.find((v) => v.id === id)
    if (!vp) return

    setVendorProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, priceCents } : item)),
    )

    logCascade(
      `Vendor Price Changed: ${vp.name}`,
      `Delivery price set to RM ${(priceCents / 100).toFixed(2)} / ${vp.packaging.deliveryUnit1}`,
      'Recalculated unit prices of linked Smart Components, Sub-Products, and Menu COGS',
    )
  }

  function updateVendorProductPackaging(id: string, packagingUpdate: Partial<VendorPackaging>) {
    const vp = vendorProducts.find((v) => v.id === id)
    if (!vp) return

    setVendorProducts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, packaging: { ...item.packaging, ...packagingUpdate } } : item,
      ),
    )

    logCascade(
      `Packaging Multiplier Changed: ${vp.name}`,
      `Updated packaging ratio (${packagingUpdate.deliveryQty2 || vp.packaging.deliveryQty2} ${packagingUpdate.deliveryUnit2 || vp.packaging.deliveryUnit2} per ${vp.packaging.deliveryUnit1})`,
      'Recalculated inventory unit cost and recipe unit price downstream',
    )
  }

  function updateComponent(id: string, updates: Partial<SmartComponent>) {
    const comp = components.find((c) => c.id === id)
    if (!comp) return

    setComponents((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    )

    const notes: string[] = []
    if (updates.conversionRate !== undefined) notes.push(`Conv Rate: ${updates.conversionRate}`)
    if (updates.yieldPct !== undefined) notes.push(`Yield: ${updates.yieldPct}%`)
    if (updates.primaryVendorProductId !== undefined) notes.push('Primary Vendor Changed')

    logCascade(
      `Smart Component Adjusted: ${comp.name}`,
      notes.join(' · '),
      'Recalculated effective recipe unit price and propagated to all dishes and prep batches',
    )
  }

  function updateSubProduct(id: string, updates: Partial<SubProduct>) {
    setSubProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    )
  }

  function updateRecipe(productId: string, updates: Partial<ProductRecipe>) {
    setRecipes((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, ...updates } : item)),
    )
  }

  function resetToDefaults() {
    setVendorProducts(MOCK_VENDOR_PRODUCTS)
    setComponents(MOCK_SMART_COMPONENTS)
    setSubProducts(MOCK_SUB_PRODUCTS)
    setRecipes(MOCK_PRODUCT_RECIPES)
    setRecentEvents([])
    localStorage.removeItem(`${STORAGE_KEY}_vp`)
    localStorage.removeItem(`${STORAGE_KEY}_sc`)
    localStorage.removeItem(`${STORAGE_KEY}_sub`)
    localStorage.removeItem(`${STORAGE_KEY}_recipes`)
    logCascade('Inventory Reset', 'Restored initial sample master data and standard rates', 'All costs restored')
  }

  return (
    <InventoryContext.Provider
      value={{
        vendors,
        vendorProducts,
        components,
        subProducts,
        recipes,
        componentCosts,
        subProductCosts,
        productCosts,
        recentEvents,
        updateVendorProductPrice,
        updateVendorProductPackaging,
        updateComponent,
        updateSubProduct,
        updateRecipe,
        resetToDefaults,
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used within an InventoryProvider')
  return ctx
}
