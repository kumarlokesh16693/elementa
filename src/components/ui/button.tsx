/**
 * Button — pure Tailwind component (shadcn/radix/class-variance-authority
 * removed per the Tailwind-only rule). Same props surface the app uses:
 * `variant`, `size`, className merging, and all native button attributes.
 */
import { cn } from '@/lib/utils'

type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type Size = 'default' | 'sm' | 'lg' | 'icon'

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all ' +
  'disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ' +
  'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

const VARIANTS: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
  destructive: 'bg-destructive text-white shadow-xs hover:bg-destructive/90',
  outline:
    'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
}

const SIZES: Record<Size, string> = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 gap-1.5 rounded-md px-3',
  lg: 'h-10 rounded-md px-6',
  icon: 'size-9',
}

export type ButtonProps = {
  className?: string
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: (e: any) => void
  children?: any
  [key: string]: any
}

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  )
}

export function buttonVariants(opts: { variant?: Variant; size?: Size; className?: string } = {}): string {
  return cn(BASE, VARIANTS[opts.variant ?? 'default'], SIZES[opts.size ?? 'default'], opts.className)
}
