const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Industry = require('../models/Industry');
const Waste = require('../models/Waste');
const BuyerRequirement = require('../models/BuyerRequirement');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

// @desc    Seed comprehensive, realistic demo data for platform prototype showcase
// @route   POST /api/demo/seed
// @access  Public / Development / Admin
const seedDemoData = async (req, res) => {
  try {
    // 1. Clean existing demo data by isDemo or demo email domain
    await Promise.all([
      User.deleteMany({ $or: [{ isDemo: true }, { email: { $regex: /@ecolink\.market$/i } }] }),
      Industry.deleteMany({ isDemo: true }),
      Waste.deleteMany({ isDemo: true }),
      BuyerRequirement.deleteMany({ isDemo: true }),
      Transaction.deleteMany({ isDemo: true }),
      Notification.deleteMany({ isDemo: true })
    ]);

    const hashedPassword = await bcrypt.hash('Demo@12345', 10);

    // 2. Create Demo Producers
    const producerData = [
      {
        name: 'Apex Plastics Operator',
        email: 'demo.apex@ecolink.market',
        companyName: 'Apex Plastics Pvt. Ltd.',
        role: 'sender',
        sector: 'Polymer Extrusion & Injection Molding',
        cin: 'U25200GJ2014PTC078912',
        address: 'Plot 42, GIDC Industrial Estate, Makarpura',
        city: 'Vadodara',
        coordinates: [73.1812, 22.3072],
        phone: '+91 98250 11223',
        description: 'Manufacturer of high-density polyethylene drums and industrial packaging polymers.'
      },
      {
        name: 'Erode Mfg Lead',
        email: 'demo.erode@ecolink.market',
        companyName: 'Erode Industrial Manufacturing',
        role: 'sender',
        sector: 'Foundry & Heavy Fabrication',
        cin: 'U28110TN2012PTC085412',
        address: 'SIPCOT Industrial Growth Centre, Perundurai',
        city: 'Erode',
        coordinates: [77.7172, 11.3410],
        phone: '+91 98420 33445',
        description: 'Precision casting and foundry producing ferrous scrap and casting slag byproducts.'
      },
      {
        name: 'South India Textile Lead',
        email: 'demo.textile@ecolink.market',
        companyName: 'South India Textile Works',
        role: 'sender',
        sector: 'Yarn & Industrial Fabrics',
        cin: 'U17111TN2016PTC099214',
        address: 'Apparel Park, Netaji Apparel Avenue',
        city: 'Tirupur',
        coordinates: [77.3411, 11.1085],
        phone: '+91 98430 55667',
        description: 'Cotton and polyester textile mill generating fabric cutoffs and secondary fiber bales.'
      },
      {
        name: 'GreenPack Ops',
        email: 'demo.greenpack@ecolink.market',
        companyName: 'GreenPack Industries',
        role: 'sender',
        sector: 'Corrugated Paper & Packaging',
        cin: 'U21022GJ2018PTC104523',
        address: 'Pandesara GIDC Industrial Area',
        city: 'Surat',
        coordinates: [72.8311, 21.1702],
        phone: '+91 98240 77889',
        description: 'Commercial corrugated paper packaging facility producing craft trimmings and paper offcuts.'
      }
    ];

    // 3. Create Demo Buyers / Recyclers
    const buyerData = [
      {
        name: 'GreenPoly Procurement',
        email: 'demo.greenpoly@ecolink.market',
        companyName: 'GreenPoly Recycling',
        role: 'receiver',
        sector: 'Post-Consumer Polymer Reprocessing',
        cin: 'U37200TN2015PTC091234',
        address: 'SIDCO Industrial Estate, Kurichi',
        city: 'Coimbatore',
        coordinates: [76.9558, 11.0168],
        phone: '+91 98940 11234',
        description: 'Large-scale post-industrial and post-consumer polymer flaking and pelletizing unit.'
      },
      {
        name: 'TN Recovery Lead',
        email: 'demo.tnrecovery@ecolink.market',
        companyName: 'Tamil Nadu Materials Recovery',
        role: 'receiver',
        sector: 'Circular Raw Materials Aggregation',
        cin: 'U38110TN2017PTC112345',
        address: 'Ambattur Industrial Estate',
        city: 'Chennai',
        coordinates: [80.2707, 13.0827],
        phone: '+91 98400 99887',
        description: 'Central materials recovery facility supplying verified secondary feedstock to smelters and mills.'
      },
      {
        name: 'CircularPack Sourcing',
        email: 'demo.circularpack@ecolink.market',
        companyName: 'CircularPack Industries',
        role: 'receiver',
        sector: 'Sustainable Packaging Synthesis',
        cin: 'U25209GJ2019PTC119876',
        address: 'Sanand GIDC Industrial Park II',
        city: 'Ahmedabad',
        coordinates: [72.5714, 23.0225],
        phone: '+91 98251 44556',
        description: 'Manufacturer of 100% recycled industrial rPET thermoformed trays and strapping rolls.'
      },
      {
        name: 'EcoMetal Smelting Ops',
        email: 'demo.ecometal@ecolink.market',
        companyName: 'EcoMetal Recyclers',
        role: 'receiver',
        sector: 'Secondary Metallurgy & Refining',
        cin: 'U27205TN2013PTC088765',
        address: 'Steel Plant Road, Maramangalathupatti',
        city: 'Salem',
        coordinates: [78.1460, 11.6643],
        phone: '+91 98421 66778',
        description: 'Induction furnace facility refining high-grade foundry scrap into precision alloy ingots.'
      }
    ];

    const createdProducers = [];
    for (const p of producerData) {
      const user = await User.create({
        name: p.name,
        email: p.email,
        password: hashedPassword,
        role: 'industry_user',
        isVerified: true,
        isDemo: true
      });

      const industry = await Industry.create({
        user: user._id,
        companyName: p.companyName,
        businessRole: 'sender',
        industryType: p.sector,
        registrationNumber: p.cin,
        address: p.address,
        city: p.city,
        location: { type: 'Point', coordinates: p.coordinates },
        contactPhone: p.phone,
        description: p.description,
        status: 'verified',
        trustMetrics: {
          overallRating: 4.8,
          totalRatingsCount: 19,
          completedExchangesCount: 24,
          onTimeDeliveryRate: 98,
          quantityAccuracyRate: 97,
          verifiedBadge: true
        },
        isDemo: true
      });

      createdProducers.push({ user, industry });
    }

    const createdBuyers = [];
    for (const b of buyerData) {
      const user = await User.create({
        name: b.name,
        email: b.email,
        password: hashedPassword,
        role: 'industry_user',
        isVerified: true,
        isDemo: true
      });

      const industry = await Industry.create({
        user: user._id,
        companyName: b.companyName,
        businessRole: 'receiver',
        industryType: b.sector,
        registrationNumber: b.cin,
        address: b.address,
        city: b.city,
        location: { type: 'Point', coordinates: b.coordinates },
        contactPhone: b.phone,
        description: b.description,
        status: 'verified',
        trustMetrics: {
          overallRating: 4.9,
          totalRatingsCount: 22,
          completedExchangesCount: 28,
          onTimeDeliveryRate: 99,
          quantityAccuracyRate: 98,
          verifiedBadge: true
        },
        isDemo: true
      });

      createdBuyers.push({ user, industry });
    }

    // 4. Create Demo Listings with Batch IDs & Live Auctions
    const apex = createdProducers[0];
    const erode = createdProducers[1];
    const textile = createdProducers[2];
    const greenpack = createdProducers[3];

    const greenpoly = createdBuyers[0];
    const tnrecovery = createdBuyers[1];
    const circularpack = createdBuyers[2];
    const ecometal = createdBuyers[3];

    // Listing 1: Demo PET Scrap with Live Auction
    const petWaste = await Waste.create({
      uploader: apex.user._id,
      batchId: 'EL-BATCH-PET-2026-00042',
      name: 'High-Purity Post-Industrial PET Bottle Scrap',
      category: 'Plastic',
      subCategory: 'Polyethylene Terephthalate (PET)',
      industrialSource: 'Beverage Packaging Molding Facility',
      quantity: 5000,
      unit: 'kg',
      price: 22,
      predictedPrice: 25.50,
      priceRange: { min: 24, max: 27 },
      pricingMode: 'auction',
      auctionInfo: {
        startingPrice: 22,
        currentBid: 25,
        highestBidder: greenpoly.user._id,
        minIncrement: 1,
        reservePrice: 24,
        auctionStart: new Date(Date.now() - 24 * 3600000),
        auctionEnd: new Date(Date.now() + 48 * 3600000),
        status: 'live',
        bids: [
          { bidder: greenpoly.user._id, bidderName: greenpoly.industry.companyName, amount: 23, timestamp: new Date(Date.now() - 18 * 3600000) },
          { bidder: circularpack.user._id, bidderName: circularpack.industry.companyName, amount: 24, timestamp: new Date(Date.now() - 12 * 3600000) },
          { bidder: greenpoly.user._id, bidderName: greenpoly.industry.companyName, amount: 25, timestamp: new Date(Date.now() - 4 * 3600000) }
        ]
      },
      status: 'active',
      qualityGrade: 'Grade A',
      purity: { estimated: 94.5, verified: 94.0 },
      moisture: { estimated: 1.8, verified: 1.5 },
      circularityScore: 94,
      circularityExplanation: 'High chemical purity suitable for direct fiber extrusion or food-grade rPET conversion.',
      verificationStatus: 'Lab Verified',
      address: apex.industry.address,
      city: apex.industry.city,
      location: apex.industry.location,
      description: 'Clean, unprinted transparent PET preform and bottle offcuts from precision blow-molding lines. Free of PVC/polyolefin contamination.',
      isDemo: true
    });

    // Listing 2: Heavy Foundry Scrap (Fixed Price)
    const steelWaste = await Waste.create({
      uploader: erode.user._id,
      batchId: 'EL-BATCH-STL-2026-00043',
      name: 'Precision Cast Iron & Foundry Scrap Trimmings',
      category: 'Metal',
      subCategory: 'Heavy Melting Steel (HMS-1)',
      industrialSource: 'Foundry Finishing & Machining Division',
      quantity: 12000,
      unit: 'kg',
      price: 34,
      predictedPrice: 35.80,
      priceRange: { min: 33, max: 37 },
      pricingMode: 'fixed',
      status: 'active',
      qualityGrade: 'Grade A',
      purity: { estimated: 98.2, verified: 98.0 },
      circularityScore: 91,
      circularityExplanation: 'Low oxidation and high metallic yield suitable for direct induction furnace melting.',
      verificationStatus: 'Lab Verified',
      address: erode.industry.address,
      city: erode.industry.city,
      location: erode.industry.location,
      description: 'Dense, clean foundry gates, risers, and structural cutoffs. Carbon content 0.22%, unpainted and degreased.',
      isDemo: true
    });

    // Listing 3: Thermal Fly Ash (Fixed Price)
    const flyAshWaste = await Waste.create({
      uploader: greenpack.user._id,
      batchId: 'EL-BATCH-ASH-2026-00044',
      name: 'Class F Pozzolanic Thermal Power Fly Ash',
      category: 'Fly Ash',
      subCategory: 'Electrostatic Precipitator Ash',
      industrialSource: 'Captive Thermal Cogeneration Plant',
      quantity: 25000,
      unit: 'kg',
      price: 1.80,
      predictedPrice: 2.10,
      priceRange: { min: 1.70, max: 2.30 },
      pricingMode: 'fixed',
      status: 'active',
      qualityGrade: 'Grade A',
      purity: { estimated: 92.0, verified: 91.5 },
      circularityScore: 89,
      circularityExplanation: 'Meets IS 3812 Part 1 standards for pozzolana cement blending and RMC manufacturing.',
      verificationStatus: 'Lab Verified',
      address: greenpack.industry.address,
      city: greenpack.industry.city,
      location: greenpack.industry.location,
      description: 'Fine siliceous fly ash extracted via multi-field ESP. Low unburnt carbon (< 1.5%), moisture < 0.5%.',
      isDemo: true
    });

    // 5. Create Buyer Requirements
    await BuyerRequirement.create([
      {
        buyer: greenpoly.user._id,
        companyProfile: greenpoly.industry._id,
        material: 'PET Bottle Scrap / Regrind',
        category: 'Plastic',
        quantity: 4000,
        unit: 'kg',
        frequency: 'Monthly',
        minPurity: 90,
        maxPrice: 26,
        address: greenpoly.industry.address,
        city: 'Coimbatore',
        location: greenpoly.industry.location,
        status: 'active',
        isDemo: true
      },
      {
        buyer: ecometal.user._id,
        companyProfile: ecometal.industry._id,
        material: 'Foundry & Heavy Scrap Metal',
        category: 'Metal',
        quantity: 10000,
        unit: 'kg',
        frequency: 'Monthly',
        minPurity: 95,
        maxPrice: 36,
        address: ecometal.industry.address,
        city: 'Salem',
        location: ecometal.industry.location,
        status: 'active',
        isDemo: true
      }
    ]);

    // 6. Create Completed Prototype Showcase Exchange with Full Event Ledger
    const exchangeDate = new Date(Date.now() - 3 * 86400000);

    const completedExchange = await Transaction.create({
      exchangeId: 'EL-EX-2026-00042',
      batchId: 'EL-BATCH-PET-2026-00042',
      waste: petWaste._id,
      seller: apex.user._id,
      buyer: greenpoly.user._id,
      quantity: 5000,
      unit: 'kg',
      totalPrice: 125000,
      pricingMode: 'auction',
      status: 'completed',
      paymentStatus: 'settled',
      paymentAmount: 125000,
      paymentMethod: 'Industrial Escrow (Demo Verified)',
      distanceKm: 326.94,
      carbonSavedKg: 9250,
      transportCost: 11442,
      transportEmissionsKg: 150.39,
      weighment: {
        sellerDeclaredWeight: 5000,
        pickupWeight: 4960,
        receivedWeight: 4930,
        processedWeight: 4800,
        variancePercent: 1.4,
        varianceStatus: 'Normal',
        recordedAt: new Date(exchangeDate.getTime() + 48 * 3600000)
      },
      logistics: {
        status: 'Delivered',
        vehicleNumber: 'TN-38-EX-8842',
        driverName: 'R. Soundararajan',
        driverPhone: '+91 98401 22345',
        carrierName: 'GreenFreight Express Logistics',
        pickupScheduledAt: new Date(exchangeDate.getTime() + 24 * 3600000),
        deliveredAt: new Date(exchangeDate.getTime() + 44 * 3600000),
        currentLocation: {
          lat: 11.0168,
          lng: 76.9558,
          address: 'SIDCO Industrial Estate, Kurichi, Coimbatore'
        },
        distanceTravelledKm: 326.94,
        remainingDistanceKm: 0,
        etaHours: 0
      },
      documents: [
        {
          name: 'Commercial Invoice & Delivery Manifest',
          docType: 'Invoice',
          url: '/uploads/demo_invoice_EL-EX-00042.pdf',
          uploadedBy: apex.user._id,
          uploaderName: apex.industry.companyName,
          uploadedAt: new Date(exchangeDate.getTime() + 2 * 3600000),
          status: 'Verified',
          verifiedBy: 'Platform Compliance Officer',
          verifiedAt: new Date(exchangeDate.getTime() + 4 * 3600000)
        },
        {
          name: 'Electronic Weighbridge Certificate',
          docType: 'Weighment Slip',
          url: '/uploads/demo_weighment_EL-EX-00042.pdf',
          uploadedBy: greenpoly.user._id,
          uploaderName: greenpoly.industry.companyName,
          uploadedAt: new Date(exchangeDate.getTime() + 46 * 3600000),
          status: 'Verified',
          verifiedBy: 'Platform Compliance Officer',
          verifiedAt: new Date(exchangeDate.getTime() + 48 * 3600000)
        },
        {
          name: 'Spectroscopic Purity & Quality Analysis Report',
          docType: 'Material Quality Report',
          url: '/uploads/demo_quality_EL-EX-00042.pdf',
          uploadedBy: apex.user._id,
          uploaderName: apex.industry.companyName,
          uploadedAt: new Date(exchangeDate.getTime() + 6 * 3600000),
          status: 'Verified',
          verifiedBy: 'Platform AI & Quality Team',
          verifiedAt: new Date(exchangeDate.getTime() + 8 * 3600000)
        },
        {
          name: 'Circular Polymer Recovery & Recycling Certificate',
          docType: 'Recycling Certificate',
          url: '/uploads/demo_recycling_cert_EL-EX-00042.pdf',
          uploadedBy: greenpoly.user._id,
          uploaderName: greenpoly.industry.companyName,
          uploadedAt: new Date(exchangeDate.getTime() + 68 * 3600000),
          status: 'Verified',
          verifiedBy: 'CPCB / SPCB Auditor (Demo)',
          verifiedAt: new Date(exchangeDate.getTime() + 70 * 3600000)
        }
      ],
      timeline: [
        {
          stage: 'Created',
          title: 'Batch Generated & Registered',
          description: 'Batch EL-BATCH-PET-2026-00042 created at Apex Plastics injection plant.',
          timestamp: exchangeDate,
          locationName: 'Vadodara Plant, Gujarat',
          actor: 'Apex Plastics Pvt. Ltd.'
        },
        {
          stage: 'Inspected',
          title: 'AI Classification & Lab Quality Verification',
          description: 'AI Computer Vision verified Grade A clear PET (94.5% purity, 1.8% moisture).',
          timestamp: new Date(exchangeDate.getTime() + 2 * 3600000),
          locationName: 'EcoLink AI Hub',
          actor: 'EcoLink AI Vision'
        },
        {
          stage: 'Matched',
          title: 'Smart Recommendation & Matching',
          description: 'Matched with GreenPoly Recycling requirement (94% Compatibility Score).',
          timestamp: new Date(exchangeDate.getTime() + 5 * 3600000),
          locationName: 'Matching Engine',
          actor: 'AI Recommendation Engine'
        },
        {
          stage: 'Auction',
          title: 'Dynamic Auction Won at ₹25/kg',
          description: 'GreenPoly Recycling winning bid accepted. Total value: ₹1,25,000.',
          timestamp: new Date(exchangeDate.getTime() + 18 * 3600000),
          locationName: 'Digital Exchange Platform',
          actor: 'EcoLink Auction Engine'
        },
        {
          stage: 'Payment',
          title: 'Escrow Payment Confirmed (Demo)',
          description: 'Trade settlement amount ₹1,25,000 deposited in secure escrow.',
          timestamp: new Date(exchangeDate.getTime() + 20 * 3600000),
          locationName: 'Settlement Gateway',
          actor: 'Escrow Settlement'
        },
        {
          stage: 'Logistics',
          title: 'Freight Pickup & In-Transit Dispatch',
          description: 'Vehicle TN-38-EX-8842 departed Vadodara facility for 326.94 km highway transit.',
          timestamp: new Date(exchangeDate.getTime() + 26 * 3600000),
          locationName: 'Vadodara Dispatch Dock',
          actor: 'GreenFreight Express Logistics'
        },
        {
          stage: 'Weighment',
          title: 'Electronic Weighment Verified',
          description: 'Receiving weight 4,930 kg recorded (Declared: 5,000 kg, Variance: 1.4% Normal).',
          timestamp: new Date(exchangeDate.getTime() + 46 * 3600000),
          locationName: 'Kurichi Weighbridge Terminal',
          actor: 'Weighbridge Terminal'
        },
        {
          stage: 'Delivered',
          title: 'Consignment Receipt Acknowledged',
          description: 'Delivered at GreenPoly Coimbatore facility. Goods received in sound condition.',
          timestamp: new Date(exchangeDate.getTime() + 48 * 3600000),
          locationName: 'Coimbatore Plant',
          actor: 'GreenPoly Receiving Officer'
        },
        {
          stage: 'Recycling',
          title: 'Pelletizing & Circular Recovery Completed',
          description: '4,800 kg converted into recycled rPET granules. 9,250 kg CO₂e avoided vs virgin resin.',
          timestamp: new Date(exchangeDate.getTime() + 68 * 3600000),
          locationName: 'Extrusion Plant Line 2',
          actor: 'GreenPoly Plant Head'
        },
        {
          stage: 'Rating',
          title: 'Mutual Partner Trust Ratings Recorded',
          description: 'Buyer rated Seller: 5/5 ⭐ | Seller rated Buyer: 5/5 ⭐.',
          timestamp: new Date(exchangeDate.getTime() + 72 * 3600000),
          locationName: 'EcoLink Trust Registry',
          actor: 'Verified Partners'
        }
      ],
      ratings: {
        sellerRating: {
          materialQuality: 5,
          quantityAccuracy: 5,
          communication: 5,
          deliveryReliability: 5,
          overall: 5,
          comment: 'Exceptional purity feedstock. Moisture well within threshold. Highly recommended seller.',
          createdAt: new Date(exchangeDate.getTime() + 72 * 3600000)
        },
        buyerRating: {
          paymentTimeliness: 5,
          communication: 5,
          overall: 5,
          comment: 'Immediate gate clearance and prompt escrow settlement confirmation.',
          createdAt: new Date(exchangeDate.getTime() + 72 * 3600000)
        }
      },
      sustainability: {
        wasteDivertedKg: 5000,
        carbonSavedKg: 9250,
        virginMaterialAvoidedKg: 4250
      },
      isDemo: true
    });

    // 7. Create Demo Notifications
    await Notification.create([
      {
        user: apex.user._id,
        type: 'exchange',
        title: 'Exchange Order Completed & Verified',
        message: 'Exchange #EL-EX-2026-00042 (5,000 kg PET Scrap) marked as Completed. Escrow released.',
        relatedEntity: 'Transaction',
        relatedEntityId: completedExchange._id.toString(),
        link: `/exchange/${completedExchange.exchangeId}`,
        isRead: false
      },
      {
        user: greenpoly.user._id,
        type: 'match',
        title: 'Smart Recommendation Available',
        message: 'AI found a 94% compatible match: 5,000 kg PET Scrap at Apex Plastics.',
        relatedEntity: 'Waste',
        relatedEntityId: petWaste._id.toString(),
        link: `/waste/${petWaste._id}`,
        isRead: false
      },
      {
        user: apex.user._id,
        type: 'auction_bid',
        title: 'New High Bid: ₹25/kg on PET Scrap',
        message: 'GreenPoly Recycling placed a winning bid of ₹25/kg for Batch EL-BATCH-PET-2026-00042.',
        relatedEntity: 'Waste',
        relatedEntityId: petWaste._id.toString(),
        link: `/waste/${petWaste._id}`,
        isRead: true
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Demo showcase data loaded successfully!',
      stats: {
        producersCount: createdProducers.length,
        buyersCount: createdBuyers.length,
        listingsCount: 3,
        showcaseExchangeId: completedExchange.exchangeId,
        showcaseBatchId: petWaste.batchId
      }
    });
  } catch (err) {
    console.error('Demo seed error:', err);
    return res.status(500).json({ success: false, message: 'Server error generating demo showcase data.' });
  }
};

// @desc    Reset all demo showcase data
// @route   POST /api/demo/reset
// @access  Public / Development / Admin
const resetDemoData = async (req, res) => {
  try {
    await Promise.all([
      User.deleteMany({ $or: [{ isDemo: true }, { email: { $regex: /@ecolink\.market$/i } }] }),
      Industry.deleteMany({ isDemo: true }),
      Waste.deleteMany({ isDemo: true }),
      BuyerRequirement.deleteMany({ isDemo: true }),
      Transaction.deleteMany({ isDemo: true }),
      Notification.deleteMany({ isDemo: true })
    ]);

    return res.status(200).json({
      success: true,
      message: 'All demo showcase data removed cleanly.'
    });
  } catch (err) {
    console.error('Demo reset error:', err);
    return res.status(500).json({ success: false, message: 'Server error resetting demo data.' });
  }
};

module.exports = {
  seedDemoData,
  resetDemoData
};
