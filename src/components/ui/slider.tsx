/**
 * Slider — pure Tailwind component backed by the native
 * <input type="range"> (radix @radix-ui/react-slider removed per the
 * Tailwind-only rule).
 *
 * Contract parity with the app's usage:
 *   <Slider value={[v]} min max step disabled onValueChange={(vals) => …} />
 *
 * Styling: the native control honors `accent-color` — index.css sets the
 * amber accent globally, and the track/thumb inherit the dark chrome look.
 */
import { cn } from '@/lib/utils'

export type SliderProps = {
  className?: string
  value?: number[]
  defaultValue?: number[]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onValueChange?: (values: number[]) => void
}

export function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  onValueChange,
}: SliderProps) {
  const raw = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min]
  const val = Math.min(Math.max(raw[0] ?? min, min), max)

  return (
    <div data-slot="slider" data-orientation="horizontal" className={cn('relative flex w-full touch-none items-center select-none', className)} data-disabled={disabled || undefined}>
      <input
        type="range"
        data-slot="slider-track"
        min={min}
        max={max}
        step={step}
        value={val}
        disabled={disabled}
        aria-valuenow={val}
        aria-valuemin={min}
        aria-valuemax={max}
        onChange={(e) => onValueChange?.([Number(e.currentTarget.value)])}
        className={cn(
          'h-1.5 w-full cursor-pointer appearance-none rounded-full border-transparent bg-white/10',
          'accent-amber-500 outline-none disabled:pointer-events-none disabled:opacity-50',
        )}
      />
    </div>
  )
}
