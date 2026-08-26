const Waste = require('../models/Waste');
const Transaction = require('../models/Transaction');
const Industry = require('../models/Industry');
const Notification = require('../models/Notification');
const WasteResourcePassport = require('../models/WasteResourcePassport');
const { uploadToCloudinary } = require('../config/cloudinary');
const { predictPrice, optimizeRoute } = require('../services/aiService');
const { calculateCarbonSaved } = require('../utils/carbonCalculator');
const { geocodeAddress } = require('../services/geocodingService');
const { calculateRoadRoute } = require('../services/routingService');
const calculateDistance = require('../utils/calculateDistance');
const getPaginationOptions = require('../utils/pagination');
const { CANONICAL_CATEGORIES, normalizeCategory } = require('../constants/categories');

// @desc    Classify material image with FastAPI / AI service
// @route   POST /api/waste/classify-image
// @access  Private
const classifyWasteImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided for classification' 
      });
    }

    const { classifyImage } = require('../services/aiService');
    const result = await classifyImage(req.file.path);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Image classification controller error:', error);
    return res.status(500).json({
      success: false,
      status: 'ai_unavailable',
      message: 'Visual classification pipeline encountered an error.',
      error: error.message
    });
  }
};

// @desc    Create a new waste listing with automatic geocoding, circularity score, & anomaly detection
// @route   POST /api/waste
// @access  Private (Industry User)
const createListing = async (req, res) => {
  const {
    name,
    category,
    subCategory,
    quantity,
    unit,
    address,
    city,
    latitude,
    longitude,
    price,
    pricingMode,
    auctionStartingPrice,
    auctionReservePrice,
    auctionDurationHours,
    qualityGrade,
    description,
    purity,
    contamination,
    sourceIndustry,
    industrialSource,
    composition,
    imageUrl: bodyImageUrl
  } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ success: false, message: 'Waste stream name/title is required' });
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({ success: false, message: 'Valid quantity greater than 0 is required' });
    }

    const isAuction = pricingMode === 'auction';
    const priceNum = parseFloat(price);

    if (isAuction) {
      if (isNaN(parseFloat(auctionStartingPrice)) || parseFloat(auctionStartingPrice) < 0) {
        return res.status(400).json({ success: false, message: 'Valid starting bid price is required for Auction' });
      }
    } else {
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ success: false, message: 'Valid asking price is required for Fixed Price listings' });
      }
    }

    // Normalize category into canonical category
    const cleanCategory = normalizeCategory(category, name);

    let imageUrl = '';
    if (req.file) {
      const { isConfigured } = require('../config/cloudinary');
      if (isConfigured) {
        try {
          const cloudUrl = await uploadToCloudinary(req.file.path);
          imageUrl = cloudUrl || `/uploads/waste/${req.file.filename}`;
        } catch (cErr) {
          imageUrl = `/uploads/waste/${req.file.filename}`;
        }
      } else {
        imageUrl = `/uploads/waste/${req.file.filename}`;
      }
    } else if (bodyImageUrl) {
      imageUrl = bodyImageUrl;
    }

    let lngNum = parseFloat(longitude);
    let latNum = parseFloat(latitude);

    const userProfile = await Industry.findOne({ user: req.user._id });

    // Coordinates fallback
    if (isNaN(lngNum) || isNaN(latNum) || (lngNum === 0 && latNum === 0)) {
      if (userProfile && userProfile.location && userProfile.location.coordinates) {
        lngNum = userProfile.location.coordinates[0];
        latNum = userProfile.location.coordinates[1];
      } else {
        const coords = await geocodeAddress({ address: address || 'GIDC', city: city || 'Vadodara' });
        lngNum = coords[0] || 77.5946;
        latNum = coords[1] || 12.9716;
      }
    }

    let predictedPrice = 0;
    try {
      predictedPrice = await predictPrice(cleanCategory, qtyNum);
    } catch (pErr) {
      predictedPrice = priceNum;
    }

    // Purity & Contamination
    const purityVal = typeof purity === 'object' ? (purity?.estimated || 94.5) : (purity ? parseFloat(purity) : 94.5);
    const contamVal = typeof contamination === 'object' ? (contamination?.percentage || 5.0) : (contamination ? parseFloat(contamination) : 5.0);
    const circularityScore = Math.min(100, Math.round(
      0.35 * purityVal +
      0.25 * Math.max(0, 100 - contamVal * 3) +
      0.25 * 88 +
      0.15 * 90
    ));

    const anomalyReasons = [];
    if (predictedPrice > 0 && priceNum > predictedPrice * 1.8) {
      anomalyReasons.push(`Listed price (₹${priceNum}) significantly exceeds AI fair market valuation (₹${predictedPrice}).`);
    }

    const isAnomaly = anomalyReasons.length > 0;
    const anomalyStatus = isAnomaly ? 'Flagged for Review' : 'Normal';

    const isHaz = isHazardous === true || isHazardous === 'true' || cleanCategory === 'Chemical Waste' || cleanCategory === 'Fly Ash';
    const complianceInfo = {
      status: isHaz ? 'Verification Required' : 'Verified Standard',
      reason: isHaz 
        ? 'Hazardous/industrial waste stream requires SPCB manifest documentation and UN-certified storage.'
        : 'Material stream complies with standard Plastic / Solid Waste Management guidelines.',
      sources: isHaz ? ['hazardous_waste_rules.pdf', 'industrial_guidelines.pdf'] : ['plastic_waste_rules.pdf']
    };

    const waste = await Waste.create({
      uploader: req.user._id,
      name: name.trim(),
      category: cleanCategory,
      subCategory: subCategory || 'General Industrial',
      quantity: qtyNum,
      unit: unit || 'kg',
      pricingMode: pricingMode || 'fixed',
      price: priceNum,
      predictedPrice: predictedPrice || priceNum,
      auctionInfo: pricingMode === 'auction' ? {
        startingPrice: parseFloat(startingPrice) || priceNum,
        currentBid: parseFloat(startingPrice) || priceNum,
        minIncrement: parseFloat(minIncrement) || 1,
        reservePrice: parseFloat(reservePrice) || (priceNum * 1.1),
        status: 'live'
      } : undefined,
      qualityGrade: qualityGrade || 'Grade A',
      address: address || (userProfile ? userProfile.address : 'Industrial Zone'),
      city: city || (userProfile ? userProfile.city : 'Vadodara'),
      location: {
        type: 'Point',
        coordinates: [lngNum, latNum]
      },
      imageUrl,
      description: description || `Industrial ${cleanCategory} byproduct stream ready for circular procurement.`,
      status: 'pending', // Pending initial admin approval
      purity: { estimated: purityVal },
      contamination: { percentage: contamVal },
      circularityScore,
      circularityExplanation: `High recovery yield (${circularityScore}%) with low contamination.`,
      anomalyInfo: {
        isAnomaly,
        status: anomalyStatus,
        reasons: anomalyReasons
      },
      complianceInfo
    });

    // Generate Passport
    const passportId = `PASSPORT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const sourceIndustryName = userProfile ? userProfile.companyName : (req.user.companyName || 'Industrial Generator');

    try {
      const passport = await WasteResourcePassport.create({
        passportId,
        waste: waste._id,
        qrCodeData: `https://platform.industrialwaste.ai/passport/${passportId}`,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${passportId}`,
        material: cleanCategory,
        subMaterial: subCategory || 'General Industrial',
        sourceIndustry: sourceIndustryName,
        category: cleanCategory,
        quantity: qtyNum,
        unit: unit || 'kg',
        purity: purityVal,
        contamination: contamVal,
        qualityGrade: qualityGrade || 'Grade A',
        damageScore: 0.2,
        recyclability: 90.0,
        recoveryYield: 92.0,
        estimatedValue: (priceNum || 35) * (qtyNum || 100),
        predictedPrice: predictedPrice || priceNum || 35,
        carbonSavingKg: Math.round((qtyNum || 100) * 1.5),
        currentStatus: 'Generated',
        aiConfidence: 0.94,
        verificationStatus: 'AI Estimated'
      });

      waste.passportId = passport.passportId;
      await waste.save();
    } catch (passportErr) {
      console.warn('Passport auto-generation warning:', passportErr.message);
      waste.passportId = passportId;
      await waste.save();
    }

    return res.status(201).json(waste);
  } catch (error) {
    console.error('Create listing detailed exception:\n', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Waste listing creation failed', 
      error: error.message 
    });
  }
};

