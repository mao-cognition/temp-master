import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApiContext } from './api/ApiContext'
import { loadApiClient } from './api/client'
import App from './App'
import './index.css'
import { ThemeProvider } from './theme/ThemeProvider'

void loadApiClient().then((client) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ApiContext.Provider value={client}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ApiContext.Provider>
    </StrictMode>,
  )
})
