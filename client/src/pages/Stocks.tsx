import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import type { Product } from '../lib/api'
import { ErrorState, Loading } from '../components/State'
import { getUser } from '../lib/auth'

const DEFAULT_THRESHOLD = 15

function money(v: number | null) {
  if (v === null || v === undefined) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v)
}

export default function Stocks() {
  const user = getUser()
  const canEdit = user?.role === 'ADMIN' || user?.role === 'LOGISTICS'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  // --- Modal stock ---
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const [mode, setMode] = useState<'ADD' | 'SET'>('ADD')
  const [newQty, setNewQty] = useState('')
  const [savingStock, setSavingStock] = useState(false)

  // --- Modal create product ---
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('') // string -> number
  const [initialStock, setInitialStock] = useState('0')
  const [savingCreate, setSavingCreate] = useState(false)

  async function loadProducts() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.products()
      setProducts(data)
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger les produits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  const stats = useMemo(() => {
    const total = products.length
    const low = products.filter((p) => p.stock_quantity < DEFAULT_THRESHOLD).length
    const out = products.filter((p) => p.stock_quantity <= 0).length
    const value = products.reduce((sum, p) => sum + (p.price ? p.price * p.stock_quantity : 0), 0)
    return { total, low, out, value }
  }, [products])

  // --- Stock modal handlers ---
  function openEditStock(p: Product) {
    setSelected(p)
    setMode('ADD')
    setNewQty('')
    setStockModalOpen(true)
  }

  function closeEditStock() {
    setStockModalOpen(false)
    setSelected(null)
    setNewQty('')
  }

  async function saveStock() {
    if (!selected || !canEdit) return

    const n = Number(newQty)
    if (Number.isNaN(n) || n < 0) {
      setError('Valeur invalide (nombre >= 0)')
      return
    }

    const nextQty = mode === 'ADD' ? selected.stock_quantity + n : n

    setSavingStock(true)
    try {
      await api.updateProductStock(selected.id, nextQty)
      await loadProducts()
      closeEditStock()
    } catch (e: any) {
      setError(e?.message || 'Échec mise à jour stock')
    } finally {
      setSavingStock(false)
    }
  }

  // --- Create product modal handlers ---
  function openCreateProduct() {
    setError(null)
    setSku('')
    setName('')
    setPrice('')
    setInitialStock('0')
    setCreateModalOpen(true)
  }

  function closeCreateProduct() {
    setCreateModalOpen(false)
  }

  async function saveNewProduct() {
    if (!canEdit) return

    const skuTrim = sku.trim()
    const nameTrim = name.trim()
    if (!skuTrim || !nameTrim) {
      setError('SKU et Nom sont requis')
      return
    }

    const stockNum = Number(initialStock)
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError('Stock initial invalide (nombre >= 0)')
      return
    }

    let priceNum: number | null = null
    if (price.trim() !== '') {
      const p = Number(price)
      if (Number.isNaN(p) || p < 0) {
        setError('Prix invalide (nombre >= 0)')
        return
      }
      priceNum = p
    }

    setSavingCreate(true)
    try {
      await api.createProduct({
        sku: skuTrim,
        name: nameTrim,
        stock_quantity: stockNum,
        price: priceNum,
      })
      await loadProducts()
      closeCreateProduct()
    } catch (e: any) {
      setError(e?.message || 'Échec création produit')
    } finally {
      setSavingCreate(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Stocks</h1>

        <div className="page-actions">
          <button className="auth-submit" type="button" onClick={openCreateProduct} disabled={!canEdit}>
            + Nouveau produit
          </button>
        </div>
      </div>

      <div className="cards-grid">
        <div className="card card-kpi">
          <div className="card-kpi-label">Total produits</div>
          <div className="card-kpi-value">{stats.total}</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Stock faible (&lt; {DEFAULT_THRESHOLD})</div>
          <div className="card-kpi-value">{stats.low}</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Rupture</div>
          <div className="card-kpi-value">{stats.out}</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Valeur stock (approx.)</div>
          <div className="card-kpi-value">{money(stats.value)}</div>
        </div>
      </div>

      {error && <ErrorState message={error} />}

      {loading ? (
        <Loading label="Chargement des produits…" />
      ) : (
        <div className="stock-grid">
          {products.map((p) => {
            const isLow = p.stock_quantity < DEFAULT_THRESHOLD
            const pct = Math.max(0, Math.min(100, (p.stock_quantity / (DEFAULT_THRESHOLD * 3)) * 100))
            return (
              <article key={p.id} className={`card stock-card ${isLow ? 'stock-card--warning' : 'stock-card--ok'}`}>
                <header className="stock-card-header">
                  <div>
                    <div className="stock-name">{p.name}</div>
                    <div className="stock-meta">
                      SKU: {p.sku} · Prix: {money(p.price)}
                    </div>
                  </div>
                  <span className={isLow ? 'badge badge--low-stock' : 'badge badge--stock-ok'}>{isLow ? 'Faible' : 'OK'}</span>
                </header>

                <div className="stock-bar">
                  <div
                    className={`stock-bar-fill ${isLow ? 'stock-bar-fill--warning' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <footer className="stock-footer">
                  <span>
                    Stock: <strong>{p.stock_quantity}</strong>
                  </span>
                  <span>Seuil: {DEFAULT_THRESHOLD}</span>
                </footer>

                <div className="stock-actions">
                  <button className="btn-ghost" type="button" onClick={() => openEditStock(p)} disabled={!canEdit}>
                    Gérer stock
                  </button>
                </div>

                {isLow && <div className="stock-alert">Stock sous le seuil. Pensez à réapprovisionner.</div>}

                {!canEdit && (
                  <div className="table-sub-text" style={{ marginTop: 8 }}>
                    Ton rôle ({user?.role}) ne permet pas de modifier le stock.
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {/* --- Stock modal --- */}
      {stockModalOpen && selected && (
        <div className="drawer-backdrop" onClick={closeEditStock} role="presentation">
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-header">
              <div>
                <div className="drawer-title">Gérer le stock</div>
                <div className="drawer-subtitle">{selected.name}</div>
              </div>
              <button className="btn-close" type="button" onClick={closeEditStock} aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="drawer-section">
              <div className="auth-hint" style={{ marginBottom: 10 }}>
                Stock actuel : <strong>{selected.stock_quantity}</strong>
              </div>

              <label className="auth-label">
                Action
                <select className="auth-input" value={mode} onChange={(e) => setMode(e.target.value as 'ADD' | 'SET')}>
                  <option value="ADD">Ajouter au stock</option>
                  <option value="SET">Remplacer le stock</option>
                </select>
              </label>

              <label className="auth-label">
                {mode === 'ADD' ? 'Quantité à ajouter' : 'Nouveau stock'}
                <input
                  className="auth-input"
                  type="number"
                  min={0}
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  placeholder={mode === 'ADD' ? 'Ex: 10' : 'Ex: 50'}
                />
              </label>

              <div className="auth-hint" style={{ marginTop: 6 }}>
                Résultat :{' '}
                <strong>
                  {mode === 'ADD' ? selected.stock_quantity + (Number(newQty) || 0) : Number(newQty) || 0}
                </strong>
              </div>

              <button className="auth-submit" type="button" onClick={saveStock} disabled={savingStock}>
                {savingStock ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Create product modal --- */}
      {createModalOpen && (
        <div className="drawer-backdrop" onClick={closeCreateProduct} role="presentation">
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-header">
              <div>
                <div className="drawer-title">Nouveau produit</div>
                <div className="drawer-subtitle">Créer un produit dans le catalogue</div>
              </div>
              <button className="btn-close" type="button" onClick={closeCreateProduct} aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="drawer-section">
              <label className="auth-label">
                SKU
                <input className="auth-input" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Ex: TEA-001" />
              </label>

              <label className="auth-label">
                Nom
                <input className="auth-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Thé vert bio 100g" />
              </label>

              <label className="auth-label">
                Prix (€) (optionnel)
                <input className="auth-input" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex: 9.90" />
              </label>

              <label className="auth-label">
                Stock initial
                <input className="auth-input" type="number" min={0} value={initialStock} onChange={(e) => setInitialStock(e.target.value)} />
              </label>

              <button className="auth-submit" type="button" onClick={saveNewProduct} disabled={savingCreate || !canEdit}>
                {savingCreate ? 'Création…' : 'Créer'}
              </button>

              {!canEdit && (
                <div className="auth-hint" style={{ marginTop: 10 }}>
                  Ton rôle ({user?.role}) ne permet pas de créer des produits.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
