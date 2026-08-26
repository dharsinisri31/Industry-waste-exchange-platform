const Transaction = require('../models/Transaction');
const Waste = require('../models/Waste');
const { STANDARDIZED_STATUSES, normalizeStatus } = require('../utils/statusUtils');
const { calculateAvoidedCO2, calculateVirginMaterialReplaced } = require('../utils/sustainabilityUtils');

const getSustainabilityMetrics = async (req, res) => {
  try {
    const allTransactions = await Transaction.find().populate('waste', 'name category quantity unit');
    
    // Filter by completed status ONLY
    const completedTransactions = allTransactions.filter(
      t => normalizeStatus(t.orderStatus || t.status) === STANDARDIZED_STATUSES.COMPLETED
    );

    const completedTransactionsCount = completedTransactions.length;

    const totalWasteDivertedKg = completedTransactions.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
    const totalCarbonSavedKg = completedTransactions.reduce((sum, t) => {
      return sum + calculateAvoidedCO2(t.quantity, t.waste?.name, t.waste?.category);
    }, 0);
    const virginMaterialReplacedKg = calculateVirginMaterialReplaced(totalWasteDivertedKg);

    const wasteDivertedTonnes = roundToTwo(totalWasteDivertedKg / 1000);
    const co2SavedTonnes = roundToTwo(totalCarbonSavedKg / 1000);
    const virginMaterialReplacedTonnes = roundToTwo(virginMaterialReplacedKg / 1000);
    const treesEquivalent = Math.round(totalCarbonSavedKg / 20.0);

    return res.status(200).json({
      success: true,
      completedTransactionsCount,
      wasteDivertedTonnes,
      wasteDivertedKg: totalWasteDivertedKg,
      co2SavedTonnes,
      co2SavedKg: totalCarbonSavedKg,
      virginMaterialReplacedTonnes,
      virginMaterialReplacedKg,
      treesEquivalent,
      circularityScore: completedTransactionsCount > 0 ? 89.2 : 0,
      esgRating: completedTransactionsCount > 0 ? 'Verified Circular Trade' : 'Baseline'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

function roundToTwo(num) {
  return Math.round((Number(num) || 0) * 100) / 100;
}

module.exports = {
  getSustainabilityMetrics
};
