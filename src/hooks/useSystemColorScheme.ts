import { useEffect, useState } from 'react'

export type ColorScheme = 'light' | 'dark'

function readScheme(): ColorScheme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function useSystemColorScheme(): ColorScheme {
  const [scheme, setScheme] = useState<ColorScheme>(readScheme)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setScheme(readScheme())
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return scheme
}
