import { APP_VERSION } from '../config'

export function Footer() {
  return (
    <footer className="footer">
      Temp Master Dashboard v{APP_VERSION} - Built with React 19 + Vite + TypeScript + Chart.js 4
    </footer>
  )
}
