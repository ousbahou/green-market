import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type LocationState = { from?: { pathname?: string } } | null

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState

  const redirectTo = useMemo(() => state?.from?.pathname || '/', [state])

  const [email, setEmail] = useState('admin@greenmarket.fr')
  const [password, setPassword] = useState('admin')
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // ✅ Front-only : identifiants mock (tu pourras brancher une API plus tard)
    const ok = email.trim().toLowerCase() === 'admin@greenmarket.fr' && password === 'admin'
    if (!ok) {
      setError('Identifiants incorrects. Essayez admin@greenmarket.fr / admin.')
      return
    }

    localStorage.setItem('gm_auth', '1')
    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="auth-brand">
          <div className="brand-icon">GM</div>
          <div>
            <div className="brand-title">Green Market</div>
            <div className="brand-subtitle">Connexion au back-office</div>
          </div>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="auth-label">
            Email
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="auth-label">
            Mot de passe
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" type="submit">
            Se connecter
          </button>

          <div className="auth-hint">
            Démo : <strong>admin@greenmarket.fr</strong> / <strong>admin</strong>
          </div>
        </form>
      </div>
    </div>
  )
}
