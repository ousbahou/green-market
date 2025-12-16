export default function Stocks() {
  return (
    <>
      <h1 className="page-title">Stocks</h1>

      <div className="cards-grid">
        <div className="card card-kpi">
          <div className="card-kpi-label">Total produits</div>
          <div className="card-kpi-value">8</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Stock faible</div>
          <div className="card-kpi-value">3</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Rupture de stock</div>
          <div className="card-kpi-value">0</div>
        </div>
        <div className="card card-kpi">
          <div className="card-kpi-label">Valeur stock</div>
          <div className="card-kpi-value">2630.70€</div>
        </div>
      </div>

      <div className="toolbar">
        <input type="search" className="search-input" placeholder="Rechercher par nom ou SKU..." />
        <div className="toolbar-filters">
          <button className="filter-pill filter-pill--active">Tous</button>
          <button className="filter-pill">Stock faible</button>
          <button className="filter-pill">Stock OK</button>
        </div>
      </div>

      <div className="stock-grid">
        <article className="card stock-card stock-card--ok">
          <header className="stock-card-header">
            <div>
              <div className="stock-name">Thé vert bio 100g</div>
              <div className="stock-meta">SKU: TEA-001 · Prix: 8.50€</div>
            </div>
            <span className="badge badge--stock-ok">OK</span>
          </header>
          <div className="stock-bar">
            <div className="stock-bar-fill" style={{ width: '70%' }} />
          </div>
          <footer className="stock-footer">
            <span>
              Stock: <strong>45</strong> unités
            </span>
            <span>Seuil d&apos;alerte: 20</span>
          </footer>
        </article>

        <article className="card stock-card stock-card--warning">
          <header className="stock-card-header">
            <div>
              <div className="stock-name">Miel de lavande 250g</div>
              <div className="stock-meta">SKU: HON-001 · Prix: 12.90€</div>
            </div>
            <span className="badge badge--low-stock">Faible</span>
          </header>
          <div className="stock-bar">
            <div className="stock-bar-fill stock-bar-fill--warning" style={{ width: '40%' }} />
          </div>
          <footer className="stock-footer">
            <span>
              Stock: <strong>12</strong> unités
            </span>
            <span>Seuil d&apos;alerte: 15</span>
          </footer>
          <div className="stock-alert">Le stock est en dessous du seuil d&apos;alerte. Pensez à réapprovisionner.</div>
        </article>

        <article className="card stock-card stock-card--ok">
          <header className="stock-card-header">
            <div>
              <div className="stock-name">Café équitable 250g</div>
              <div className="stock-meta">SKU: COF-001 · Prix: 9.80€</div>
            </div>
            <span className="badge badge--stock-ok">OK</span>
          </header>
          <div className="stock-bar">
            <div className="stock-bar-fill" style={{ width: '80%' }} />
          </div>
          <footer className="stock-footer">
            <span>
              Stock: <strong>67</strong> unités
            </span>
            <span>Seuil d&apos;alerte: 25</span>
          </footer>
        </article>

        <article className="card stock-card stock-card--warning">
          <header className="stock-card-header">
            <div>
              <div className="stock-name">Huile d&apos;olive bio 500ml</div>
              <div className="stock-meta">SKU: OIL-001 · Prix: 15.50€</div>
            </div>
            <span className="badge badge--low-stock">Faible</span>
          </header>
          <div className="stock-bar">
            <div className="stock-bar-fill stock-bar-fill--warning" style={{ width: '30%' }} />
          </div>
          <footer className="stock-footer">
            <span>
              Stock: <strong>8</strong> unités
            </span>
            <span>Seuil d&apos;alerte: 10</span>
          </footer>
          <div className="stock-alert">Le stock est en dessous du seuil d&apos;alerte. Pensez à réapprovisionner.</div>
        </article>
      </div>
    </>
  )
}
