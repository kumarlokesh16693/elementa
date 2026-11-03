import {
  computeVseprCoordinates,
  VSEPR_PRESETS,
} from '../src/lib/periodic/vsepr'

let fail = 0
function check(name: string, cond: boolean, info?: unknown) {
  if (!cond) fail++
  console.log(cond ? 'PASS' : 'FAIL', name, cond ? '' : '->', info ?? '')
}

console.log('Testing 3D VSEPR & Polyatomic Geometry Engine...')

// 1. Presets test
check('Presets defined', VSEPR_PRESETS.length >= 12)

// 2. Water H2O (SN=4, 2 BP, 2 LP)
const h2o = computeVseprCoordinates(8, 1, 2, 2, 104.5)
check('H2O steric number 4', h2o.stericNumber === 4)
check('H2O bent shape', h2o.molecularShape === 'Bent')
check('H2O hybridization sp3', h2o.hybridization === 'sp³')
check('H2O is strongly polar', h2o.isPolar && h2o.dipoleMagnitudeDebye > 1.0, h2o.dipoleMagnitudeDebye)
check('H2O has 2 lone pair vectors', h2o.lonePairs.length === 2)
check('H2O has 2 ligand vectors', h2o.ligands.length === 2)

// 3. Carbon Dioxide CO2 (SN=2, 2 BP, 0 LP)
const co2 = computeVseprCoordinates(6, 8, 2, 0)
check('CO2 linear shape', co2.molecularShape === 'Linear')
check('CO2 nonpolar (dipoles cancel)', !co2.isPolar && h2o.dipoleMagnitudeDebye > 0, co2.dipoleMagnitudeDebye)
check('CO2 hybridization sp', co2.hybridization === 'sp')

// 4. Methane CH4 (SN=4, 4 BP, 0 LP)
const ch4 = computeVseprCoordinates(6, 1, 4, 0)
check('CH4 tetrahedral shape', ch4.molecularShape === 'Tetrahedral')
check('CH4 nonpolar', !ch4.isPolar, ch4.dipoleMagnitudeDebye)

// 5. Ammonia NH3 (SN=4, 3 BP, 1 LP)
const nh3 = computeVseprCoordinates(7, 1, 3, 1, 107.3)
check('NH3 trigonal pyramidal shape', nh3.molecularShape === 'Trigonal Pyramidal')
check('NH3 polar', nh3.isPolar && nh3.dipoleMagnitudeDebye > 0.5, nh3.dipoleMagnitudeDebye)

// 6. Sulfur Hexafluoride SF6 (SN=6, 6 BP, 0 LP)
const sf6 = computeVseprCoordinates(16, 9, 6, 0)
check('SF6 octahedral shape', sf6.molecularShape === 'Octahedral')
check('SF6 hybridization sp3d2', sf6.hybridization === 'sp³d²')
check('SF6 nonpolar', !sf6.isPolar, sf6.dipoleMagnitudeDebye)

// 7. Xenon Tetrafluoride XeF4 (SN=6, 4 BP, 2 LP)
const xef4 = computeVseprCoordinates(54, 9, 4, 2)
check('XeF4 square planar shape', xef4.molecularShape === 'Square Planar')
check('XeF4 nonpolar (trans lone pairs cancel)', !xef4.isPolar, xef4.dipoleMagnitudeDebye)

console.log(`\nTests completed with ${fail} failures.`)
if (fail > 0) process.exit(1)
