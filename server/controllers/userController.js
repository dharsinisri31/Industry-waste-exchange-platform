const User = require('../models/User');
const Industry = require('../models/Industry');
const Admin = require('../models/Admin');

// @desc    Get user profile details
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profile = null;
    if (user.role === 'admin') {
      profile = await Admin.findOne({ user: user._id });
    } else {
      profile = await Industry.findOne({ user: user._id });
    }

    return res.status(200).json({ user, profile });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { companyName, address, city, contactPhone, industryType, description, latitude, longitude } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profile = await Industry.findOne({ user: user._id });
    if (!profile) {
      profile = new Industry({ user: user._id, companyName: companyName || 'Company' });
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

    return res.status(200).json({ user, profile });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsers
};
