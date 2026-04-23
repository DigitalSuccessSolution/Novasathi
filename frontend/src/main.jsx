import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './store'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { CallProvider } from './context/CallContext'
import { ChatProvider } from './context/ChatContext'
import { NotificationProvider } from './context/NotificationContext'
import { BrowserRouter } from 'react-router-dom'
import { setupInterceptors } from './lib/api'
import './index.css'
import App from './App.jsx'

// Initialize Axios Interceptors with Redux store
setupInterceptors(store);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <CallProvider>
              <ChatProvider>
                <App />
              </ChatProvider>
            </CallProvider>
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </Provider>
  </StrictMode>,
)
