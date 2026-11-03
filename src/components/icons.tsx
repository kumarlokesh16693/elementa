/**
 * Inline SVG icon set — replaces `lucide-react` per the Tailwind-only rule.
 * Simple 24×24 stroke geometry in the same visual language as lucide;
 * sized/positioned through Tailwind classes (`h-3.5 w-3.5` etc.).
 */
export type IconProps = {
  className?: string
  style?: any
  fill?: string
  stroke?: string
  [key: string]: any
}

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function Cpu(props: IconProps) {
  return (
    <Base {...props}>
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M15 2v2" /><path d="M15 20v2" />
      <path d="M9 2v2" /><path d="M9 20v2" />
      <path d="M2 15h2" /><path d="M2 9h2" />
      <path d="M20 15h2" /><path d="M20 9h2" />
    </Base>
  )
}

export function Pause(props: IconProps) {
  return (
    <Base fill="currentColor" stroke="none" {...props}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </Base>
  )
}

export function Play(props: IconProps) {
  return (
    <Base fill="currentColor" stroke="none" {...props}>
      <polygon points="6 3 20 12 6 21" />
    </Base>
  )
}

export function RotateCcw(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </Base>
  )
}

export function FileDown(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M12 18v-6" />
      <path d="m9 15 3 3 3-3" />
    </Base>
  )
}

export function CircleDot(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </Base>
  )
}
