import { useMemo, useState } from 'react'

type OrderStatus = 'pending' | 'preparing' | 'shipped' | 'delivered'

type Order = {
  id: string
  customer: string
  email: string
  date: string
  amount: string
  status: OrderStatus
  carrier?: string
  tracking?: string
}

const ORDERS: Order[] = [
  { id: 'CMD-2024-001', customer: 'Sophie Martin', email: 'sophie.martin@email.fr', date: '15/12/2024 09:30', amount: '29.90€', status: 'pending' },
  { id: 'CMD-2024-002', customer: 'Jean Dupont', email: 'jean.dupont@email.fr', date: '15/12/2024 10:15', amount: '29.40€', status: 'preparing' },
  { id: 'CMD-2024-003', customer: 'Marie Leclerc', email: 'marie.leclerc@email.fr', date: '14/12/2024 15:20', amount: '24.00€', status: 'shipped', carrier: 'Colissimo', tracking: '8L12345678901' },
  { id: 'CMD-2024-004', customer: 'Pierre Bernard', email: 'pierre.bernard@email.fr', date: '14/12/2024 12:00', amount: '45.40€', status: 'shipped', carrier: 'Mondial Relay', tracking: 'MR9876543210' },
  { id: 'CMD-2024-005', customer: 'Claire Moreau', email: 'claire.moreau@email.fr', date: '13/12/2024 11:30', amount: '13.00€', status: 'delivered', carrier: 'Colissimo', tracking: '8L98765432109' },
  { id: 'CMD-2024-006', customer: 'Thomas Rousseau', email: 'thomas.rousseau@email.fr', date: '15/12/2024 11:45', amount: '45.10€', status: 'pending' },
]

function statusBadge(status: OrderStatus) {
  if (status === 'pending') return <span className="badge badge--pending">En attente</span>
  if (status === 'preparing') return <span className="badge badge--preparing">En préparation</span>
  if (status === 'shipped') return <span className="badge badge--shipped">Expédiée</span>
  return <span className="badge badge--delivered">Livrée</span>
}

export default function Orders() {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return ORDERS.filter((o) => {
      const matchFilter = filter === 'all' ? true : o.status === filter
      const matchQuery =
        !query ||
        o.id.toLowerCase().includes(query) ||
        o.customer.toLowerCase().includes(query) ||
        o.email.toLowerCase().includes(query)
      return matchFilter && matchQuery
    })
  }, [q, filter])

  const counts = useMemo(() => {
    const c = { all: ORDERS.length, pending: 0, preparing: 0, shipped: 0, delivered: 0 }
    for (const o of ORDERS) c[o.status]++
    return c
  }, [])

  return (
    <>
      <h1 className="page-title">Commandes</h1>

      <div className="toolbar">
        <input
          type="search"
          className="search-input"
          placeholder="Rechercher par numéro, client, email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="toolbar-filters">
          <button className={`filter-pill ${filter === 'all' ? 'filter-pill--active' : ''}`} onClick={() => setFilter('all')}>
            Tous ({counts.all})
          </button>
          <button className={`filter-pill ${filter === 'pending' ? 'filter-pill--active' : ''}`} onClick={() => setFilter('pending')}>
            En attente ({counts.pending})
          </button>
          <button className={`filter-pill ${filter === 'preparing' ? 'filter-pill--active' : ''}`} onClick={() => setFilter('preparing')}>
            En préparation ({counts.preparing})
          </button>
          <button className={`filter-pill ${filter === 'shipped' ? 'filter-pill--active' : ''}`} onClick={() => setFilter('shipped')}>
            Expédiées ({counts.shipped})
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Transporteur</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>
                    <div className="table-main-text">{o.customer}</div>
                    <div className="table-sub-text">{o.email}</div>
                  </td>
                  <td>{o.date}</td>
                  <td>{o.amount}</td>
                  <td>{statusBadge(o.status)}</td>
                  <td>
                    {o.carrier ? (
                      <>
                        {o.carrier}
                        <br />
                        <span className="table-sub-text">{o.tracking}</span>
                      </>
                    ) : (
                      '–'
                    )}
                  </td>
                  <td>
                    <button className="btn-ghost" type="button" onClick={() => alert(`Détails: ${o.id}`)}>
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
    </>
  )
}