// @desc    Get logged-in seller's waste listings
// @route   GET /api/waste/my/listings
// @access  Private (Industry User)
const getMyListings = async (req, res) => {
  try {
    const listings = await Waste.find({
      uploader: req.user._id
    }).populate('uploader', 'email role roles isVerified').sort({ createdAt: -1 });

    const userProfile = await Industry.findOne({ user: req.user._id }).select('companyName industryType city address');

    // Check for active or completed transactions on each listing
    const wasteIds = listings.map(l => l._id);
    const completedTransactions = await Transaction.find({
      waste: { $in: wasteIds },
      status: { $in: ['delivered', 'completed', 'order_placed', 'confirmed', 'in_transit'] }
    }).select('waste status');

    const transactionMap = new Map();
    completedTransactions.forEach(t => transactionMap.set(t.waste.toString(), t.status));

    const enrichedListings = listings.map(l => {
      const obj = l.toObject();
      if (userProfile) {
        obj.sellerCompany = userProfile;
        obj.uploader = {
          ...obj.uploader,
          companyName: userProfile.companyName,
          industryType: userProfile.industryType,
          city: userProfile.city,
          address: userProfile.address
        };
      }
      if (transactionMap.has(l._id.toString())) {
        const txStatus = transactionMap.get(l._id.toString());
        if (txStatus === 'delivered' || txStatus === 'completed') {
          obj.status = 'exchanged';
        }
      }
      return obj;
    });

    return res.status(200).json(enrichedListings);
  } catch (error) {
    console.error('getMyListings error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get marketplace waste listings using MongoDB 2dsphere $near query
// @route   GET /api/waste/marketplace
// @access  Public
const getMarketplace = async (req, res) => {
  const { search, category, lng, lat, maxDistance, minPrice, maxPrice, minPurity, minCircularity, qualityGrade } = req.query;

  try {
    const query = { status: { $in: ['active', 'available', 'approved'] } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { subCategory: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') {
      const canonical = normalizeCategory(category);
      const searchTerms = category.split(/[\/\&]/).map(s => s.trim()).filter(Boolean);
      query.$or = [
        { category: canonical },
        ...searchTerms.map(term => ({ category: new RegExp(term, 'i') })),
        { category: new RegExp(category, 'i') }
      ];
    }

    if (minPrice) {
      query.price = { ...query.price, $gte: parseFloat(minPrice) };
    }
    if (maxPrice) {
      query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    }
    if (minPurity) {
      query['purity.estimated'] = { $gte: parseFloat(minPurity) };
    }
    if (minCircularity) {
      query.circularityScore = { $gte: parseFloat(minCircularity) };
    }
    if (qualityGrade && qualityGrade !== 'All') {
      query.qualityGrade = qualityGrade;
    }

    if (lng && lat && maxDistance) {
      const lngNum = parseFloat(lng);
      const latNum = parseFloat(lat);
      const distMeters = parseFloat(maxDistance) * 1000;

      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lngNum, latNum]
          },
          $maxDistance: distMeters
        }
      };
    }

    const listings = await Waste.find(query).populate('uploader', 'email role roles isVerified').sort({ createdAt: -1 });

    const uploaderIds = listings.map(l => l.uploader?._id || l.uploader).filter(Boolean);
    const industries = await Industry.find({ user: { $in: uploaderIds } }).select('user companyName industryType city address');
    const industryMap = new Map();
    industries.forEach(ind => industryMap.set(ind.user.toString(), ind));

    const enrichedListings = listings.map(l => {
      const obj = l.toObject();
      const uId = l.uploader?._id ? l.uploader._id.toString() : (l.uploader ? l.uploader.toString() : null);
      if (uId && industryMap.has(uId)) {
        const ind = industryMap.get(uId);
        obj.sellerCompany = ind;
        obj.uploader = {
          ...obj.uploader,
          companyName: ind.companyName,
          industryType: ind.industryType,
          city: ind.city,
          address: ind.address
        };
      }
      return obj;
    });

    return res.status(200).json({
      listings: enrichedListings,
      count: enrichedListings.length
    });
  } catch (error) {
    console.error('getMarketplace error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get waste listing by ID
// @route   GET /api/waste/:id
// @access  Public
const getListingById = async (req, res) => {
  try {
    const waste = await Waste.findById(req.params.id).populate('uploader', 'email role roles isVerified');
    if (!waste) {
      return res.status(404).json({ success: false, message: 'Waste listing not found' });
    }

    const wasteObj = waste.toObject();

    // Populate seller company details from Industry collection
    if (waste.uploader) {
      const uploaderId = waste.uploader._id || waste.uploader;
      const industry = await Industry.findOne({ user: uploaderId }).select('companyName industryType city address registrationNumber');
      if (industry) {
        wasteObj.sellerCompany = industry;
        wasteObj.uploader = {
          ...wasteObj.uploader,
          companyName: industry.companyName,
          industryType: industry.industryType,
          city: industry.city,
          address: industry.address,
          registrationNumber: industry.registrationNumber
        };
      }
    }

    return res.status(200).json(wasteObj);
  } catch (error) {
    console.error('getListingById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request a waste exchange transaction
// @route   POST /api/waste/:id/exchange
// @access  Private (Industry Buyer)
const requestExchange = async (req, res) => {
  try {
    const waste = await Waste.findById(req.params.id);
    if (!waste) {
      return res.status(404).json({ message: 'Waste listing not found' });
    }

    const buyerProfile = await Industry.findOne({ user: req.user._id });
    const originCoords = waste.location ? waste.location.coordinates : [77.5946, 12.9716];
    const destCoords = buyerProfile && buyerProfile.location ? buyerProfile.location.coordinates : [77.6000, 12.9800];

    const routeInfo = await calculateRoadRoute(originCoords, destCoords);

    // Enhanced Carbon Calculation Breakdown:
    // Virgin Material Production Emissions: 1.8 kg CO2e / kg
    // Transport Emissions: routeInfo.co2EmissionsKg
    // Processing Emissions: 0.15 kg CO2e / kg
    const virginEmissionsKg = Math.round(waste.quantity * 1.8);
    const transportEmissionsKg = Math.round(routeInfo.co2EmissionsKg);
    const processingEmissionsKg = Math.round(waste.quantity * 0.15);
    const netEstimatedCarbonSavingsKg = Math.max(0, virginEmissionsKg - transportEmissionsKg - processingEmissionsKg);

    const exchangeId = `EX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const wasteCost = (waste.price || 0) * (waste.quantity || 1);
    const transportCost = routeInfo.transportCostUsd || 1500;
    const totalPrice = wasteCost + transportCost;

    const transaction = await Transaction.create({
      exchangeId,
      orderId: exchangeId,
      batchId: waste.batchId || `EL-BATCH-${Date.now().toString().slice(-4)}`,
      waste: waste._id,
      seller: waste.uploader,
      buyer: req.user._id,
      quantity: waste.quantity,
      unit: waste.unit || 'kg',
      unitPrice: waste.price,
      wasteCost,
      transportCost,
      totalPrice,
      distanceKm: routeInfo.distanceKm || 45,
      carbonSavedKg: netEstimatedCarbonSavingsKg,
      orderStatus: 'Order Placed',
      status: 'order_placed',
      paymentStatus: 'Pending',
      statusHistory: [
        {
          status: 'Order Placed',
          title: 'Order Placed by Buyer',
          note: `Procurement order created for ${waste.quantity} ${waste.unit || 'kg'} of ${waste.name}. Total amount: ₹${totalPrice.toLocaleString()}.`,
          actor: req.user.name || 'Buyer',
          changedBy: req.user._id,
          changedByName: req.user.name || req.user.email,
          timestamp: new Date()
        }
      ],
      timeline: [
        {
          stage: 'Order Placed',
          title: 'Order Initiated',
          description: `Order ${exchangeId} placed for ${waste.name}. Total: ₹${totalPrice.toLocaleString()}.`,
          timestamp: new Date(),
          locationName: 'EcoLink Marketplace',
          actor: req.user.name || 'Buyer'
        }
      ]
    });

    // Notify seller
    await Notification.create({
      user: waste.uploader,
      recipient: waste.uploader,
      title: '📦 New Waste Order Placed',
      message: `Buyer has placed an order (${exchangeId}) for "${waste.name}". Proceed to await payment or review details.`,
      type: 'order',
      relatedEntity: 'Transaction',
      relatedEntityId: transaction._id.toString(),
      link: `/exchange/${exchangeId}`
    });

    return res.status(201).json(transaction);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  classifyWasteImage,
  createListing,
  getMyListings,
  getMarketplace,
  getListingById,
  requestExchange
};
