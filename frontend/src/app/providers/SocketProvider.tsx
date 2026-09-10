import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export const SocketContext = createContext<Socket | null>(null)

export const useSocketContext = () => useContext(SocketContext)

function getSocketUrl(): string {
  return import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_BACKEND_URL?.replace('/api/v1', '') || 'http://localhost:2001'
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const newSocket = io(getSocketUrl(), {
      transports: ['websocket'],
      withCredentials: true,
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}
