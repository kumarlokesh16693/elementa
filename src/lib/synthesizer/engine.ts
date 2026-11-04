import { COMPOUNDS, REACTIONS } from './database'
import type { Compound, ChemicalReaction, ThermodynamicState } from './types'
import { getElement, ELEMENTS } from '@/lib/periodic'

const R_GAS = 8.314462618 // J / (mol·K)

export function getAllCompounds(): Compound[] {
  return COMPOUNDS
}

export function getCompoundById(id: string): Compound | undefined {
  return COMPOUNDS.find((c) => c.id.toLowerCase() === id.toLowerCase() || c.rawFormula.toLowerCase() === id.toLowerCase())
}

export function getAllReactions(): ChemicalReaction[] {
  return REACTIONS
}

export function getReactionById(id: string): ChemicalReaction | undefined {
  return REACTIONS.find((r) => r.id === id)
}

/**
 * Finds compounds that can be fully synthesized using ONLY the selected elements.
 */
export function findSynthesizableCompounds(selectedZ: number[]): Compound[] {
  if (selectedZ.length === 0) return []
  const zSet = new Set(selectedZ)

  return COMPOUNDS.filter((compound) => {
    const compZList = compound.elements.map((e) => e.z)
    return compZList.every((z) => zSet.has(z))
  })
}

/**
 * Finds compounds that contain at least one of the selected elements.
 */
export function findRelatedCompounds(selectedZ: number[]): Compound[] {
  if (selectedZ.length === 0) return []
  const zSet = new Set(selectedZ)

  return COMPOUNDS.filter((compound) => {
    const compZList = compound.elements.map((e) => e.z)
    return compZList.some((z) => zSet.has(z))
  })
}

/**
 * Backward compatibility wrapper
 */
export function findCompoundsForElements(selectedZ: number[], strictOnly = true): Compound[] {
  return strictOnly ? findSynthesizableCompounds(selectedZ) : findRelatedCompounds(selectedZ)
}

/**
 * Finds all reactions involving a given element (by symbol or Z)
 */
export function findReactionsForElement(z: number): ChemicalReaction[] {
  const el = getElement(z)
  if (!el) return []
  const sym = el.symbol.toLowerCase()

  return REACTIONS.filter((rxn) => {
    if (rxn.equation.toLowerCase().includes(sym)) return true
    for (const r of rxn.reactants) {
      if (r.compoundId.toLowerCase() === sym) return true
      const c = getCompoundById(r.compoundId)
      if (c && c.elements.some((e) => e.z === z)) return true
    }
    for (const p of rxn.products) {
      if (p.compoundId.toLowerCase() === sym) return true
      const c = getCompoundById(p.compoundId)
      if (c && c.elements.some((e) => e.z === z)) return true
    }
    return false
  })
}

/**
 * Finds reactions whose reactants can be formed from the selected elements
 */
export function findReactionsForSelectedElements(selectedZ: number[]): ChemicalReaction[] {
  if (selectedZ.length === 0) return []
  const zSet = new Set(selectedZ)

  return REACTIONS.filter((rxn) => {
    // Check if all elements in all reactants are in zSet
    return rxn.reactants.every((r) => {
      // Element in raw form (e.g. H2, O2, Al, Fe, N2, etc.)
      const el = ELEMENTS.find((e) => e.symbol.toLowerCase() === r.compoundId.toLowerCase())
      if (el) return zSet.has(el.number)
      // Check if it's a compound
      const comp = getCompoundById(r.compoundId)
      if (comp) return comp.elements.every((e) => zSet.has(e.z))
      return false
    })
  })
}

/**
 * Calculates temperature-dependent thermodynamic values: ΔH(T), ΔS(T), ΔG(T), K_eq(T)
 */
export function computeReactionThermodynamics(reaction: ChemicalReaction, tempK: number): ThermodynamicState {
  const T = Math.max(1, tempK)
  const dH = reaction.deltaH // kJ / mol
  const dS = reaction.deltaS // J / (mol·K)

  // ΔG = ΔH - T·ΔS  (in kJ/mol)
  const dG = dH - (T * dS) / 1000.0

  // Equilibrium constant K_eq = exp(-ΔG° / RT)
  const exponent = (-dG * 1000.0) / (R_GAS * T)
  let kEq = 1.0
  if (exponent > 700) {
    kEq = Infinity
  } else if (exponent < -700) {
    kEq = 0.0
  } else {
    kEq = Math.exp(exponent)
  }

  const isSpontaneous = dG < 0

  let inversionTemp: number | undefined
  let isInverted = false
  if (Math.abs(dS) > 1e-6 && ((dH > 0 && dS > 0) || (dH < 0 && dS < 0))) {
    inversionTemp = (dH * 1000.0) / dS
    if (inversionTemp > 0) {
      if (dH > 0 && dS > 0) {
        isInverted = T > inversionTemp
      } else {
        isInverted = T < inversionTemp
      }
    }
  }

  let thermalRating: ThermodynamicState['thermalRating'] = 'neutral'
  if (dH <= -500) thermalRating = 'extremely-exothermic'
  else if (dH < 0) thermalRating = 'exothermic'
  else if (dH >= 500) thermalRating = 'extremely-endothermic'
  else if (dH > 0) thermalRating = 'endothermic'

  return {
    tempK: T,
    deltaH: dH,
    deltaS: dS,
    deltaG: dG,
    kEq,
    isSpontaneous,
    isInverted,
    inversionTemp,
    thermalRating,
  }
}

/**
 * Simple parser for chemical formula strings like "H2O", "Fe2O3", "CaCO3"
 */
export function parseFormula(str: string): { symbol: string; count: number }[] {
  const regex = /([A-Z][a-z]*)(\d*)/g
  const result: { symbol: string; count: number }[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(str)) !== null) {
    if (match[1]) {
      const symbol = match[1]
      const count = match[2] ? parseInt(match[2], 10) : 1
      result.push({ symbol, count })
    }
  }
  return result
}
