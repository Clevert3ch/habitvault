import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Providers } from './app/providers'
import Router from './app/Router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <Router />
      </Providers>
    </BrowserRouter>
  </StrictMode>
)