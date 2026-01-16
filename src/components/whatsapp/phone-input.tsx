'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

/**
 * Phone input component that formats and validates E.164 phone numbers.
 * Automatically adds country code prefix and formats as user types.
 */
export function PhoneInput({
  value,
  onChange,
  label = 'Telefono',
  placeholder = '+52 55 1234 5678',
  error,
  required = false,
  disabled = false,
  className,
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  // Format phone number for display
  useEffect(() => {
    if (value) {
      setDisplayValue(formatPhoneDisplay(value))
    } else {
      setDisplayValue('')
    }
  }, [value])

  // Format phone for display (add spaces for readability)
  function formatPhoneDisplay(phone: string): string {
    // Remove all non-digits except +
    const cleaned = phone.replace(/[^\d+]/g, '')

    // If starts with +, format accordingly
    if (cleaned.startsWith('+')) {
      const digits = cleaned.slice(1)
      if (digits.length <= 2) return cleaned
      if (digits.length <= 4) return `+${digits.slice(0, 2)} ${digits.slice(2)}`
      if (digits.length <= 7) return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`
      return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`
    }

    return phone
  }

  // Parse phone to E.164 format
  function parseToE164(input: string): string {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '')

    // If already has country code (starts with 52 for Mexico and is 12 digits)
    if (digits.length >= 12 && digits.startsWith('52')) {
      return `+${digits}`
    }

    // If 10 digits, assume Mexican number
    if (digits.length === 10) {
      return `+52${digits}`
    }

    // If more than 10 digits, assume it includes country code
    if (digits.length > 10) {
      return `+${digits}`
    }

    // Return as-is with + prefix
    return digits ? `+${digits}` : ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value

    // Allow typing freely
    setDisplayValue(input)

    // Parse to E.164 and notify parent
    const e164 = parseToE164(input)
    onChange(e164)
  }

  const handleBlur = () => {
    // Format on blur
    if (value) {
      setDisplayValue(formatPhoneDisplay(value))
    }
  }

  // Validate E.164 format
  const isValidE164 = /^\+[1-9]\d{6,14}$/.test(value)

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="phone-input">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Input
        id="phone-input"
        type="tel"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          error && 'border-destructive focus-visible:ring-destructive'
        )}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {value && !isValidE164 && !error && (
        <p className="text-sm text-muted-foreground">
          Formato esperado: +52 55 1234 5678
        </p>
      )}
    </div>
  )
}
