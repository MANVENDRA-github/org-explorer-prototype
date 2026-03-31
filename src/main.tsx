import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '@/App'
import '@/styles/global.css'

function syncDocumentColorScheme() {
  const apply = () => {
    const light = window.matchMedia('(prefers-color-scheme: light)').matches
    const scheme = light ? 'light' : 'dark'
    document.documentElement.setAttribute('data-color-scheme', scheme)
    document.documentElement.style.colorScheme = scheme
  }
  apply()
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', apply)
}

syncDocumentColorScheme()

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
