'use client'
import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore, AppStore } from '../redux/store'
import { logout, setCredentials } from '../redux/slices/authSlice'

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
    const storedUser = localStorage.getItem('user');
    if (token) {
      let user = undefined;
      if(storedUser) {
        try {
          user = JSON.parse(storedUser);
        } catch (error) {
          console.log(error);
        }
      }
      storeRef.current?.dispatch(setCredentials({token, user}))
    } else {
      storeRef.current?.dispatch(logout())
    }
  }, [])

  return <Provider store={storeRef.current}>{children}</Provider>
}