import { USE_MOCK } from '../config'
import { ThemeSwitcher } from './ThemeSwitcher'

export function Navbar({ connected }: { connected: boolean }) {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <a className="navbar__brand" href="/">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Temp Master Dashboard
        </a>
        <nav className="navbar__nav">
          <a className="navbar__link navbar__link--active" href="/" aria-current="page">
            Dashboard
          </a>
        </nav>
        <div className="navbar__right">
          {USE_MOCK && <span className="badge badge--mock">MOCK DATA</span>}
          <ThemeSwitcher />
          <span
            id="connection-status"
            className={`badge ${connected ? 'badge--success' : 'badge--danger'}`}
            role="status"
          >
            <span className="badge__dot" aria-hidden="true" />
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  )
}
