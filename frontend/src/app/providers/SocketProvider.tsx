/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../../store/auth.store'

export const SocketContext = createContext<Socket | null>(null)

export const useSocketContext = () => useContext(SocketContext)

function getSocketUrl(): string {
  return import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_BACKEND_URL?.replace('/api/v1', '') || 'http://localhost:2001'
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const userId = useAuthStore((s) => s.user?.id ?? null)

  useEffect(() => {
    const newSocket = io(getSocketUrl(), {
      transports: ['websocket'],
      withCredentials: true,
      auth: userId ? { userId } : undefined,
    })

    if (userId) {
      newSocket.emit('presence:join', { userId })
      const heartbeat = window.setInterval(() => newSocket.emit('presence:heartbeat'), 30000)
      const onUnload = () => newSocket.emit('presence:leave')
      window.addEventListener('beforeunload', onUnload)
      // Socket is an external system; publishing it to React state requires setState here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocket(newSocket)
      return () => {
        window.clearInterval(heartbeat)
        window.removeEventListener('beforeunload', onUnload)
        newSocket.disconnect()
        setSocket(null)
      }
    }

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      setSocket(null)
    }
  }, [userId])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}
