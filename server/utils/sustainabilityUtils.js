/**
 * Sustainability & Circular Economy Calculations for ECOLINK
 * 
 * Emission Factors (kg CO2e avoided per kg of waste/byproduct utilized):
 * - Plastic/PET/HDPE/Polymer: 1.85 kg CO2e / kg
 * - Fly Ash in cement/construction: 0.82 kg CO2e / kg
 * - Metals/Aluminium/Steel/Foundry: 4.2 kg CO2e / kg
 * - Textile/Fabric/Cotton: 2.1 kg CO2e / kg
 * - Glass/Cullet: 0.35 kg CO2e / kg
 * - Paper/Cardboard: 1.1 kg CO2e / kg
 * - E-Waste: 3.5 kg CO2e / kg
 * - Fallback/Other: 1.2 kg CO2e / kg (conservative estimate)
 */

const EMISSION_FACTORS = {
  plastic: 1.85,
  fly_ash: 0.82,
  metal: 4.2,
  textile: 2.1,
  glass: 0.35,
  paper: 1.1,
  e_waste: 3.5,
  default_factor: 1.2
};

/**
 * Identify material category key from category or material name string.
 */
function getMaterialCategoryKey(materialName = '', category = '') {
  const text = `${materialName} ${category}`.toLowerCase();

  if (text.includes('pet') || text.includes('plastic') || text.includes('polymer') || text.includes('hdpe') || text.includes('ldpe') || text.includes('poly')) {
    return 'plastic';
  }
  if (text.includes('metal') || text.includes('steel') || text.includes('iron') || text.includes('aluminium') || text.includes('copper') || text.includes('scrap metal') || text.includes('hms')) {
    return 'metal';
  }
  if (text.includes('fly ash') || text.includes('ash') || text.includes('slag') || text.includes('gypsum')) {
    return 'fly_ash';
  }
  if (text.includes('textile') || text.includes('fabric') || text.includes('cotton') || text.includes('yarn')) {
    return 'textile';
  }
  if (text.includes('glass') || text.includes('cullet')) {
    return 'glass';
  }
  if (text.includes('paper') || text.includes('cardboard') || text.includes('carton')) {
    return 'paper';
  }
  if (text.includes('e-waste') || text.includes('electronic') || text.includes('circuit')) {
    return 'e_waste';
  }

  return 'default_factor';
}

/**
 * Calculate avoided lifecycle CO2e emissions (in kg) for a given material quantity.
 * @param {number} quantityKg 
 * @param {string} materialName 
 * @param {string} category 
 * @returns {number} kg CO2e avoided
 */
function calculateAvoidedCO2(quantityKg = 0, materialName = '', category = '') {
  const qty = Number(quantityKg) || 0;
  if (qty <= 0) return 0;

  const catKey = getMaterialCategoryKey(materialName, category);
  const factor = EMISSION_FACTORS[catKey] || EMISSION_FACTORS.default_factor;

  return Number((qty * factor).toFixed(2));
}

/**
 * Calculate virgin material extraction replaced (in kg).
 * @param {number} quantityKg 
 * @returns {number}
 */
function calculateVirginMaterialReplaced(quantityKg = 0) {
  const qty = Number(quantityKg) || 0;
  if (qty <= 0) return 0;
  return Number((qty * 0.85).toFixed(2));
}

module.exports = {
  EMISSION_FACTORS,
  getMaterialCategoryKey,
  calculateAvoidedCO2,
  calculateVirginMaterialReplaced
};
