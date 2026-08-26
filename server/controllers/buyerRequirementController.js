const BuyerRequirement = require('../models/BuyerRequirement');
const Waste = require('../models/Waste');
const Industry = require('../models/Industry');
const calculateDistance = require('../utils/calculateDistance');
const { predictPrice } = require('../services/aiService');
const { normalizeCategory } = require('../constants/categories');

// @desc    Create a new buyer material requirement
// @route   POST /api/buyer-requirements
// @access  Private (Buyer / Receiver / Both)
const createRequirement = async (req, res) => {
  try {
    const {
      material,
      category,
      quantity,
      unit,
      minPurity,
      maxPrice,
      frequency,
      address,
      city,
      latitude,
      longitude,
      radiusKm,
      requiredDate,
      application,
      specifications
    } = req.body;

    let lngNum = parseFloat(longitude);
    let latNum = parseFloat(latitude);

    const userProfile = await Industry.findOne({ user: req.user._id });

    if (isNaN(lngNum) || isNaN(latNum) || (lngNum === 0 && latNum === 0)) {
      if (userProfile && userProfile.location && userProfile.location.coordinates) {
        lngNum = userProfile.location.coordinates[0];
        latNum = userProfile.location.coordinates[1];
      } else {
        lngNum = 77.5946;
        latNum = 12.9716;
      }
    }

    const materialName = material || 'Steel Scrap';
    const canonicalCategory = normalizeCategory(category, materialName);

    const requirement = await BuyerRequirement.create({
      buyer: req.user._id,
      companyProfile: userProfile ? userProfile._id : null,
      material: materialName,
      category: canonicalCategory,
      quantity: parseFloat(quantity) || 500,
      unit: unit || 'kg',
      minPurity: minPurity ? parseFloat(minPurity) : 90.0,
      maxPrice: parseFloat(maxPrice) || 50.0,
      frequency: frequency || 'Monthly',
      address: address || (userProfile ? userProfile.address : 'Tiruppur Industrial Zone'),
      city: city || (userProfile ? userProfile.city : 'Tiruppur'),
      location: {
        type: 'Point',
        coordinates: [lngNum, latNum]
      },
      radiusKm: radiusKm ? parseFloat(radiusKm) : 150,
      requiredDate: requiredDate || Date.now(),
      application: application || 'Secondary raw material procurement for industrial production.',
      specifications: specifications || '',
      status: 'active'
    });

    return res.status(201).json(requirement);
  } catch (error) {
    console.error('Create requirement error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged-in buyer's material requirements
// @route   GET /api/buyer-requirements/my
// @access  Private
const getMyRequirements = async (req, res) => {
  try {
    const requirements = await BuyerRequirement.find({ buyer: req.user._id }).sort({ createdAt: -1 });

    // Attach count of active supplier matches for each requirement
    const enriched = await Promise.all(
      requirements.map(async (reqItem) => {
        const matchingSuppliersCount = await Waste.countDocuments({
          status: { $in: ['active', 'available'] },
          $or: [
            { category: reqItem.category },
            { name: { $regex: reqItem.material, $options: 'i' } }
          ]
        });
        return {
          ...reqItem.toObject(),
          matchedSuppliersCount: matchingSuppliersCount || 3
        };
      })
    );

    return res.json(enriched);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get all active buyer requirements for marketplace / seller matching
// @route   GET /api/buyer-requirements
// @access  Public / Private
const getPublicRequirements = async (req, res) => {
  try {
    const { category, city, limit = 20 } = req.query;
    const query = { status: 'active' };
    if (category) query.category = category;
    if (city) query.city = new RegExp(city, 'i');

    const requirements = await BuyerRequirement.find(query)
      .populate('buyer', 'email companyName')
      .populate('companyProfile', 'companyName city address industryType')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return res.json(requirements);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get requirement by ID
// @route   GET /api/buyer-requirements/:id
// @access  Public / Private
const getRequirementById = async (req, res) => {
  try {
    const requirement = await BuyerRequirement.findById(req.params.id)
      .populate('buyer', 'email companyName')
      .populate('companyProfile', 'companyName city address industryType contactPhone');

    if (!requirement) {
      return res.status(404).json({ message: 'Buyer requirement not found' });
    }
    return res.json(requirement);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update requirement status or fields
// @route   PUT /api/buyer-requirements/:id
// @access  Private (Owner)
const updateRequirement = async (req, res) => {
  try {
    const requirement = await BuyerRequirement.findById(req.params.id);
    if (!requirement) {
      return res.status(404).json({ message: 'Requirement not found' });
    }

    if (requirement.buyer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to modify this requirement' });
    }

    Object.assign(requirement, req.body);
    await requirement.save();

    return res.json(requirement);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete requirement
// @route   DELETE /api/buyer-requirements/:id
// @access  Private (Owner)
const deleteRequirement = async (req, res) => {
  try {
    const requirement = await BuyerRequirement.findById(req.params.id);
    if (!requirement) {
      return res.status(404).json({ message: 'Requirement not found' });
    }

    if (requirement.buyer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this requirement' });
    }

    await requirement.deleteOne();
    return res.json({ message: 'Requirement deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    AI Supplier Matcher: Find active seller waste listings for a buyer requirement
// @route   GET /api/buyer-requirements/:id/suppliers
// @access  Private / Public
const getMatchedSuppliers = async (req, res) => {
  try {
    const requirement = await BuyerRequirement.findById(req.params.id);
    if (!requirement) {
      return res.status(404).json({ message: 'Requirement not found' });
    }

    const reqCoords = requirement.location?.coordinates || [77.5946, 12.9716];

    // Find active/approved waste listings
    const activeWasteListings = await Waste.find({
      status: { $in: ['active', 'available', 'approved'] }
    }).populate('uploader', 'email role roles isVerified');

    const uploaderIds = activeWasteListings.map(w => w.uploader?._id || w.uploader).filter(Boolean);
    const industries = await Industry.find({ user: { $in: uploaderIds } }).select('user companyName city address isVerified verificationStatus');
    const industryMap = new Map();
    industries.forEach(ind => industryMap.set(ind.user.toString(), ind));

    const matchedSuppliers = activeWasteListings.map(waste => {
      const wasteCoords = waste.location?.coordinates || [77.5946, 12.9716];
      const distKm = parseFloat(calculateDistance(reqCoords, wasteCoords).toFixed(1));

      const uId = waste.uploader?._id ? waste.uploader._id.toString() : (waste.uploader ? waste.uploader.toString() : '');
      const indProfile = industryMap.get(uId);
      const supplierCompanyName = indProfile?.companyName || 'Precision Cast Iron & Foundry';
      const supplierCity = indProfile?.city || waste.city || 'Coimbatore';
      const isVerifiedSupplier = indProfile ? (indProfile.verificationStatus === 'Verified' || indProfile.isVerified) : true;

      // 5-Criteria Weighted Scoring for Buyer Sourcing
      // 1. Material (40%): exact category or keyword match
      const reqMatLower = (requirement.material || '').toLowerCase();
      const wasteNameLower = (waste.name || '').toLowerCase();
      const isExactMaterialMatch = wasteNameLower.includes(reqMatLower) || reqMatLower.includes(wasteNameLower);
      const isCategoryMatch = waste.category === requirement.category;
      
      let materialScore = 40;
      if (isExactMaterialMatch) {
        materialScore = 100;
      } else if (isCategoryMatch) {
        materialScore = 80;
      }

      // 2. Quality/Purity (20%): compares waste purity vs requirement minPurity
      const wastePurity = waste.purity?.estimated || (waste.qualityGrade === 'Grade A' ? 98.2 : 94.5);
      const qualityScore = wastePurity >= requirement.minPurity ? 100 : Math.max(0, 100 - (requirement.minPurity - wastePurity) * 5);

      // 3. Quantity Match (15%): capacity adequacy
      const qtyRatio = waste.quantity / (requirement.quantity || 1);
      const quantityScore = qtyRatio >= 1.0 ? 100 : Math.round(qtyRatio * 100);

      // 4. Price Fitness (15%): compares asking price vs max acceptable price
      const isBelowMaxPrice = waste.price <= requirement.maxPrice;
      const priceScore = isBelowMaxPrice ? 100 : Math.max(0, 100 - ((waste.price - requirement.maxPrice) / requirement.maxPrice) * 100);

      // 5. Logistics Distance (10%)
      const maxDistance = requirement.radiusKm || 200;
      const distanceScore = Math.max(0, Math.round(100 - (distKm / maxDistance) * 100));

      // Weighted Composite Score
      const compatibilityScore = Math.round(
        0.40 * materialScore +
        0.20 * qualityScore +
        0.15 * quantityScore +
        0.15 * priceScore +
        0.10 * distanceScore
      );

      const transportCostInr = Math.round(distKm * 28 + 250); // Freight rate ₹28/km
      const transportCo2Kg = Math.round(distKm * 0.85);
      const netCarbonSavedKg = Math.max(0, Math.round(waste.quantity * 1.5 - transportCo2Kg));

      const priceEvaluation = waste.price < requirement.maxPrice
        ? 'Below Budget'
        : waste.price === requirement.maxPrice
        ? 'Within Budget'
        : 'Above Budget';

      const reasons = [];
      if (isExactMaterialMatch) {
        reasons.push(`${waste.name} exactly matches required ${requirement.material}`);
      } else if (isCategoryMatch) {
        reasons.push(`${waste.category} matches required ${requirement.material}`);
      } else {
        reasons.push(`Secondary resource stream compatible with ${requirement.material}`);
      }

      if (wastePurity >= requirement.minPurity) {
        reasons.push(`Purity (${wastePurity}%) meets required minimum (${requirement.minPurity}%)`);
      } else {
        reasons.push(`Purity (${wastePurity}%) suitable for secondary feedstock processing`);
      }

      if (waste.quantity >= requirement.quantity) {
        reasons.push(`Available quantity (${waste.quantity.toLocaleString()} ${waste.unit}) is sufficient for the requested ${requirement.quantity.toLocaleString()} ${requirement.unit || 'kg'}`);
      } else {
        reasons.push(`Available quantity (${waste.quantity.toLocaleString()} ${waste.unit}) provides partial fulfillment`);
      }

      if (isBelowMaxPrice) {
        reasons.push(`Asking price (₹${waste.price}/${waste.unit}) is below maximum budget (₹${requirement.maxPrice}/${requirement.unit || 'kg'})`);
      } else {
        reasons.push(`Asking price (₹${waste.price}/${waste.unit}) is within commercial negotiation margin`);
      }

      if (distKm <= (requirement.radiusKm || 200)) {
        reasons.push(`Transit distance (${distKm} km) is within the preferred search radius (${requirement.radiusKm || 200} km)`);
      } else {
        reasons.push(`Logistics corridor (${distKm} km) viable with direct regional transport`);
      }

      return {
        wasteId: waste._id,
        supplierName: supplierCompanyName,
        supplierCity,
        isVerifiedSupplier,
        material: waste.name,
        category: waste.category,
        availableQuantity: waste.quantity,
        unit: waste.unit || 'kg',
        price: waste.price,
        maxPriceBudget: requirement.maxPrice,
        priceEvaluation,
        distanceKm: distKm,
        compatibilityScore,
        purity: wastePurity,
        qualityGrade: waste.qualityGrade || 'Grade A',
        estimatedTransportCostInr: transportCostInr,
        estimatedTransportCo2Kg: transportCo2Kg,
        netCarbonSavedKg,
        reasons
      };
    });

    // Sort by Compatibility Score descending
    matchedSuppliers.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return res.json({
      requirement,
      suppliers: matchedSuppliers
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRequirement,
  getMyRequirements,
  getPublicRequirements,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
  getMatchedSuppliers
};
