export default function Stats() {
  return (
    <>
      <h1 className="page-title">Statistiques</h1>

      <div className="cards-grid">
        <div className="card card-kpi">
          <div className="card-kpi-label">Total commandes</div>
          <div className="card-kpi-value">6</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Chiffre d&apos;affaires</div>
          <div className="card-kpi-value">187€</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Panier moyen</div>
          <div className="card-kpi-value">31.13€</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Taux de livraison</div>
          <div className="card-kpi-value">16.7%</div>
        </div>
      </div>

      <div className="stats-grid">
        <article className="card">
          <header className="card-header">
            <h2 className="card-title">Évolution des commandes (7 jours)</h2>
          </header>
          <div className="chart chart-line-placeholder">
            <span>Graphique ligne (placeholder)</span>
          </div>
        </article>

        <article className="card">
          <header className="card-header">
            <h2 className="card-title">Répartition par statut</h2>
          </header>
          <div className="chart chart-pie">
            <div className="chart-pie-visual" />
            <ul className="chart-legend">
              <li>
                <span className="legend-dot legend-dot--pending" />
                En attente (33%)
              </li>
              <li>
                <span className="legend-dot legend-dot--preparing" />
                En préparation (17%)
              </li>
              <li>
                <span className="legend-dot legend-dot--shipped" />
                Expédiée (33%)
              </li>
              <li>
                <span className="legend-dot legend-dot--delivered" />
                Livrée (17%)
              </li>
            </ul>
          </div>
        </article>

        <article className="card">
          <header className="card-header">
            <h2 className="card-title">Top 5 produits (CA)</h2>
          </header>
          <div className="chart chart-bars">
            {[
              { label: 'Thé vert bio 100g', w: 90 },
              { label: 'Café équitable 250g', w: 80 },
              { label: 'Miel de lavande 250g', w: 60 },
              { label: 'Chocolat noir 70% bio 100g', w: 40 },
              { label: "Huile d'olive bio 500ml", w: 30 },
            ].map((b) => (
              <div className="bar-row" key={b.label}>
                <span className="bar-label">{b.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${b.w}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <header className="card-header">
            <h2 className="card-title">Répartition par transporteur</h2>
          </header>
          <div className="chart chart-pie">
            <div className="chart-pie-visual chart-pie-visual--two" />
            <ul className="chart-legend">
              <li>
                <span className="legend-dot legend-dot--colissimo" />
                Colissimo (67%)
              </li>
              <li>
                <span className="legend-dot legend-dot--mondial" />
                Mondial Relay (33%)
              </li>
            </ul>
          </div>
        </article>
      </div>
    </>
  )
}
