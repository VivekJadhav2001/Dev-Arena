import React from 'react'
import './index.css'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import routes from './app/routes'
import { AuthProvider } from './app/providers/AuthProvider'
import { SocketProvider } from './app/providers/SocketProvider'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <RouterProvider router={createBrowserRouter(routes)} />
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
)
