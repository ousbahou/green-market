export default function Dashboard() {
  return (
    <>
      <h1 className="page-title">Tableau de bord</h1>

      <div className="cards-grid">
        <div className="card card-kpi">
          <div className="card-kpi-label">En attente</div>
          <div className="card-kpi-value">2</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">En préparation</div>
          <div className="card-kpi-value">1</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Expédiées aujourd&apos;hui</div>
          <div className="card-kpi-value">0</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Stock faible</div>
          <div className="card-kpi-value">3</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">CA total</div>
          <div className="card-kpi-value">186.80€</div>
        </div>
      </div>

      <div className="two-columns">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Commandes récentes</h2>
          </div>

          <ul className="list-orders">
            {[
              { id: 'CMD-2024-006', name: 'Thomas Rousseau', dt: '15/12 11:45', status: 'pending', amount: '45.10€' },
              { id: 'CMD-2024-002', name: 'Jean Dupont', dt: '15/12 10:15', status: 'preparing', amount: '29.40€' },
              { id: 'CMD-2024-001', name: 'Sophie Martin', dt: '15/12 09:30', status: 'pending', amount: '29.90€' },
              { id: 'CMD-2024-003', name: 'Marie Leclerc', dt: '14/12 15:20', status: 'shipped', amount: '24.00€' },
              { id: 'CMD-2024-004', name: 'Pierre Bernard', dt: '14/12 12:00', status: 'shipped', amount: '45.40€' },
            ].map((o) => (
              <li className="order-row" key={o.id}>
                <div>
                  <div className="order-id">{o.id}</div>
                  <div className="order-customer">
                    {o.name} · {o.dt}
                  </div>
                </div>
                <div className="order-right">
                  <span
                    className={
                      o.status === 'pending'
                        ? 'badge badge--pending'
                        : o.status === 'preparing'
                        ? 'badge badge--preparing'
                        : 'badge badge--shipped'
                    }
                  >
                    {o.status === 'pending' ? 'En attente' : o.status === 'preparing' ? 'En préparation' : 'Expédiée'}
                  </span>
                  <span className="order-amount">{o.amount}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Alertes stock</h2>
          </div>

          <ul className="list-alerts">
            {[
              { name: 'Confiture fraise bio 250g', sku: 'JAM-001', qty: '5 / 15' },
              { name: "Huile d'olive bio 500ml", sku: 'OIL-001', qty: '8 / 10' },
              { name: 'Miel de lavande 250g', sku: 'HON-001', qty: '12 / 15' },
            ].map((p) => (
              <li className="alert-row" key={p.sku}>
                <div>
                  <div className="alert-name">{p.name}</div>
                  <div className="alert-sku">SKU: {p.sku}</div>
                </div>
                <div className="alert-right">
                  <span className="badge badge--low-stock">Stock faible</span>
                  <span className="alert-stock">{p.qty}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
