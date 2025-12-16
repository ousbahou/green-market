import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import type { Order, OrderDetail } from '../lib/api'
import { ErrorState, Loading } from '../components/State'

const SAMPLE_FOR_REVENUE = 25

function computeOrderTotal(order: OrderDetail): number {
  return (order.lines || []).reduce((sum, l) => sum + Number(l.price || 0) * Number(l.quantity || 0), 0)
}

function statusLabel(status: string) {
  const s = (status || '').toUpperCase()
  if (s === 'PENDING') return 'En attente'
  if (s === 'PREPARING') return 'En préparation'
  if (s === 'SHIPPED') return 'Expédiée'
  if (s === 'DELIVERED') return 'Livrée'
  return status || '—'
}

export default function Stats() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  const [revenue, setRevenue] = useState<number | null>(null)
  const [topProducts, setTopProducts] = useState<Array<{ name: string; revenue: number }>>([])
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const list = await api.orders()
        if (!alive) return
        setOrders(list)

        // Stats CA + top produits (échantillon)
        const sample = list.slice(0, SAMPLE_FOR_REVENUE)
        if (sample.length === 0) {
          setRevenue(0)
          setTopProducts([])
          setNote(null)
          return
        }

        const details = await Promise.all(sample.map((o) => api.orderById(o.id).catch(() => null)))
        if (!alive) return

        const valid = details.filter(Boolean) as OrderDetail[]
        const total = valid.reduce((sum, od) => sum + computeOrderTotal(od), 0)
        setRevenue(total)

        const byProduct = new Map<string, number>()
        for (const od of valid) {
          for (const l of od.lines) {
            const key = l.name || l.sku
            const v = Number(l.price || 0) * Number(l.quantity || 0)
            byProduct.set(key, (byProduct.get(key) || 0) + v)
          }
        }

        const top = Array.from(byProduct.entries())
          .map(([name, rev]) => ({ name, revenue: rev }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)

        setTopProducts(top)
        setNote(valid.length < list.length ? `Calculs effectués sur ${valid.length} commande(s) récente(s) (sur ${list.length}).` : null)
      } catch (e: any) {
        if (!alive) return
        setError(e?.message || 'Impossible de charger les statistiques')
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

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const o of orders) {
      const s = (o.status || 'UNKNOWN').toUpperCase()
      counts.set(s, (counts.get(s) || 0) + 1)
    }
    return counts
  }, [orders])

  const totals = useMemo(() => {
    const totalOrders = orders.length
    const avg = totalOrders > 0 && revenue !== null ? revenue / Math.min(totalOrders, SAMPLE_FOR_REVENUE) : null
    return { totalOrders, avg }
  }, [orders.length, revenue])

  if (loading) return <Loading label="Chargement des statistiques…" />
  if (error) return <ErrorState message={error} />

  const statusRows = Array.from(statusCounts.entries())
    .map(([status, count]) => ({ status, label: statusLabel(status), count }))
    .sort((a, b) => b.count - a.count)

  const maxTop = Math.max(1, ...topProducts.map((p) => p.revenue))

  return (
    <>
      <h1 className="page-title">Statistiques</h1>

      <div className="cards-grid">
        <div className="card card-kpi">
          <div className="card-kpi-label">Total commandes</div>
          <div className="card-kpi-value">{totals.totalOrders}</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Chiffre d'affaires (estimation)</div>
          <div className="card-kpi-value">{revenue === null ? '—' : `${revenue.toFixed(2)}€`}</div>
          {note && <div className="card-kpi-note">{note}</div>}
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Panier moyen (échantillon)</div>
          <div className="card-kpi-value">{totals.avg === null ? '—' : `${totals.avg.toFixed(2)}€`}</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Statuts distincts</div>
          <div className="card-kpi-value">{statusRows.length}</div>
        </div>
      </div>

      <div className="stats-grid">
        <article className="card">
          <header className="card-header">
            <h2 className="card-title">Répartition par statut</h2>
          </header>
          <div className="chart chart-bars">
            {statusRows.map((r) => {
              const pct = orders.length > 0 ? Math.round((r.count / orders.length) * 100) : 0
              return (
                <div className="bar-row" key={r.status}>
                  <span className="bar-label">{r.label} ({r.count})</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        <article className="card">
          <header className="card-header">
            <h2 className="card-title">Top 5 produits (CA estimé)</h2>
          </header>
          {topProducts.length === 0 ? (
            <div className="table-sub-text">Pas assez de données.</div>
          ) : (
            <div className="chart chart-bars">
              {topProducts.map((p) => {
                const pct = Math.round((p.revenue / maxTop) * 100)
                return (
                  <div className="bar-row" key={p.name}>
                    <span className="bar-label">{p.name}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="table-sub-text" style={{ marginLeft: 8 }}>{p.revenue.toFixed(2)}€</span>
                  </div>
                )
              })}
            </div>
          )}
        </article>
      </div>
    </>
  )
}
