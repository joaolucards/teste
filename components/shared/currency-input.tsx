'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function CurrencyInput({ 
  value, 
  onChange, 
  className,
  placeholder = "0,00",
  disabled
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    if (value) {
      setDisplayValue(formatToDisplay(value))
    } else {
      setDisplayValue('')
    }
  }, [value])

  const formatToDisplay = (val: number) => {
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const parseFromDisplay = (val: string) => {
    // Remove tudo exceto números
    const numbers = val.replace(/\D/g, '')
    if (!numbers) return 0
    // Divide por 100 para ter os centavos
    return parseInt(numbers, 10) / 100
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const numericValue = parseFromDisplay(rawValue)
    setDisplayValue(formatToDisplay(numericValue))
    onChange(numericValue)
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        R$
      </span>
      <Input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pl-9", className)}
      />
    </div>
  )
}
