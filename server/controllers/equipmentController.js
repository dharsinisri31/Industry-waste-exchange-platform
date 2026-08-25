const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');
const Waste = require('../models/Waste');

// Haversine distance calculator helper
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// @desc    Get all available equipment listings
// @route   GET /api/equipment
// @access  Public / Private
const getEquipmentListings = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { status: 'available' };

    if (category && category !== 'All') {
      query.equipmentType = category;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const equipment = await Equipment.find(query).populate('owner', 'email companyName phone').sort({ createdAt: -1 });
    return res.status(200).json(equipment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Create new equipment listing
// @route   POST /api/equipment
// @access  Private
const createEquipment = async (req, res) => {
  try {
    const { title, equipmentType, description, hourlyRate, dailyRate, address, city, latitude, longitude } = req.body;

    const lat = parseFloat(latitude) || 12.9716;
    const lng = parseFloat(longitude) || 77.5946;

    const equipment = await Equipment.create({
      owner: req.user._id,
      title,
      equipmentType: equipmentType || 'Other',
      description,
      hourlyRate: parseFloat(hourlyRate || 0),
      dailyRate: parseFloat(dailyRate || 0),
      address: address || 'Industrial Zone',
      city: city || 'City Hub',
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined
    });

    return res.status(201).json(equipment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Book equipment with schedule overlap validation
// @route   POST /api/equipment/:id/book
// @access  Private
const bookEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment listing not found' });
    }

    const { startDate, endDate, totalPrice } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid start or end date' });
    }

    if (start >= end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Check overlapping active/pending bookings
    const overlapping = await Booking.findOne({
      equipment: equipment._id,
      status: { $in: ['pending', 'approved', 'active'] },
      $or: [
        { startDate: { $lt: end }, endDate: { $gt: start } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        message: 'Selected equipment is already booked or reserved for these dates.'
      });
    }

    // Calculate duration in days/hours if totalPrice not explicitly provided
    let calculatedPrice = parseFloat(totalPrice);
    if (isNaN(calculatedPrice) || calculatedPrice <= 0) {
      const diffHours = Math.ceil((end - start) / (1000 * 60 * 60));
      calculatedPrice = diffHours <= 24 ? diffHours * equipment.hourlyRate : Math.ceil(diffHours / 24) * equipment.dailyRate;
    }

    const booking = await Booking.create({
      equipment: equipment._id,
      renter: req.user._id,
      owner: equipment.owner,
      startDate: start,
      endDate: end,
      totalPrice: calculatedPrice,
      status: 'pending'
    });

    return res.status(201).json(booking);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status (Approve, Reject, Complete, Cancel)
// @route   PATCH /api/equipment/bookings/:id/status
// @access  Private
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['approved', 'rejected', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // User must be renter or owner of equipment
    if (booking.owner.toString() !== req.user._id.toString() && booking.renter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this booking' });
    }

    booking.status = status;
    await booking.save();

    return res.status(200).json(booking);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's bookings (as renter or owner)
// @route   GET /api/equipment/my/bookings
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ renter: req.user._id }, { owner: req.user._id }]
    })
      .populate('equipment')
      .populate('renter', 'email companyName')
      .populate('owner', 'email companyName')
      .sort({ createdAt: -1 });

    return res.status(200).json(bookings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    AI Equipment Recommendation based on waste material & processing requirements
// @route   GET /api/equipment/recommend
// @access  Public / Private
const recommendEquipment = async (req, res) => {
  try {
    const { wasteId, material, processType, latitude, longitude } = req.query;

    let targetMaterial = material || 'Plastic';
    let targetProcess = processType || 'Shredder';
    let userLat = parseFloat(latitude || 11.0168);
    let userLng = parseFloat(longitude || 76.9558);

    if (wasteId) {
      const wasteItem = await Waste.findById(wasteId);
      if (wasteItem) {
        targetMaterial = wasteItem.category || wasteItem.name;
        if (wasteItem.location && wasteItem.location.coordinates) {
          userLng = wasteItem.location.coordinates[0];
          userLat = wasteItem.location.coordinates[1];
        }
      }
    }

    // Material to equipment type mapping rules
    const categoryMapping = {
      Plastic: ['Dual-Shaft Shredder', 'Extruder & Pelletizer', 'Hydraulic Press'],
      PET: ['Dual-Shaft Shredder', 'Extruder & Pelletizer'],
      HDPE: ['Dual-Shaft Shredder', 'Extruder & Pelletizer'],
      Metal: ['Hydraulic Press', 'Ball Mill'],
      Textile: ['Dual-Shaft Shredder'],
      Chemical: ['Solvent Distillation Unit'],
      Organic: ['Pyrolysis Reactor', 'Ball Mill'],
      FlyAsh: ['Hydraulic Press', 'Ball Mill']
    };

    const preferredTypes = categoryMapping[targetMaterial] || ['Dual-Shaft Shredder', 'Hydraulic Press', 'Other'];

    const allEquipment = await Equipment.find({ status: 'available' }).populate('owner', 'email companyName');

    const ranked = allEquipment.map((eq) => {
      let compatibilityScore = 0.60; // baseline

      if (preferredTypes.includes(eq.equipmentType)) {
        compatibilityScore += 0.25;
      }

      if (targetProcess && eq.title.toLowerCase().includes(targetProcess.toLowerCase())) {
        compatibilityScore += 0.10;
      }

      const eqLat = eq.location?.coordinates?.[1] || 11.0;
      const eqLng = eq.location?.coordinates?.[0] || 77.0;
      const distanceKm = calculateDistance(userLat, userLng, eqLat, eqLng);

      // Distance penalty
      if (distanceKm < 50) compatibilityScore += 0.05;

      compatibilityScore = Math.min(0.98, Math.max(0.50, compatibilityScore));

      return {
        ...eq.toObject(),
        compatibilityScore: parseFloat(compatibilityScore.toFixed(2)),
        distanceKm: parseFloat(distanceKm.toFixed(1))
      };
    });

    ranked.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return res.status(200).json(ranked);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEquipmentListings,
  createEquipment,
  bookEquipment,
  updateBookingStatus,
  getMyBookings,
  recommendEquipment
};
