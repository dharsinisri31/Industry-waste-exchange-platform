const Industry = require('../models/Industry');
const Waste = require('../models/Waste');
const Transaction = require('../models/Transaction');

// @desc    Get dashboard metrics for industry
// @route   GET /api/industry/dashboard
// @access  Private (Industry User)
const getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find profile
    const profile = await Industry.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: 'Industry profile not found' });
    }

    // 1. Uploaded Waste count (Active & Available listings)
    const uploadedWasteCount = await Waste.countDocuments({ uploader: userId, status: { $in: ['active', 'available'] } });

    // 2. Completed exchanges where user is seller (for revenue)
    const completedSales = await Transaction.find({
      seller: userId,
      status: 'completed'
    });
    const revenue = completedSales.reduce((acc, trans) => acc + trans.totalPrice, 0);

    // 3. Total carbon saved (sum from completed transactions where user is seller or buyer)
    const completedTransactions = await Transaction.find({
      $or: [{ seller: userId }, { buyer: userId }],
      status: 'completed'
    });
    const carbonSaved = completedTransactions.reduce((acc, trans) => acc + trans.carbonSavedKg, 0);

    // 4. Pending transaction requests
    const pendingTransactions = await Transaction.find({
      $or: [{ seller: userId }, { buyer: userId }],
      status: 'pending'
    });

    // 5. Nearby Industries (within 100km)
    const coords = profile.location.coordinates;
    const nearby = await Industry.find({
      user: { $ne: userId },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coords
          },
          $maxDistance: 100000 // 100km
        }
      }
    }).limit(5);

    // Update profile caches
    profile.carbonSaved = carbonSaved;
    profile.revenue = revenue;
    await profile.save();

    return res.status(200).json({
      profile,
      metrics: {
        uploadedWasteCount,
        revenue,
        carbonSaved,
        pendingCount: pendingTransactions.length,
        completedCount: completedTransactions.length
      },
      nearbyIndustries: nearby
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update Industry profile
// @route   PUT /api/industry/profile
// @access  Private (Industry User)
const updateProfile = async (req, res) => {
  const { companyName, address, city, latitude, longitude, contactPhone, industryType, description } = req.body;

  try {
    const profile = await Industry.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (companyName) profile.companyName = companyName;
    if (address) profile.address = address;
    if (city) profile.city = city;
    if (contactPhone) profile.contactPhone = contactPhone;
    if (industryType) profile.industryType = industryType;
    if (description) profile.description = description;

    if (latitude !== undefined && longitude !== undefined) {
      profile.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get nearby industries
// @route   GET /api/industry/nearby
// @access  Private (Industry User)
const getNearbyIndustries = async (req, res) => {
  try {
    const profile = await Industry.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const maxDist = parseFloat(req.query.distance) || 50; // default 50km
    const coords = profile.location.coordinates;

    const nearby = await Industry.find({
      user: { $ne: req.user._id },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coords
          },
          $maxDistance: maxDist * 1000
        }
      }
    }).populate('user', 'email');

    return res.status(200).json(nearby);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardMetrics,
  updateProfile,
  getNearbyIndustries
};
