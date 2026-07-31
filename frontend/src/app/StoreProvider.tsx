'use client'
import { useEffect, useRef, useState } from 'react'
import { Provider } from 'react-redux'
import { makeStore, AppStore } from '../redux/store'
import { logout, setCredentials } from '../redux/slices/authSlice'

export default function StoreProvider({
  children
}: {
  children: React.ReactNode
}) {
  const storeRef = useRef<AppStore | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (!token) {
        storeRef.current?.dispatch(logout())
        setIsInitialized(true)
        return
      }

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          storeRef.current?.dispatch(setCredentials({ token, user: parsedUser }))
        } catch {
          localStorage.removeItem('user')
        }
      }

      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await res.json();
        if (res.ok) {
          const userObj = data.user || data.data || data
          localStorage.setItem('user', JSON.stringify(userObj))
          storeRef.current?.dispatch(setCredentials({ token, user: userObj }))
        } else {
          console.error('API responded with error status:', res.status)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          storeRef.current?.dispatch(logout())
        }
      } catch (err) {
        console.error('Failed to sync auth session:', err)
      } finally {
        setIsInitialized(true)
      }
    }

    initAuth()
  }, [])

  return (
    <Provider store={storeRef.current}>
      {isInitialized ? (
        children
      ) : (
        <div className="flex min-h-screen items-center justify-center bg-[#5a2c10] text-[#f9ecbf]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          SYNCING PROFILE...
        </div>
      )}
    </Provider>
  )
}