'use client'
import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore, AppStore } from '../redux/store'
import { setToken } from '../redux/slices/authSlice'

export default function StoreProvider({
  children
}: {
  children: React.ReactNode
}) {
  const storeRef = useRef<AppStore | null>(null)
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore()
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      storeRef.current?.dispatch(setToken(token))
    }
  }, [])

  return <Provider store={storeRef.current}>{children}</Provider>
}