import { useState, useEffect } from 'react'

const STORAGE_KEY = 'verdant-session-token'

export function useSessionToken(): [string, (token: string) => void] {
  const [token, setToken] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
    const newToken = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, newToken)
    return newToken
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, token)
  }, [token])

  return [token, setToken]
}
