import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import type { Order, OrderDetail } from '../lib/api'
import { ErrorState, Loading } from '../components/State'
import { getUser } from '../lib/auth'

type StatusKey = 'PENDING' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | string

function badgeClass(status: StatusKey) {
  const s = (status || '').toUpperCase()
  if (s === 'PENDING') return 'badge badge--pending'
  if (s === 'PREPARING') return 'badge badge--preparing'
  if (s === 'SHIPPED') return 'badge badge--shipped'
  if (s === 'DELIVERED') return 'badge badge--delivered'
  return 'badge'
}

function statusLabel(status: StatusKey) {
  const s = (status || '').toUpperCase()
  if (s === 'PENDING') return 'En attente'
  if (s === 'PREPARING') return 'En préparation'
  if (s === 'SHIPPED') return 'Expédiée'
  if (s === 'DELIVERED') return 'Livrée'
  return status || '—'
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(d)
}

function computeOrderTotal(order: OrderDetail): number {
  return (order.lines || []).reduce((sum, l) => sum + Number(l.price || 0) * Number(l.quantity || 0), 0)
}

export default function Orders() {
  const user = getUser()
  const canEdit = user?.role === 'ADMIN' || user?.role === 'LOGISTICS'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'PREPARING' | 'SHIPPED' | 'DELIVERED'>('all')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detail, setDetail] = useState<OrderDetail | null>(null)

  const [editStatus, setEditStatus] = useState('')
  const [editTracking, setEditTracking] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadOrders() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.orders()
      setOrders(data)
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger les commandes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  type Status = 'PENDING' | 'PREPARING' | 'SHIPPED' | 'DELIVERED'


  function isStatus(v: string): v is Status {
  return v === 'PENDING' || v === 'PREPARING' || v === 'SHIPPED' || v === 'DELIVERED'
}
const counts = useMemo(() => {
  const c: Record<'all' | Status, number> = {
    all: orders.length,
    PENDING: 0,
    PREPARING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
  }

  for (const o of orders) {
    const s = (o.status || '').toUpperCase()
    if (isStatus(s)) c[s] += 1
  }

  return c
}, [orders])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      const s = (o.status || '').toUpperCase()
      const okFilter = filter === 'all' ? true : s === filter
      const okQuery =
        !q ||
        o.external_reference?.toLowerCase().includes(q) ||
        String(o.id).includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q)
      return okFilter && okQuery
    })
  }, [orders, query, filter])

  async function openDetails(id: number) {
    setDrawerOpen(true)
    setSelectedId(id)
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)
    try {
      const d = await api.orderById(id)
      setDetail(d)
      setEditStatus((d.status || '').toUpperCase())
      setEditTracking(d.tracking_number || '')
    } catch (e: any) {
      setDetailError(e?.message || 'Impossible de charger le détail')
    } finally {
      setDetailLoading(false)
    }
  }

  function closeDetails() {
    setDrawerOpen(false)
    setSelectedId(null)
    setDetail(null)
    setDetailError(null)
  }

  async function saveUpdate() {
    if (!detail || !canEdit) return
    setSaving(true)
    try {
      await api.updateOrder(detail.id, {
        status: editStatus || undefined,
        tracking_number: editTracking || undefined,
      })
      await loadOrders()
      const refreshed = await api.orderById(detail.id)
      setDetail(refreshed)
    } catch (e: any) {
      setDetailError(e?.message || 'Échec de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h1 className="page-title">Commandes</h1>

      <div className="toolbar">
        <input
          type="search"
          className="search-input"
          placeholder="Rechercher par référence, id, client..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="toolbar-filters">
          <button className={`filter-pill ${filter === 'all' ? 'filter-pill--active' : ''}`} onClick={() => setFilter('all')}>
            Tous ({counts.all})
          </button>
          <button
            className={`filter-pill ${filter === 'PENDING' ? 'filter-pill--active' : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            En attente ({counts.PENDING})
          </button>
          <button
            className={`filter-pill ${filter === 'PREPARING' ? 'filter-pill--active' : ''}`}
            onClick={() => setFilter('PREPARING')}
          >
            En préparation ({counts.PREPARING})
          </button>
          <button
            className={`filter-pill ${filter === 'SHIPPED' ? 'filter-pill--active' : ''}`}
            onClick={() => setFilter('SHIPPED')}
          >
            Expédiées ({counts.SHIPPED})
          </button>
          <button
            className={`filter-pill ${filter === 'DELIVERED' ? 'filter-pill--active' : ''}`}
            onClick={() => setFilter('DELIVERED')}
          >
            Livrées ({counts.DELIVERED})
          </button>
        </div>
      </div>

      {loading ? (
        <Loading label="Chargement des commandes…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Tracking</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.external_reference}</td>
                    <td>{o.customer_name || '—'}</td>
                    <td>{formatDate(o.created_at)}</td>
                    <td>
                      <span className={badgeClass(o.status)}>{statusLabel(o.status)}</span>
                    </td>
                    <td>{o.tracking_number || '—'}</td>
                    <td>
                      <button className="btn-ghost" type="button" onClick={() => openDetails(o.id)}>
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="table-sub-text">
                      Aucun résultat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {drawerOpen && (
        <div className="drawer-backdrop" onClick={closeDetails} role="presentation">
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-header">
              <div>
                <div className="drawer-title">Détails commande</div>
                <div className="drawer-subtitle">ID: {selectedId}</div>
              </div>
              <button className="btn-close" type="button" onClick={closeDetails} aria-label="Fermer">
                ✕
              </button>
            </div>

            {detailLoading ? (
              <Loading label="Chargement du détail…" />
            ) : detailError ? (
              <ErrorState message={detailError} />
            ) : detail ? (
              <>
                <div className="drawer-section">
                  <div className="drawer-grid">
                    <div>
                      <div className="field-label">Référence</div>
                      <div className="field-value">{detail.external_reference}</div>
                    </div>
                    <div>
                      <div className="field-label">Client</div>
                      <div className="field-value">{detail.customer_name || '—'}</div>
                    </div>
                    <div>
                      <div className="field-label">Créée le</div>
                      <div className="field-value">{formatDate(detail.created_at)}</div>
                    </div>
                    <div>
                      <div className="field-label">Total</div>
                      <div className="field-value">{computeOrderTotal(detail).toFixed(2)} €</div>
                    </div>
                  </div>
                </div>

                <div className="drawer-section">
                  <div className="drawer-section-title">Lignes</div>
                  <div className="table-wrapper">
                    <table className="table table--compact">
                      <thead>
                        <tr>
                          <th>Qté</th>
                          <th>SKU</th>
                          <th>Produit</th>
                          <th>Prix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.lines.map((l) => (
                          <tr key={l.id}>
                            <td>{l.quantity}</td>
                            <td>{l.sku}</td>
                            <td>{l.name}</td>
                            <td>{Number(l.price).toFixed(2)} €</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="drawer-section">
                  <div className="drawer-section-title">Suivi & statut</div>

                  <div className="drawer-form">
                    <label className="auth-label">
                      Statut
                      <select
                        className="auth-input"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        disabled={!canEdit}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PREPARING">PREPARING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                      </select>
                    </label>

                    <label className="auth-label">
                      Tracking
                      <input
                        className="auth-input"
                        value={editTracking}
                        onChange={(e) => setEditTracking(e.target.value)}
                        disabled={!canEdit}
                        placeholder="Numéro de suivi (tracking_number)"
                      />
                    </label>

                    {!canEdit && (
                      <div className="auth-hint">
                        Ton rôle ({user?.role}) ne permet pas de modifier les commandes.
                      </div>
                    )}

                    {canEdit && (
                      <button className="auth-submit" type="button" onClick={saveUpdate} disabled={saving}>
                        {saving ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}
