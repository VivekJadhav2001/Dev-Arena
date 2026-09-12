import React from 'react'
import './index.css'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from 'react'
import routes from './app/routes'
import { AuthProvider } from './app/providers/AuthProvider'
import { SocketProvider } from './app/providers/SocketProvider'

// Code-split: three.js stays out of the initial bundle.
const ParticleBackground = lazy(() =>
  import('./components/effects/ParticleBackground').then((module) => ({
    default: module.ParticleBackground,
  })),
)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <Suspense fallback={null}>
          <ParticleBackground />
        </Suspense>
        <div className="relative z-10">
          <RouterProvider router={createBrowserRouter(routes)} />
        </div>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
)
