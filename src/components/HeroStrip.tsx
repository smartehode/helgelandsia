'use client'
import { useEffect, useState } from 'react'

interface Item {
  label: string
  value: string
}

interface Props {
  items: Item[]
}

export function HeroStrip({ items }: Props) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (items.length < 2) return
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % items.length)
        setVisible(true)
      }, 250)
    }, 5000)
    return () => clearInterval(id)
  }, [items.length])

  if (!items.length) return null
  const item = items[idx]

  return (
    <span
      className="transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {item.label} <strong className="font-semibold text-ink">{item.value}</strong>
    </span>
  )
}
