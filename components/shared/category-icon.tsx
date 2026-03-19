'use client'

import {
  Utensils, Car, Home, HeartPulse, Gamepad2, GraduationCap,
  ShoppingBag, Wallet, Briefcase, TrendingUp, Ellipsis,
  Coffee, Phone, Wifi, Music, Film, Plane, Gift,
  Book, Shirt, Dumbbell, Pill, Baby, Dog, Cat,
  CreditCard, Banknote, PiggyBank, Receipt, Calculator
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'utensils': Utensils,
  'car': Car,
  'home': Home,
  'heart-pulse': HeartPulse,
  'gamepad-2': Gamepad2,
  'graduation-cap': GraduationCap,
  'shopping-bag': ShoppingBag,
  'wallet': Wallet,
  'briefcase': Briefcase,
  'trending-up': TrendingUp,
  'ellipsis': Ellipsis,
  'coffee': Coffee,
  'phone': Phone,
  'wifi': Wifi,
  'music': Music,
  'film': Film,
  'plane': Plane,
  'gift': Gift,
  'book': Book,
  'shirt': Shirt,
  'dumbbell': Dumbbell,
  'pill': Pill,
  'baby': Baby,
  'dog': Dog,
  'cat': Cat,
  'credit-card': CreditCard,
  'banknote': Banknote,
  'piggy-bank': PiggyBank,
  'receipt': Receipt,
  'calculator': Calculator,
}

interface CategoryIconProps {
  icon: string
  color?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CategoryIcon({ icon, color, className, size = 'md' }: CategoryIconProps) {
  const IconComponent = iconMap[icon] || Ellipsis
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <IconComponent 
      className={cn(sizeClasses[size], className)} 
      style={color ? { color } : undefined}
    />
  )
}

interface CategoryBadgeProps {
  icon: string
  color: string
  name: string
  className?: string
}

export function CategoryBadge({ icon, color, name, className }: CategoryBadgeProps) {
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className
      )}
      style={{ 
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      <CategoryIcon icon={icon} size="sm" />
      {name}
    </div>
  )
}
