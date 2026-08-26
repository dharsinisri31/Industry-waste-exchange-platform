const CANONICAL_CATEGORIES = [
  'Plastic / Polymers',
  'Metal Scrap',
  'Paper & Cardboard',
  'Textiles',
  'Glass',
  'E-Waste',
  'Rubber',
  'Wood & Biomass',
  'Agricultural Waste',
  'Chemical Byproducts',
  'Industrial Slag',
  'Thermal Fly Ash',
  'Construction & Demolition Waste',
  'Food Processing Waste',
  'Oil & Lubricant Waste',
  'Battery & Energy Waste',
  'Automotive Scrap',
  'Packaging Waste'
];

/**
 * Normalizes any category string or material name into one of the 18 canonical categories
 * @param {string} cat - Raw category input
 * @param {string} materialName - Optional material title for heuristic disambiguation
 * @returns {string} - Canonical category
 */
const normalizeCategory = (cat, materialName = '') => {
  if (!cat && !materialName) return 'Plastic / Polymers';
  const str = (cat || '').toString().trim().toLowerCase();
  const mat = (materialName || '').toString().trim().toLowerCase();

  // Exact match against canonical list
  const exact = CANONICAL_CATEGORIES.find(c => c.toLowerCase() === str);
  if (exact) return exact;

  // 1. Metal Scrap
  if (
    str.includes('metal') || str.includes('steel') || str.includes('aluminium') || 
    str.includes('aluminum') || str.includes('copper') || str.includes('iron') || 
    str.includes('brass') || mat.includes('steel') || mat.includes('metal') || 
    mat.includes('aluminium') || mat.includes('copper') || mat.includes('iron') ||
    mat.includes('brass') || str === 'metallurgy'
  ) {
    return 'Metal Scrap';
  }

  // 2. Plastic / Polymers
  if (
    str.includes('plastic') || str.includes('polymer') || str.includes('pet') || 
    str.includes('hdpe') || str.includes('pp') || str.includes('ldpe') || 
    str.includes('pvc') || mat.includes('plastic') || mat.includes('pet') || 
    mat.includes('hdpe') || mat.includes('polymer') || mat.includes('flakes') ||
    mat.includes('regrind')
  ) {
    return 'Plastic / Polymers';
  }

  // 3. Paper & Cardboard
  if (
    str.includes('paper') || str.includes('cardboard') || str.includes('carton') || 
    mat.includes('paper') || mat.includes('cardboard') || mat.includes('carton') ||
    mat.includes('corrugated')
  ) {
    return 'Paper & Cardboard';
  }

  // 4. Textiles
  if (
    str.includes('textile') || str.includes('cotton') || str.includes('fabric') || 
    str.includes('yarn') || mat.includes('textile') || mat.includes('cotton') ||
    mat.includes('fabric') || mat.includes('yarn') || mat.includes('polyester')
  ) {
    return 'Textiles';
  }

  // 5. Glass
  if (
    str.includes('glass') || str.includes('cullet') || mat.includes('glass') || 
    mat.includes('cullet') || mat.includes('bottle')
  ) {
    return 'Glass';
  }

  // 6. E-Waste
  if (
    str.includes('e-waste') || str.includes('electronic') || str.includes('circuit') || 
    str.includes('pcb') || mat.includes('electronic') || mat.includes('circuit') ||
    mat.includes('pcb')
  ) {
    return 'E-Waste';
  }

  // 7. Rubber
  if (
    str.includes('rubber') || str.includes('tyre') || str.includes('tire') || 
    mat.includes('rubber') || mat.includes('tyre') || mat.includes('crumb')
  ) {
    return 'Rubber';
  }

  // 8. Wood & Biomass
  if (
    str.includes('wood') || str.includes('biomass') || str.includes('sawdust') || 
    str.includes('timber') || mat.includes('wood') || mat.includes('sawdust') || 
    mat.includes('pallet')
  ) {
    return 'Wood & Biomass';
  }

  // 9. Agricultural Waste
  if (
    str.includes('agri') || str.includes('husk') || str.includes('straw') || 
    str.includes('bagasse') || mat.includes('husk') || mat.includes('straw') || 
    mat.includes('bagasse')
  ) {
    return 'Agricultural Waste';
  }

  // 10. Chemical Byproducts
  if (
    str.includes('chemical') || str.includes('solvent') || str.includes('acid') || 
    str.includes('sludge') || mat.includes('solvent') || mat.includes('chemical') ||
    mat.includes('spent')
  ) {
    return 'Chemical Byproducts';
  }

  // 11. Industrial Slag
  if (
    str.includes('slag') || mat.includes('slag') || mat.includes('cinder')
  ) {
    return 'Industrial Slag';
  }

  // 12. Thermal Fly Ash
  if (
    str.includes('fly ash') || str.includes('flyash') || str.includes('ash') || 
    mat.includes('fly ash') || mat.includes('bottom ash') || mat.includes('pond ash')
  ) {
    return 'Thermal Fly Ash';
  }

  // 13. Construction & Demolition Waste
  if (
    str.includes('construction') || str.includes('demolition') || str.includes('concrete') || 
    str.includes('debris') || mat.includes('concrete') || mat.includes('rubble')
  ) {
    return 'Construction & Demolition Waste';
  }

  // 14. Food Processing Waste
  if (
    str.includes('food') || str.includes('organic') || str.includes('brewery') || 
    mat.includes('food') || mat.includes('grain')
  ) {
    return 'Food Processing Waste';
  }

  // 15. Oil & Lubricant Waste
  if (
    str.includes('oil') || str.includes('lubricant') || str.includes('grease') || 
    mat.includes('oil') || mat.includes('lubricant')
  ) {
    return 'Oil & Lubricant Waste';
  }

  // 16. Battery & Energy Waste
  if (
    str.includes('battery') || str.includes('lithium') || str.includes('cell') || 
    mat.includes('battery') || mat.includes('lithium')
  ) {
    return 'Battery & Energy Waste';
  }

  // 17. Automotive Scrap
  if (
    str.includes('automotive') || str.includes('auto') || str.includes('vehicle') || 
    mat.includes('automotive')
  ) {
    return 'Automotive Scrap';
  }

  // 18. Packaging Waste
  if (
    str.includes('packaging') || str.includes('carton') || mat.includes('packaging')
  ) {
    return 'Packaging Waste';
  }

  return 'Plastic / Polymers';
};

module.exports = {
  CANONICAL_CATEGORIES,
  normalizeCategory
};
