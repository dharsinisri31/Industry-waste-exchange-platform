const Waste = require('../models/Waste');
const Transaction = require('../models/Transaction');
const Industry = require('../models/Industry');
const Equipment = require('../models/Equipment');

// @desc    Get dashboard metrics & user summary
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    const userWastes = await Waste.find({ uploader: userId }).sort({ createdAt: -1 });
    const userIndustry = await Industry.findOne({ user: userId });

    const totalUploadedQty = userWastes.reduce((acc, w) => acc + w.quantity, 0);

    const completedTx = await Transaction.find({
      $or: [{ seller: userId }, { buyer: userId }],
      status: 'completed'
    });

    const totalCarbonSaved = userIndustry ? userIndustry.carbonSaved : completedTx.reduce((acc, t) => acc + t.carbonSavedKg, 0);
    const totalRevenue = userIndustry ? userIndustry.revenue : completedTx.reduce((acc, t) => acc + t.totalPrice, 0);

    const availableEquipment = await Equipment.find({ status: 'available' }).limit(5);

    return res.status(200).json({
      metrics: {
        activeListingsCount: userWastes.length,
        totalUploadedQty,
        totalCarbonSavedKg: totalCarbonSaved,
        totalRevenueUsd: totalRevenue,
        completedExchangesCount: completedTx.length
      },
      userWastes,
      availableEquipment,
      industryProfile: userIndustry
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardData
};
