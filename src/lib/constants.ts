/**
 * CODATA 2022 constants and unit conversions used across ELEMENTA.
 */

export interface PhysicalConstant {
  symbol: string
  name: string
  value: number
  unit: string
  uncertainty: number
  exact: boolean
}

export const CONSTANTS: PhysicalConstant[] = [
  { symbol: 'c', name: 'speed of light in vacuum', value: 299792458, unit: 'm/s', uncertainty: 0, exact: true },
  { symbol: 'h', name: 'Planck constant', value: 6.62607015e-34, unit: 'J*s', uncertainty: 0, exact: true },
  { symbol: 'e', name: 'elementary charge', value: 1.602176634e-19, unit: 'C', uncertainty: 0, exact: true },
  { symbol: 'me', name: 'electron mass', value: 9.1093837139e-31, unit: 'kg', uncertainty: 2.8e-40, exact: false },
  { symbol: 'u', name: 'atomic mass constant', value: 1.66053906892e-27, unit: 'kg', uncertainty: 5.2e-37, exact: false },
  { symbol: 'NA', name: 'Avogadro constant', value: 6.02214076e23, unit: 'mol^-1', uncertainty: 0, exact: true },
  { symbol: 'kB', name: 'Boltzmann constant', value: 1.380649e-23, unit: 'J/K', uncertainty: 0, exact: true },
  { symbol: 'Rinf', name: 'Rydberg constant', value: 10973731.568157, unit: '1/m', uncertainty: 1.2e-5, exact: false },
  { symbol: 'Rh', name: 'Rydberg energy (hydrogen)', value: 13.605693122994, unit: 'eV', uncertainty: 0, exact: false },
  { symbol: 'Eh', name: 'Hartree energy', value: 27.211386245981, unit: 'eV', uncertainty: 0, exact: false },
  { symbol: 'alpha', name: 'fine-structure constant', value: 7.2973525643e-3, unit: '', uncertainty: 1.1e-12, exact: false },
  { symbol: 'hc', name: 'Planck x speed of light', value: 1239.8419843320026, unit: 'eV*nm', uncertainty: 0, exact: false },
]

export function constantBySymbol(symbol: string): PhysicalConstant | undefined {
  return CONSTANTS.find((constant) => constant.symbol === symbol)
}

/* ------------------------------------------------------------------ */
/* Energy-unit conversions                                             */
/* ------------------------------------------------------------------ */

export type EnergyUnit = 'eV' | 'kJ/mol' | 'cm-1' | 'nm' | 'THz' | 'K'

export const ENERGY_UNITS: EnergyUnit[] = ['eV', 'kJ/mol', 'cm-1', 'nm', 'THz', 'K']

const EV_TO_KJMOL = 96.48533212331002
const EV_TO_CM1 = 8065.543937
const EV_TO_THZ = 241.7989242
const EV_TO_K = 11604.518121550
const HC_EV_NM = 1239.8419843320026

export function convertEnergy(value: number, from: EnergyUnit, to: EnergyUnit): number {
  if (!Number.isFinite(value) || value === 0) return Number.NaN
  const toEv = (v: number, unit: EnergyUnit): number => {
    switch (unit) {
      case 'eV': return v
      case 'kJ/mol': return v / EV_TO_KJMOL
      case 'cm-1': return v / EV_TO_CM1
      case 'THz': return v / EV_TO_THZ
      case 'K': return v / EV_TO_K
      case 'nm': return HC_EV_NM / v
    }
  }
  const fromEv = (v: number, unit: EnergyUnit): number => {
    switch (unit) {
      case 'eV': return v
      case 'kJ/mol': return v * EV_TO_KJMOL
      case 'cm-1': return v * EV_TO_CM1
      case 'THz': return v * EV_TO_THZ
      case 'K': return v * EV_TO_K
      case 'nm': return HC_EV_NM / v
    }
  }
  const ev = toEv(value, from)
  if (!Number.isFinite(ev) || ev <= 0) return Number.NaN
  return fromEv(ev, to)
}

export function formatConstant(constant: PhysicalConstant): string {
  const text = constant.value.toExponential(6)
  const exponent = Number(text.split('e')[1])
  const sup = String(exponent).replace('-', '^-')
  const unc = constant.exact ? 'exact' : `+/- ${constant.uncertainty.toExponential(1)}`
  return `${text.split('e')[0]}e${sup} ${constant.unit} ${unc}`
}

export const CONVERSION_ROWS: Array<{ label: string; factor: string; note: string }> = [
  { label: '1 eV -> kJ/mol', factor: EV_TO_KJMOL.toFixed(8), note: 'per mole of photons' },
  { label: '1 eV -> cm-1', factor: EV_TO_CM1.toFixed(6), note: 'wavenumber' },
  { label: '1 eV -> THz', factor: EV_TO_THZ.toFixed(7), note: 'frequency' },
  { label: '1 eV -> K', factor: EV_TO_K.toFixed(6), note: 'temperature equivalent (kB T)' },
  { label: 'lambda(nm) / eV', factor: `E = ${HC_EV_NM.toFixed(6)} / lambda`, note: 'vacuum wavelength' },
]
