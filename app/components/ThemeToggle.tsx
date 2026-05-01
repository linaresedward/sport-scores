'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      document.documentElement.classList.add('dark')
      setDark(true)
    }
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      onClick={toggle}
      title={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      style={{
        width: 36, height: 20, borderRadius: 10,
        border: 'none', cursor: 'pointer', flexShrink: 0,
        background: dark ? '#3b82f6' : '#e2e8f0',
        position: 'relative', transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: '50%',
        background: '#ffffff', position: 'absolute', top: 3,
        left: dark ? 'calc(100% - 17px)' : '3px',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}