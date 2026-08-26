export const CANONICAL_CATEGORIES = [
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
 * Normalizes any category input or material name into one of the 18 canonical categories
 */
export const normalizeCategory = (cat, materialName = '') => {
  if (!cat && !materialName) return 'Plastic / Polymers';
  const str = (cat || '').toString().trim().toLowerCase();
  const mat = (materialName || '').toString().trim().toLowerCase();

  const exact = CANONICAL_CATEGORIES.find(c => c.toLowerCase() === str);
  if (exact) return exact;

  if (
    str.includes('metal') || str.includes('steel') || str.includes('aluminium') || 
    str.includes('aluminum') || str.includes('copper') || str.includes('iron') || 
    str.includes('brass') || mat.includes('steel') || mat.includes('metal') || 
    mat.includes('aluminium') || mat.includes('copper') || mat.includes('iron')
  ) {
    return 'Metal Scrap';
  }

  if (
    str.includes('plastic') || str.includes('polymer') || str.includes('pet') || 
    str.includes('hdpe') || str.includes('pp') || str.includes('ldpe') || 
    str.includes('pvc') || mat.includes('plastic') || mat.includes('pet') || 
    mat.includes('hdpe') || mat.includes('polymer') || mat.includes('flakes')
  ) {
    return 'Plastic / Polymers';
  }

  if (
    str.includes('paper') || str.includes('cardboard') || str.includes('carton') || 
    mat.includes('paper') || mat.includes('cardboard') || mat.includes('corrugated')
  ) {
    return 'Paper & Cardboard';
  }

  if (
    str.includes('textile') || str.includes('cotton') || str.includes('fabric') || 
    str.includes('yarn') || mat.includes('textile') || mat.includes('cotton') ||
    mat.includes('fabric') || mat.includes('yarn')
  ) {
    return 'Textiles';
  }

  if (
    str.includes('glass') || str.includes('cullet') || mat.includes('glass') || 
    mat.includes('cullet')
  ) {
    return 'Glass';
  }

  if (
    str.includes('e-waste') || str.includes('electronic') || str.includes('circuit') || 
    str.includes('pcb') || mat.includes('electronic') || mat.includes('circuit')
  ) {
    return 'E-Waste';
  }

  if (
    str.includes('rubber') || str.includes('tyre') || str.includes('tire') || 
    mat.includes('rubber') || mat.includes('tyre')
  ) {
    return 'Rubber';
  }

  if (
    str.includes('wood') || str.includes('biomass') || str.includes('sawdust') || 
    str.includes('timber') || mat.includes('wood') || mat.includes('sawdust') || 
    mat.includes('pallet')
  ) {
    return 'Wood & Biomass';
  }

  if (
    str.includes('agri') || str.includes('husk') || str.includes('straw') || 
    str.includes('bagasse') || mat.includes('husk') || mat.includes('straw')
  ) {
    return 'Agricultural Waste';
  }

  if (
    str.includes('chemical') || str.includes('solvent') || str.includes('acid') || 
    str.includes('sludge') || mat.includes('solvent') || mat.includes('chemical')
  ) {
    return 'Chemical Byproducts';
  }

  if (
    str.includes('slag') || mat.includes('slag')
  ) {
    return 'Industrial Slag';
  }

  if (
    str.includes('fly ash') || str.includes('flyash') || str.includes('ash') || 
    mat.includes('fly ash')
  ) {
    return 'Thermal Fly Ash';
  }

  if (
    str.includes('construction') || str.includes('demolition') || str.includes('concrete') || 
    str.includes('debris') || mat.includes('concrete')
  ) {
    return 'Construction & Demolition Waste';
  }

  if (
    str.includes('food') || str.includes('organic') || str.includes('brewery') || 
    mat.includes('food')
  ) {
    return 'Food Processing Waste';
  }

  if (
    str.includes('oil') || str.includes('lubricant') || str.includes('grease') || 
    mat.includes('oil')
  ) {
    return 'Oil & Lubricant Waste';
  }

  if (
    str.includes('battery') || str.includes('lithium') || str.includes('cell') || 
    mat.includes('battery')
  ) {
    return 'Battery & Energy Waste';
  }

  if (
    str.includes('automotive') || str.includes('auto') || str.includes('vehicle') || 
    mat.includes('automotive')
  ) {
    return 'Automotive Scrap';
  }

  if (
    str.includes('packaging') || str.includes('carton') || mat.includes('packaging')
  ) {
    return 'Packaging Waste';
  }

  return 'Plastic / Polymers';
};
