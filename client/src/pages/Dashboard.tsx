import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import type { Order, OrderDetail, Product } from '../lib/api'
import { ErrorState, Loading } from '../components/State'

const STOCK_THRESHOLD = 15
const REVENUE_SAMPLE = 10

function statusLabel(status: string) {
  const s = (status || '').toUpperCase()
  if (s === 'PENDING') return 'En attente'
  if (s === 'PREPARING') return 'En préparation'
  if (s === 'SHIPPED') return 'Expédiée'
  if (s === 'DELIVERED') return 'Livrée'
  return status || '—'
}

function badgeClass(status: string) {
  const s = (status || '').toUpperCase()
  if (s === 'PENDING') return 'badge badge--pending'
  if (s === 'PREPARING') return 'badge badge--preparing'
  if (s === 'SHIPPED') return 'badge badge--shipped'
  if (s === 'DELIVERED') return 'badge badge--delivered'
  return 'badge'
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(d)
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function computeOrderTotal(order: OrderDetail): number {
  return (order.lines || []).reduce((sum, l) => sum + Number(l.price || 0) * Number(l.quantity || 0), 0)
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [revenue, setRevenue] = useState<number | null>(null)
  const [revenueNote, setRevenueNote] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [o, p] = await Promise.all([api.orders(), api.products()])
        if (!alive) return
        setOrders(o)
        setProducts(p)

        // Estimation CA: on calcule sur un échantillon de commandes récentes
        const sample = o.slice(0, REVENUE_SAMPLE)
        if (sample.length === 0) {
          setRevenue(0)
          setRevenueNote(null)
          return
        }

        const details = await Promise.all(sample.map((x) => api.orderById(x.id).catch(() => null)))
        if (!alive) return

        const valid = details.filter(Boolean) as OrderDetail[]
        const total = valid.reduce((sum, od) => sum + computeOrderTotal(od), 0)
        setRevenue(total)
        setRevenueNote(
          valid.length < o.length
            ? `Calculé sur ${valid.length} commande(s) récente(s) (sur ${o.length}).`
            : null
        )
      } catch (e: any) {
        if (!alive) return
        setError(e?.message || 'Impossible de charger le tableau de bord')
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const kpis = useMemo(() => {
    const today = new Date()
    const pending = orders.filter((o) => (o.status || '').toUpperCase() === 'PENDING').length
    const preparing = orders.filter((o) => (o.status || '').toUpperCase() === 'PREPARING').length
    const shippedToday = orders.filter((o) => {
      const s = (o.status || '').toUpperCase()
      if (s !== 'SHIPPED') return false
      const d = new Date(o.created_at)
      return !Number.isNaN(d.getTime()) && sameDay(d, today)
    }).length
    const lowStock = products.filter((p) => p.stock_quantity < STOCK_THRESHOLD).length

    return { pending, preparing, shippedToday, lowStock }
  }, [orders, products])

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders])
  const stockAlerts = useMemo(
    () => products.filter((p) => p.stock_quantity < STOCK_THRESHOLD).slice(0, 5),
    [products]
  )

  if (loading) return <Loading label="Chargement du tableau de bord…" />
  if (error) return <ErrorState message={error} />

  return (
    <>
      <h1 className="page-title">Tableau de bord</h1>

      <div className="cards-grid">
        <div className="card card-kpi">
          <div className="card-kpi-label">En attente</div>
          <div className="card-kpi-value">{kpis.pending}</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">En préparation</div>
          <div className="card-kpi-value">{kpis.preparing}</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Expédiées aujourd'hui</div>
          <div className="card-kpi-value">{kpis.shippedToday}</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Stock faible</div>
          <div className="card-kpi-value">{kpis.lowStock}</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">CA (estimation)</div>
          <div className="card-kpi-value">{revenue === null ? '—' : `${revenue.toFixed(2)}€`}</div>
          {revenueNote && <div className="card-kpi-note">{revenueNote}</div>}
        </div>
      </div>

      <div className="two-columns">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Commandes récentes</h2>
          </div>

          <ul className="list-orders">
            {recentOrders.map((o) => (
              <li className="order-row" key={o.id}>
                <div>
                  <div className="order-id">{o.external_reference}</div>
                  <div className="order-customer">
                    {o.customer_name || '—'} · {formatDate(o.created_at)}
                  </div>
                </div>
                <div className="order-right">
                  <span className={badgeClass(o.status)}>{statusLabel(o.status)}</span>
                  <span className="order-amount">ID {o.id}</span>
                </div>
              </li>
            ))}
            {recentOrders.length === 0 && <li className="table-sub-text">Aucune commande.</li>}
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Alertes stock</h2>
          </div>

          <ul className="list-alerts">
            {stockAlerts.map((p) => (
              <li className="alert-row" key={p.id}>
                <div>
                  <div className="alert-name">{p.name}</div>
                  <div className="alert-sku">SKU: {p.sku}</div>
                </div>
                <div className="alert-right">
                  <span className="badge badge--low-stock">Stock faible</span>
                  <span className="alert-stock">{p.stock_quantity} / {STOCK_THRESHOLD}</span>
                </div>
              </li>
            ))}
            {stockAlerts.length === 0 && <li className="table-sub-text">Aucune alerte.</li>}
          </ul>
        </div>
      </div>
    </>
  )
}
