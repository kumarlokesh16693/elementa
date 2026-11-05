/**
 * Curated Benchmark Chemical Kinetics & Catalysis Reaction Catalog
 */

import type { KineticsReaction } from './types'

export const KINETICS_REACTIONS: KineticsReaction[] = [
  {
    id: 'h2o2-decomp',
    name: 'Hydrogen Peroxide Catalytic Decomposition',
    equation: '2 H₂O₂ (aq) → 2 H₂O (l) + O₂ (g)',
    category: 'enzymatic',
    eaUncatalyzed: 75.3, // kJ/mol
    eaCatalyzed: 8.0, // With Catalase enzyme (near diffusion limit!)
    deltaH: -98.2, // Exothermic kJ/mol per mole H2O2
    deltaG: -116.7,
    deltaS_ddagger: -62.0, // J/(mol*K)
    frequencyFactorA: 1.0e11,
    catalystName: 'Catalase (Liver Heme Enzyme) / MnO₂',
    catalystType: 'enzyme',
    defaultTempK: 298.15,
    order: 'first',
    description: 'Textbook catalytic acceleration: Catalase reduces the activation barrier from 75.3 kJ/mol to 8.0 kJ/mol, boosting the reaction velocity by a factor of 10⁷.',
    mechanismSteps: [
      'Enzyme-heme [Fe(III)] coordinates with H₂O₂ forming Compound I (ferryl intermediate) + H₂O',
      'Compound I oxidizes a second H₂O₂ molecule to release molecular O₂ and regenerate resting [Fe(III)]',
      'Diffusion-controlled turnover rate kcat ≈ 4 × 10⁷ s⁻¹',
    ],
    industrialApplication: 'Biological defense against reactive oxygen species (ROS) and pulp bleaching effluent detoxification.',
  },
  {
    id: 'haber-bosch',
    name: 'Haber-Bosch Ammonia Synthesis',
    equation: 'N₂ (g) + 3 H₂ (g) ⇌ 2 NH₃ (g)',
    category: 'heterogeneous-catalysis',
    eaUncatalyzed: 335.0, // Breaking the N≡N triple bond (945 kJ/mol) has massive Ea!
    eaCatalyzed: 160.0, // On promoter-doped α-Fe (111) surface
    deltaH: -92.2, // Exothermic
    deltaG: -33.0,
    deltaS_ddagger: -198.0,
    frequencyFactorA: 8.5e12,
    catalystName: 'Promoted Iron (α-Fe with K₂O / Al₂O₃)',
    catalystType: 'heterogeneous',
    defaultTempK: 700.0,
    order: 'consecutive',
    description: 'Nobel-winning industrial heterogeneous catalysis. Breaking the inert N≡N triple bond uncatalyzed is unfeasible; Fe(111) dissociates N₂ into adsorbed N atoms with vastly reduced Ea.',
    mechanismSteps: [
      'N₂ (g) + 2 * → 2 N* (Rate-determining dissociative adsorption)',
      'H₂ (g) + 2 * → 2 H* (Facile dissociative adsorption)',
      'N* + H* → NH* + * (Surface stepwise hydrogenation)',
      'NH* + H* → NH₂* + *',
      'NH₂* + H* → NH₃* + *',
      'NH₃* → NH₃ (g) + * (Product desorption)',
    ],
    industrialApplication: 'Produces >180 million metric tons of ammonia annually, providing synthetic nitrogen fertilizer sustaining ~50% of world food.',
  },
  {
    id: 'catalytic-converter',
    name: 'Automotive Three-Way Catalytic Reduction',
    equation: '2 CO (g) + 2 NO (g) → 2 CO₂ (g) + N₂ (g)',
    category: 'heterogeneous-catalysis',
    eaUncatalyzed: 240.0,
    eaCatalyzed: 85.0,
    deltaH: -746.6,
    deltaG: -687.2,
    deltaS_ddagger: -145.0,
    frequencyFactorA: 5.0e11,
    catalystName: 'Platinum-Rhodium / Ceria-Zirconia (Pt/Rh)',
    catalystType: 'heterogeneous',
    defaultTempK: 550.0,
    order: 'second',
    description: 'Langmuir-Hinshelwood heterogeneous surface mechanism: Adsorbed CO and dissociating NO combine on noble metal crystallites to eliminate toxic emissions in internal combustion exhausts.',
    mechanismSteps: [
      'NO (g) + 2 * → N* + O* (Rhodium catalytic dissociation)',
      'CO (g) + * → CO* (Platinum surface adsorption)',
      'CO* + O* → CO₂ (g) + 2 * (Carbon dioxide formation and release)',
      '2 N* → N₂ (g) + 2 * (Dinitrogen associative desorption)',
    ],
    industrialApplication: 'Mandatory automotive exhaust aftertreatment across hundreds of millions of motor vehicles worldwide.',
  },
  {
    id: 'ester-saponification',
    name: 'Alkaline Ester Hydrolysis (Saponification)',
    equation: 'CH₃COOC₂H₅ + OH⁻ → CH₃COO⁻ + C₂H₅OH',
    category: 'solution',
    eaUncatalyzed: 88.0,
    eaCatalyzed: 45.0,
    deltaH: -48.5,
    deltaG: -56.2,
    deltaS_ddagger: -110.0,
    frequencyFactorA: 3.2e8,
    catalystName: 'Hydroxide Nucleophilic / Acid Catalysis',
    catalystType: 'homogeneous',
    defaultTempK: 298.15,
    order: 'second',
    description: 'Prototypical bimolecular second-order nucleophilic acyl substitution (BAC2 mechanism) with a tetrahedral intermediate.',
    mechanismSteps: [
      'Hydroxide OH⁻ attacks the electrophilic carbonyl carbon forming tetrahedral intermediate [CH₃C(O⁻)(OH)(OC₂H₅)]',
      'Expulsion of ethoxide alkoxide leaving group C₂H₅O⁻ regenerating carbonyl',
      'Rapid irreversible proton transfer from acetic acid to ethoxide yielding acetate and ethanol',
    ],
    industrialApplication: 'Commercial soap manufacturing from triglycerides, fatty acid ester processing, and biodiesels.',
  },
  {
    id: 'sucrose-inversion',
    name: 'Sucrose Inversion by Invertase',
    equation: 'C₁₂H₂₂O₁₁ (sucrose) + H₂O → C₆H₁₂O₆ (glucose) + C₆H₁₂O₆ (fructose)',
    category: 'enzymatic',
    eaUncatalyzed: 108.0,
    eaCatalyzed: 35.0,
    deltaH: -14.6,
    deltaG: -29.3,
    deltaS_ddagger: -85.0,
    frequencyFactorA: 2.5e11,
    catalystName: 'β-Fructofuranosidase (Invertase)',
    catalystType: 'enzyme',
    defaultTempK: 308.15,
    order: 'first',
    description: 'Classic Michaelis-Menten prototype: Hydrolysis of the glycosidic bond between glucose and fructose, inverting the optical rotation from dextrorotatory (+66.5°) to levorotatory (-19.7°).',
    mechanismSteps: [
      'Enzyme active site aspartate carboxylate acts as nucleophile attacking C1 of fructose',
      'Glucosyl intermediate cleaved with proton donation from catalytic glutamate',
      'Water molecule hydrolyzes covalent enzyme-fructose intermediate to release free monosaccharides',
    ],
    industrialApplication: 'Confectionery manufacture of invert sugar syrup (prevents crystallization in fondants, ganache, and jams).',
  },
  {
    id: 'no2-decomposition',
    name: 'Nitrogen Dioxide Thermal Decomposition',
    equation: '2 NO₂ (g) → 2 NO (g) + O₂ (g)',
    category: 'gas-phase',
    eaUncatalyzed: 114.0,
    eaCatalyzed: 62.0,
    deltaH: 114.2, // Endothermic
    deltaG: 70.0,
    deltaS_ddagger: -42.0,
    frequencyFactorA: 2.0e9,
    catalystName: 'Supported Ruthenium / Zeolite',
    catalystType: 'heterogeneous',
    defaultTempK: 600.0,
    order: 'second',
    description: 'Archetypal second-order gas-phase bimolecular collision reaction: rate = k[NO₂]² where two colliding NO₂ molecules transfer an oxygen atom through a nitro-nitrito bridge.',
    mechanismSteps: [
      'Two NO₂ molecules collide with suitable steric orientation forming [O-N-O···O-N-O]‡ activated complex',
      'Oxygen atom transfers forming NO + NO₃ intermediate',
      'Rapid subsequent step: NO₃ + NO₂ → NO + NO₂ + O₂',
    ],
    industrialApplication: 'Atmospheric chemistry modeling of photochemical smog and urban ozone production cycles.',
  },
]

export function getReactionById(id: string): KineticsReaction {
  return KINETICS_REACTIONS.find((r) => r.id === id) ?? KINETICS_REACTIONS[0]
}
