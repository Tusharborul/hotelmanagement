import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ToastProvider from './components/ToastProvider'
import ConfirmProvider from './components/ConfirmProvider'
import LoadingProvider from './components/LoadingProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoadingProvider>
      <ToastProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </ToastProvider>
    </LoadingProvider>
  </StrictMode>,
)
