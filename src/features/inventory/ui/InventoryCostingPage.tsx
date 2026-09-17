import { useState } from 'react'
import { FeaturePage } from '../../common/FeaturePage'
import { formatMoney } from '../../../core/types/money'
import { useInventory } from '../context/InventoryContext'
import './InventoryCostingPage.css'

export function InventoryCostingPage() {
  const {
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
    updateComponent,
    resetToDefaults,
  } = useInventory()

  const [activeTab, setActiveTab] = useState<'products' | 'components' | 'vendors' | 'events'>(
    'products',
  )
  const [expandedProduct, setExpandedProduct] = useState<string | null>('p5') // Margherita default expanded

  // Simulator State: Track selected Vendor Product to demonstrate cascade
  const [simVendorProductId, setSimVendorProductId] = useState<string>('vp1') // Fresh Basil

  const selectedVp = vendorProducts.find((vp) => vp.id === simVendorProductId) || vendorProducts[0]
  const linkedComponent = components.find((c) => c.primaryVendorProductId === selectedVp.id)
  const linkedComponentCost = linkedComponent ? componentCosts.get(linkedComponent.id) : null

  // Find a sub-product and product that uses this component
  const linkedSubProduct = subProducts.find((sub) =>
    sub.recipeLines.some((l) => l.componentId === linkedComponent?.id),
  )
  const linkedSubProductCost = linkedSubProduct ? subProductCosts.get(linkedSubProduct.id) : null

  // Find a product that uses this component directly OR uses the subproduct
  const linkedProductRecipe = recipes.find((r) =>
    r.lines.some(
      (l) =>
        (linkedComponent && l.componentId === linkedComponent.id) ||
        (linkedSubProduct && l.subProductId === linkedSubProduct.id),
    ),
  )
  const linkedProductCost = linkedProductRecipe
    ? productCosts.get(linkedProductRecipe.productId)
    : null

  // High-level KPI aggregations
  const productList = Array.from(productCosts.values())
  const avgCogsPct =
    productList.length > 0
      ? productList.reduce((acc, p) => acc + p.cogsPct, 0) / productList.length
      : 0
  const criticalItemsCount = productList.filter((p) => p.status === 'critical').length
  const warningItemsCount = productList.filter((p) => p.status === 'warning').length

  const vendorMap = new Map(vendors.map((v) => [v.id, v]))

  return (
    <FeaturePage
      crumb="BOH / Recipe Costing & COGS"
      title="Recipe Costing & Dynamic COGS Engine"
      subtitle="Live multi-tier UOM conversions, yield adjustments, and real-time cascading updates across suppliers, ingredients, and menu items."
    >
      <div className="costing-page">
        {/* Top KPI Metric Cards */}
        <div className="costing-kpis">
          <div className="costing-kpi-card">
            <span>Average Menu COGS</span>
            <strong style={{ color: avgCogsPct > 35 ? 'var(--color-danger)' : 'var(--color-ink)' }}>
              {avgCogsPct.toFixed(1)}%
            </strong>
            <small>Industry standard target: 28% - 32%</small>
          </div>

          <div className="costing-kpi-card">
            <span>High-Cost Alerts</span>
            <strong style={{ color: criticalItemsCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {criticalItemsCount} Critical · {warningItemsCount} Warning
            </strong>
            <small>Dishes exceeding margin safety threshold</small>
          </div>

          <div className="costing-kpi-card">
            <span>Smart Components</span>
            <strong>{components.length} Ingredients</strong>
            <small>{subProducts.length} Prep / Sub-product batches</small>
          </div>

          <div className="costing-kpi-card">
            <span>Connected Vendors</span>
            <strong>{vendorProducts.length} Vendor SKUs</strong>
            <small>Across {vendors.length} primary distributors</small>
          </div>
        </div>

        {/* Real-time Interactive Cascade Simulator */}
        <section className="simulator-card">
          <div className="simulator-header">
            <h3>
              <span>⚡</span> Live Reactive Cascade Simulator
            </h3>
            <span className="simulator-badge">DAG Reactive Graph Active</span>
          </div>

          <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: 'var(--color-ink-muted)' }}>
            Adjust any vendor purchase price or ingredient yield below. Watch the system
            automatically recalculate the <strong>Inventory Unit Cost</strong>, convert to the{' '}
            <strong>Recipe Unit Price</strong>, recalculate the <strong>Batch Prep Cost</strong>,
            and ripple into the finished <strong>Menu Item COGS %</strong> in real time.
          </p>

          <div className="simulator-grid">
            <div className="simulator-control-panel">
              <div className="simulator-field">
                <label htmlFor="sim-vp-select">Select Vendor Product to Simulate</label>
                <select
                  id="sim-vp-select"
                  className="simulator-select"
                  value={simVendorProductId}
                  onChange={(e) => setSimVendorProductId(e.target.value)}
                >
                  {vendorProducts.map((vp) => (
                    <option key={vp.id} value={vp.id}>
                      {vp.name} ({vp.packaging.deliveryUnit1} @ {formatMoney(vp.priceCents)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedVp && (
                <>
                  <div className="simulator-field">
                    <label>
                      Vendor Price per {selectedVp.packaging.deliveryUnit1}:{' '}
                      <strong>{formatMoney(selectedVp.priceCents)}</strong>
                    </label>
                    <div className="simulator-slider-wrap">
                      <input
                        type="range"
                        min="1000"
                        max="25000"
                        step="250"
                        value={selectedVp.priceCents}
                        className="simulator-slider"
                        onChange={(e) =>
                          updateVendorProductPrice(selectedVp.id, parseInt(e.target.value, 10))
                        }
                      />
                      <input
                        type="number"
                        className="simulator-input"
                        style={{ width: 90 }}
                        value={(selectedVp.priceCents / 100).toFixed(2)}
                        step="1.00"
                        onChange={(e) =>
                          updateVendorProductPrice(
                            selectedVp.id,
                            Math.round(parseFloat(e.target.value || '0') * 100),
                          )
                        }
                      />
                    </div>
                  </div>

                  {linkedComponent && (
                    <div className="simulator-field">
                      <label>
                        Component Prep Yield (Trimming & Waste):{' '}
                        <strong>{linkedComponent.yieldPct}%</strong>
                      </label>
                      <div className="simulator-slider-wrap">
                        <input
                          type="range"
                          min="50"
                          max="100"
                          step="1"
                          value={linkedComponent.yieldPct}
                          className="simulator-slider"
                          onChange={(e) =>
                            updateComponent(linkedComponent.id, {
                              yieldPct: parseInt(e.target.value, 10),
                            })
                          }
                        />
                        <span style={{ fontFamily: 'var(--font-mono)', minWidth: 40 }}>
                          {linkedComponent.yieldPct}%
                        </span>
                      </div>
                      <small style={{ color: 'var(--color-ink-subtle)' }}>
                        Lower yield inflates recipe unit price to cover kitchen prep loss.
                      </small>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Visual Step-by-Step Cascade Pipeline */}
            <div className="simulator-pipeline">
              {/* Step 1 */}
              <div className="pipeline-step is-highlighted">
                <div className="pipeline-icon">📦</div>
                <div className="pipeline-info">
                  <h4>1. Vendor Delivery & Packaging</h4>
                  <p>
                    1 {selectedVp.packaging.deliveryUnit1} = {selectedVp.packaging.deliveryQty2}{' '}
                    {selectedVp.packaging.deliveryUnit2}s
                  </p>
                </div>
                <div className="pipeline-value">
                  {formatMoney(
                    selectedVp.priceCents /
                      (selectedVp.packaging.deliveryQty2 > 0
                        ? selectedVp.packaging.deliveryQty2
                        : 1),
                  )}
                  <small>per {selectedVp.packaging.deliveryUnit2}</small>
                </div>
              </div>

              {/* Step 2 */}
              <div className="pipeline-step is-highlighted">
                <div className="pipeline-icon">🌿</div>
                <div className="pipeline-info">
                  <h4>2. Smart Component ({linkedComponent?.name || 'Ingredient'})</h4>
                  <p>
                    1 {linkedComponent?.inventoryUnit} = {linkedComponent?.conversionRate}{' '}
                    {linkedComponent?.recipeUnit} (Yield: {linkedComponent?.yieldPct}%)
                  </p>
                </div>
                <div className="pipeline-value">
                  ${((linkedComponentCost?.effectiveRecipePricePerUnitCents || 0) / 100).toFixed(4)}
                  <small>per {linkedComponent?.recipeUnit}</small>
                </div>
              </div>

              {/* Step 3 (Sub-Product if applicable) */}
              {linkedSubProduct && linkedSubProductCost && (
                <div className="pipeline-step is-highlighted">
                  <div className="pipeline-icon">🥣</div>
                  <div className="pipeline-info">
                    <h4>3. Prep Batch ({linkedSubProduct.name})</h4>
                    <p>
                      Batch Size: {linkedSubProduct.productionQty} {linkedSubProduct.productionUnit}
                    </p>
                  </div>
                  <div className="pipeline-value">
                    ${((linkedSubProductCost.unitCostCents || 0) / 100).toFixed(4)}
                    <small>per {linkedSubProduct.productionUnit}</small>
                  </div>
                </div>
              )}

              {/* Step 4 */}
              <div className="pipeline-step is-highlighted">
                <div className="pipeline-icon">🍽️</div>
                <div className="pipeline-info">
                  <h4>4. Finished Dish ({linkedProductCost?.productName || 'Menu Item'})</h4>
                  <p>Selling Price: {formatMoney(linkedProductCost?.sellingPriceCents || 0)}</p>
                </div>
                <div className="pipeline-value">
                  <span
                    style={{
                      color:
                        (linkedProductCost?.cogsPct || 0) > 35
                          ? 'var(--color-danger)'
                          : 'var(--color-success)',
                    }}
                  >
                    {formatMoney(linkedProductCost?.totalCogsCents || 0)} (
                    {(linkedProductCost?.cogsPct || 0).toFixed(1)}%)
                  </span>
                  <small>
                    Margin: {((linkedProductCost?.grossMarginPct || 0)).toFixed(1)}%
                  </small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* View Selection Tabs & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="costing-tabs">
            <button
              type="button"
              className={`costing-tab-btn${activeTab === 'products' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              🍽️ Menu Items & Recipes ({recipes.length})
            </button>
            <button
              type="button"
              className={`costing-tab-btn${activeTab === 'components' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('components')}
            >
              🌿 Smart Components ({components.length})
            </button>
            <button
              type="button"
              className={`costing-tab-btn${activeTab === 'vendors' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('vendors')}
            >
              🏢 Vendor SKUs & Packaging ({vendorProducts.length})
            </button>
            <button
              type="button"
              className={`costing-tab-btn${activeTab === 'events' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              ⚡ Cascade Audit Log ({recentEvents.length})
            </button>
          </div>

          <button
            type="button"
            className="chip-btn"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={resetToDefaults}
          >
            Reset Sample Data
          </button>
        </div>

        {/* Tab 1: Menu Items & Recipes Table */}
        {activeTab === 'products' && (
          <div className="table-container">
            <table className="costing-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Product / Menu Item</th>
                  <th>Retail Price (RRP)</th>
                  <th>Total COGS</th>
                  <th>COGS %</th>
                  <th>Gross Margin</th>
                  <th>Cost Range (Low / High)</th>
                  <th>Margin Health</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((rec) => {
                  const cost = productCosts.get(rec.productId)
                  if (!cost) return null
                  const isExpanded = expandedProduct === rec.productId

                  return (
                    <>
                      <tr
                        key={rec.productId}
                        className={isExpanded ? 'is-expanded' : ''}
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          setExpandedProduct(isExpanded ? null : rec.productId)
                        }
                      >
                        <td style={{ textAlign: 'center', color: 'var(--color-ink-subtle)' }}>
                          {isExpanded ? '▼' : '▶'}
                        </td>
                        <td>
                          <strong>{cost.productName}</strong>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                            SKU: {rec.productId.toUpperCase()} · {cost.lineCosts.length} recipe components
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {formatMoney(cost.sellingPriceCents)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {formatMoney(cost.totalCogsCents)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          <span
                            style={{
                              color:
                                cost.status === 'critical'
                                  ? 'var(--color-danger)'
                                  : cost.status === 'warning'
                                    ? '#d97706'
                                    : 'var(--color-success)',
                            }}
                          >
                            {cost.cogsPct.toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {formatMoney(cost.grossMarginCents)}{' '}
                          <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.8rem' }}>
                            ({cost.grossMarginPct.toFixed(1)}%)
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                          {formatMoney(cost.cogsLowCents)} – {formatMoney(cost.cogsHighCents)}
                        </td>
                        <td>
                          <span className={`status-pill ${cost.status}`}>
                            {cost.status === 'healthy' && '● Healthy'}
                            {cost.status === 'warning' && '▲ Warning'}
                            {cost.status === 'critical' && '✕ Alert'}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Recipe Breakdown Drilldown */}
                      {isExpanded && (
                        <tr className="recipe-drilldown-row">
                          <td colSpan={8}>
                            <div className="recipe-drilldown-box">
                              <h5>
                                📋 Recipe Bill of Materials (BOM) & Line Cost Breakdown for{' '}
                                <strong>{cost.productName}</strong>
                              </h5>
                              <table className="recipe-drilldown-table">
                                <thead>
                                  <tr>
                                    <th>Ingredient / Prep Item</th>
                                    <th>Portion Qty</th>
                                    <th>Derived Unit Price</th>
                                    <th>Line Cost</th>
                                    <th>% of Dish Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cost.lineCosts.map((line, idx) => {
                                    const pct =
                                      cost.totalCogsCents > 0
                                        ? (line.lineCostCents / cost.totalCogsCents) * 100
                                        : 0

                                    return (
                                      <tr key={idx}>
                                        <td>
                                          <strong>{line.name}</strong>{' '}
                                          <span
                                            style={{
                                              fontSize: '0.75rem',
                                              padding: '2px 6px',
                                              borderRadius: 4,
                                              background:
                                                line.type === 'subproduct' ? '#ede9fe' : '#f1f5f9',
                                              color:
                                                line.type === 'subproduct' ? '#6d28d9' : '#475569',
                                            }}
                                          >
                                            {line.type === 'subproduct' ? 'Batch Prep' : 'Ingredient'}
                                          </span>
                                        </td>
                                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                                          {line.quantity} {line.unit}
                                        </td>
                                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                                          ${(line.unitPriceCents / 100).toFixed(4)} / {line.unit}
                                        </td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                          {formatMoney(line.lineCostCents)}
                                        </td>
                                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
                                          {pct.toFixed(1)}%
                                        </td>
                                      </tr>
                                    )
                                  })}

                                  {cost.packagingCostCents > 0 && (
                                    <tr>
                                      <td>
                                        <strong>To-Go Packaging & Disposables</strong>
                                      </td>
                                      <td style={{ fontFamily: 'var(--font-mono)' }}>1 set</td>
                                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                                        {formatMoney(cost.packagingCostCents)}
                                      </td>
                                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                        {formatMoney(cost.packagingCostCents)}
                                      </td>
                                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
                                        {(
                                          (cost.packagingCostCents / cost.totalCogsCents) *
                                          100
                                        ).toFixed(1)}
                                        %
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Smart Components Table */}
        {activeTab === 'components' && (
          <div className="table-container">
            <table className="costing-table">
              <thead>
                <tr>
                  <th>Component (Ingredient)</th>
                  <th>Primary Supplier SKU</th>
                  <th>Inventory UOM</th>
                  <th>Recipe UOM</th>
                  <th>Conversion Factor</th>
                  <th>Yield %</th>
                  <th>Effective Recipe Price</th>
                  <th>Supplier Range (Low / High)</th>
                </tr>
              </thead>
              <tbody>
                {components.map((comp) => {
                  const summary = componentCosts.get(comp.id)
                  const primaryVp = vendorProducts.find(
                    (vp) => vp.id === comp.primaryVendorProductId,
                  )

                  return (
                    <tr key={comp.id}>
                      <td>
                        <strong>{comp.name}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                          {comp.category} · {comp.group}
                        </div>
                      </td>
                      <td>
                        {primaryVp ? (
                          <>
                            <strong>{primaryVp.name}</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                              Code: {primaryVp.code} ({formatMoney(primaryVp.priceCents)})
                            </div>
                          </>
                        ) : (
                          'No vendor mapped'
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{comp.inventoryUnit}</span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                          {formatMoney(summary?.costPerInventoryUnitCents || 0)} / {comp.inventoryUnit}
                        </div>
                      </td>
                      <td>
                        <strong>{comp.recipeUnit}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            className="inline-input"
                            value={comp.conversionRate}
                            onChange={(e) =>
                              updateComponent(comp.id, {
                                conversionRate: parseFloat(e.target.value) || 1,
                              })
                            }
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                            {comp.recipeUnit} / {comp.inventoryUnit}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            className="inline-input"
                            style={{ width: 65 }}
                            min="1"
                            max="100"
                            value={comp.yieldPct}
                            onChange={(e) =>
                              updateComponent(comp.id, {
                                yieldPct: parseInt(e.target.value, 10) || 100,
                              })
                            }
                          />
                          <span>%</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary-text)' }}>
                        ${((summary?.effectiveRecipePricePerUnitCents || 0) / 100).toFixed(4)} / {comp.recipeUnit}
                        <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--color-ink-muted)' }}>
                          Raw: ${((summary?.baseRecipePricePerUnitCents || 0) / 100).toFixed(4)}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                        ${((summary?.lowRecipePricePerUnitCents || 0) / 100).toFixed(4)} – $
                        {((summary?.highRecipePricePerUnitCents || 0) / 100).toFixed(4)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Vendor Products Table */}
        {activeTab === 'vendors' && (
          <div className="table-container">
            <table className="costing-table">
              <thead>
                <tr>
                  <th>Vendor & Product</th>
                  <th>Product Code</th>
                  <th>Packaging Breakdown</th>
                  <th>Delivery Unit 1 Price</th>
                  <th>Calculated Cost / Inv Unit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vendorProducts.map((vp) => {
                  const vendor = vendorMap.get(vp.vendorId)
                  const costPerInv =
                    vp.priceCents /
                    (vp.packaging.deliveryQty2 > 0 ? vp.packaging.deliveryQty2 : 1)

                  return (
                    <tr key={vp.id}>
                      <td>
                        <strong>{vp.name}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                          Vendor: <strong>{vendor?.name || vp.vendorId}</strong>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {vp.code}
                      </td>
                      <td>
                        <div>
                          1 {vp.packaging.deliveryUnit1} ={' '}
                          <strong>{vp.packaging.deliveryQty2}</strong> {vp.packaging.deliveryUnit2}s
                        </div>
                        {vp.packaging.deliveryQty3 && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                            (Each {vp.packaging.deliveryUnit2} contains {vp.packaging.deliveryQty3}{' '}
                            {vp.packaging.deliveryUnit3})
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>$</span>
                          <input
                            type="number"
                            className="inline-input"
                            value={(vp.priceCents / 100).toFixed(2)}
                            step="1.00"
                            onChange={(e) =>
                              updateVendorProductPrice(
                                vp.id,
                                Math.round(parseFloat(e.target.value || '0') * 100),
                              )
                            }
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                            / {vp.packaging.deliveryUnit1}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {formatMoney(costPerInv)} / {vp.packaging.deliveryUnit2}
                      </td>
                      <td>
                        <span className="status-pill healthy">Active Primary</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Cascade Audit Stream */}
        {activeTab === 'events' && (
          <div className="events-feed">
            {recentEvents.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                No changes made yet. Try changing a vendor price or yield % in the simulator above to
                view the real-time cascade log!
              </div>
            ) : (
              recentEvents.map((evt) => (
                <div key={evt.id} className="event-entry">
                  <div>
                    <strong>{evt.title}</strong>
                    <p>{evt.detail}</p>
                    <small style={{ color: 'var(--color-primary-text)', fontWeight: 600 }}>
                      ↳ {evt.impact}
                    </small>
                  </div>
                  <div className="event-time">{evt.timestamp}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </FeaturePage>
  )
}
