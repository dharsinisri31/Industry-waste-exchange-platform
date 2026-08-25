const Industry = require('../models/Industry');
const Waste = require('../models/Waste');
const Equipment = require('../models/Equipment');
const { geocodeAddress } = require('../services/geocodingService');
const { calculateRoadRoute } = require('../services/routingService');

// @desc    Get live GIS map data (Industries, Waste Listings, Equipment)
// @route   GET /api/gis/map-data
// @access  Public / Private
const getMapData = async (req, res) => {
  try {
    const industries = await Industry.find().populate('user', 'email').limit(50);
    const wastes = await Waste.find({ status: 'available' }).populate('uploader', 'email').limit(50);
    const equipment = await Equipment.find({ status: 'available' }).populate('owner', 'email').limit(50);

    const mapData = {
      industries: industries.map(ind => ({
        _id: ind._id,
        name: ind.companyName,
        type: 'Industry',
        industryType: ind.industryType,
        city: ind.city,
        coordinates: ind.location ? ind.location.coordinates : [77.5946, 12.9716],
        contactPhone: ind.contactPhone,
        address: ind.address
      })),
      wastes: wastes.map(w => ({
        _id: w._id,
        name: w.name,
        type: 'Waste Listing',
        category: w.category,
        quantity: w.quantity,
        unit: w.unit,
        price: w.price,
        city: w.city,
        coordinates: w.location ? w.location.coordinates : [77.5946, 12.9716]
      })),
      equipment: equipment.map(eq => ({
        _id: eq._id,
        name: eq.title,
        type: 'Equipment',
        equipmentType: eq.equipmentType,
        hourlyRate: eq.hourlyRate,
        dailyRate: eq.dailyRate,
        city: eq.city,
        coordinates: eq.location ? eq.location.coordinates : [77.5946, 12.9716]
      }))
    };

    return res.status(200).json(mapData);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get nearby industries using MongoDB 2dsphere $near query
// @route   GET /api/gis/nearby-industries
// @access  Public / Private
const getNearbyIndustries = async (req, res) => {
  try {
    const { longitude, latitude, maxDistanceKm = 100 } = req.query;

    const lon = parseFloat(longitude || 77.5946);
    const lat = parseFloat(latitude || 12.9716);
    const maxMeters = parseFloat(maxDistanceKm) * 1000.0;

    const nearby = await Industry.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          $maxDistance: maxMeters
        }
      }
    }).limit(20);

    return res.status(200).json(nearby);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Calculate OSRM real-time road route
// @route   POST /api/gis/calculate-route
// @access  Public / Private
const calculateRoute = async (req, res) => {
  try {
    const { origin, destination } = req.body; // origin: [lon, lat], destination: [lon, lat]

    if (!origin || !destination) {
      return res.status(400).json({ message: 'Origin and destination coordinates are required' });
    }

    const routeData = await calculateRoadRoute(origin, destination);
    return res.status(200).json(routeData);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Calculate carbon emissions based on distance, quantity, and vehicle
// @route   POST /api/gis/calculate-carbon
// @access  Public / Private
const calculateCarbon = async (req, res) => {
  try {
    const { distanceKm, quantityTons, fuelType = 'diesel' } = req.body;

    const dist = parseFloat(distanceKm || 10.0);
    const qty = parseFloat(quantityTons || 1.0);

    const fuelLiters = dist * 0.35;
    const co2EmissionsKg = fuelLiters * 2.68;
    const landfillCo2AvoidedKg = qty * 850.0; // 850 kg CO2e avoided per ton recycled vs landfill
    const netCarbonSavedKg = Math.max(0.0, landfillCo2AvoidedKg - co2EmissionsKg);

    return res.status(200).json({
      distanceKm: dist,
      quantityTons: qty,
      fuelConsumptionLiters: parseFloat(fuelLiters.toFixed(2)),
      co2EmissionsKg: parseFloat(co2EmissionsKg.toFixed(2)),
      landfillCo2AvoidedKg: parseFloat(landfillCo2AvoidedKg.toFixed(2)),
      netCarbonSavedKg: parseFloat(netCarbonSavedKg.toFixed(2)),
      greenCreditsEarned: parseFloat((netCarbonSavedKg / 500.0).toFixed(2))
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMapData,
  getNearbyIndustries,
  calculateRoute,
  calculateCarbon
};
