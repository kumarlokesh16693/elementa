export type CategoryKey =
  | 'alkali'
  | 'alkaline'
  | 'transition'
  | 'post'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble'
  | 'lanthanide'
  | 'actinide'
  | 'unknown'

export type Phase = 'solid' | 'liquid' | 'gas' | 'unknown'

export type Block = 's' | 'p' | 'd' | 'f'

export interface ElementData {
  number: number
  symbol: string
  name: string
  mass: number
  category: CategoryKey
  /** IUPAC group 1-18; 0 for f-block inner transition series */
  group: number
  period: number
  /** grid column 1-18 */
  xpos: number
  /** grid row: 1-7 main table, 9-10 f-block rows */
  ypos: number
  /** Noble-gas shorthand electron configuration */
  config: string
  /** electrons per shell K,L,M,... (Bohr model) */
  shells: number[]
  /** Pauling electronegativity */
  electronegativity: number | null
  /** first ionization energy, eV */
  ionizationEnergy: number | null
  /** electron affinity, kJ/mol */
  electronAffinity: number | null
  /** atomic radius, pm (empirical; calculated for noble gases) */
  atomicRadius: number | null
  /** melting point, K */
  meltingPoint: number | null
  /** boiling point, K */
  boilingPoint: number | null
  /** density at STP, g/cm3 */
  density: number | null
  oxidationStates: string
  phase: Phase
  discoveredYear: number | null
  discoveredBy: string
  radioactive: boolean
  summary: string
}

export interface CategoryMeta {
  key: CategoryKey
  label: string
  color: string
  desc: string
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'alkali', label: 'Alkali metal', color: '#fb7185', desc: 'Group 1 (except H) — highly reactive, one valence s electron' },
  { key: 'alkaline', label: 'Alkaline earth', color: '#fb923c', desc: 'Group 2 — reactive metals with two valence s electrons' },
  { key: 'transition', label: 'Transition metal', color: '#22d3ee', desc: 'd-block — partially filled d subshells, variable oxidation states' },
  { key: 'post', label: 'Post-transition metal', color: '#94a3b8', desc: 'p-block metals — soft, low melting points relative to transition metals' },
  { key: 'metalloid', label: 'Metalloid', color: '#a3e635', desc: 'Intermediate properties between metals and nonmetals' },
  { key: 'nonmetal', label: 'Reactive nonmetal', color: '#4ade80', desc: 'p-block nonmetals — high electronegativity, covalent bonding' },
  { key: 'halogen', label: 'Halogen', color: '#fbbf24', desc: 'Group 17 — five valence p electrons, form salts with metals' },
  { key: 'noble', label: 'Noble gas', color: '#a78bfa', desc: 'Group 18 — closed shells, very low reactivity' },
  { key: 'lanthanide', label: 'Lanthanide', color: '#e879f9', desc: '4f series (57-71) — rare-earth metals' },
  { key: 'actinide', label: 'Actinide', color: '#f472b6', desc: '5f series (89-103) — all radioactive' },
  { key: 'unknown', label: 'Unknown / predicted', color: '#64748b', desc: 'Superheavy elements with largely predicted properties' },
]

export const CATEGORY_MAP: Record<CategoryKey, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
) as Record<CategoryKey, CategoryMeta>

/** K L M N O P Q shell letters */
export const SHELL_LETTERS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R']

export type ColorMode =
  | 'category'
  | 'block'
  | 'phase'
  | 'electronegativity'
  | 'ionizationEnergy'
  | 'atomicRadius'
  | 'density'
  | 'meltingPoint'

export const COLOR_MODES: { key: ColorMode; label: string }[] = [
  { key: 'category', label: 'Category' },
  { key: 'block', label: 'Orbital block' },
  { key: 'phase', label: 'Phase at STP' },
  { key: 'electronegativity', label: 'Electronegativity' },
  { key: 'ionizationEnergy', label: 'Ionization energy' },
  { key: 'atomicRadius', label: 'Atomic radius' },
  { key: 'density', label: 'Density' },
  { key: 'meltingPoint', label: 'Melting point' },
]

export const BLOCK_COLORS: Record<Block, string> = {
  s: '#fb7185',
  p: '#4ade80',
  d: '#22d3ee',
  f: '#e879f9',
}

export const PHASE_COLORS: Record<Phase, string> = {
  solid: '#fb923c',
  liquid: '#22d3ee',
  gas: '#a78bfa',
  unknown: '#64748b',
}
