const { analyzeTransformation } = require('../services/aiService');

const transformationMatrix = {
  PET: [
    { name: 'Recycled PET Pellets (rPET)', compatibility: 94, targetIndustries: ['Injection Molding', 'Packaging'], yieldPercentage: 92, process: 'Washing, hot de-labeling, grinding, and extruding into food-grade pellets.' },
    { name: 'Polyester Textile Fiber', compatibility: 89, targetIndustries: ['Textile & Apparel', 'Geotextiles'], yieldPercentage: 88, process: 'Melt-spinning continuous filament yarn for synthetic fabrics.' },
    { name: 'Synthetic Composite Planks', compatibility: 82, targetIndustries: ['Construction', 'Infrastructure'], yieldPercentage: 95, process: 'Thermal compression molding with mineral reinforcement.' }
  ],
  HDPE: [
    { name: 'High-Density Drainage Pipes', compatibility: 96, targetIndustries: ['Civil Infrastructure', 'Agriculture'], yieldPercentage: 95, process: 'High-torque twin-screw pipe profile extrusion.' },
    { name: 'Industrial Storage Crates & Pallets', compatibility: 91, targetIndustries: ['Logistics & Warehousing'], yieldPercentage: 93, process: 'Heavy-duty structural foam injection molding.' },
    { name: 'Plastic Lumber Decking', compatibility: 86, targetIndustries: ['Building Materials'], yieldPercentage: 94, process: 'Wood-plastic composite profile extrusion.' }
  ],
  'Aluminium Scrap': [
    { name: 'Secondary Aluminium Ingot (ADC12)', compatibility: 97, targetIndustries: ['Automotive Die Casting', 'Foundries'], yieldPercentage: 96, process: 'Reverberatory furnace re-melting, dross skimming, and ingot casting.' },
    { name: 'Architectural Window Profiles', compatibility: 88, targetIndustries: ['Construction & Fenestration'], yieldPercentage: 90, process: 'Billet homogenizing and hydraulic press extrusion.' }
  ],
  'Fly Ash': [
    { name: 'Pozzolanic Cement Blend (PCC)', compatibility: 98, targetIndustries: ['Cement Manufacturing'], yieldPercentage: 99, process: 'Inter-grinding raw fly ash with Portland clinker.' },
    { name: 'Autoclaved Aerated Concrete (AAC) Blocks', compatibility: 95, targetIndustries: ['Building & Construction'], yieldPercentage: 97, process: 'Hydrothermal autoclaving with lime, cement, and aluminium powder slurry.' }
  ],
  'Steel Scrap': [
    { name: 'Structural TMT Rebars', compatibility: 96, targetIndustries: ['Infrastructure', 'Civil Construction'], yieldPercentage: 94, process: 'Electric Arc Furnace (EAF) melting, ladle refining, and hot rolling.' },
    { name: 'Forging Billets', compatibility: 89, targetIndustries: ['Machinery & Automotive'], yieldPercentage: 92, process: 'Continuous casting into square billets.' }
  ],
  Glass: [
    { name: 'Cullet Container Glass', compatibility: 95, targetIndustries: ['Glass Container Manufacturing'], yieldPercentage: 98, process: 'Optical sorting, crushing, and furnace re-melting at 1500°C.' },
    { name: 'Glass Mineral Wool Insulation', compatibility: 89, targetIndustries: ['Building Thermal Insulation'], yieldPercentage: 92, process: 'Rotary spinning into glass wool insulation batts.' }
  ]
};

// @desc    Get AI Waste Transformation Advice ("What can this waste become?")
// @route   POST /api/transformation/analyze
// @access  Private / Public
const getTransformationAdvice = async (req, res) => {
  try {
    const { waste_id, name, category, composition, quantity } = req.body;
    const cat = category || name || 'PET';
    
    // Find matching transformation mapping or fallback
    const matchedKey = Object.keys(transformationMatrix).find(k => 
      cat.toLowerCase().includes(k.toLowerCase()) || (name && name.toLowerCase().includes(k.toLowerCase()))
    );

    const applications = matchedKey ? transformationMatrix[matchedKey] : [
      { name: `Recycled ${cat} Pellets / Raw Material`, compatibility: 92, targetIndustries: ['Manufacturing', 'Compounding'], yieldPercentage: 90, process: 'Sorting, cleaning, and thermal re-processing.' },
      { name: `Composite Construction Aggregates`, compatibility: 85, targetIndustries: ['Civil Engineering', 'Building'], yieldPercentage: 95, process: 'Grinding and binder blending.' }
    ];

    return res.status(200).json({
      waste: cat,
      name: name || cat,
      quantity: quantity || 1000,
      applications,
      summary: `${cat} exhibits high circular transformation potential. Primary pathway recommended: ${applications[0].name} (${applications[0].compatibility}% compatibility).`
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTransformationAdvice
};
