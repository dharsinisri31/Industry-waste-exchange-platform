const Waste = require('../models/Waste');
const Industry = require('../models/Industry');
const Equipment = require('../models/Equipment');
const Recommendation = require('../models/Recommendation');
const { calculateRoadRoute } = require('../services/routingService');

// @desc    Get top recommended buyers/industries for a waste listing with Explainable AI & Best vs Greenest Match
// @route   GET /api/recommendations/waste/:id
// @route   POST /api/recommendations/recommend-industry
// @access  Private / Public
const getRecommendationsForWaste = async (req, res) => {
  try {
    const wasteId = req.params.id || req.body.wasteId;
    let waste = null;

    if (wasteId) {
      waste = await Waste.findById(wasteId);
    }

    const wasteData = {
      name: waste ? waste.name : (req.body.name || 'Industrial Fly Ash'),
      category: waste ? waste.category : (req.body.category || 'Fly Ash'),
      subCategory: waste ? waste.subCategory : (req.body.subCategory || 'Industrial Stream'),
      composition: waste ? (waste.description || waste.name) : (req.body.composition || 'Silica 58%, Alumina 24%'),
      quantity: waste ? waste.quantity : (req.body.quantity || 100.0),
      purity: waste && waste.purity ? (waste.purity.estimated || 94.5) : (req.body.purity || 94.5),
      contamination: waste && waste.contamination ? (waste.contamination.percentage || 5.0) : (req.body.contamination || 5.0),
      latitude: waste && waste.location ? waste.location.coordinates[1] : (req.body.latitude || 12.9716),
      longitude: waste && waste.location ? waste.location.coordinates[0] : (req.body.longitude || 77.5946)
    };

    // 1. Fetch nearby candidate industries using MongoDB geospatial query or fallback lookup
    const originCoords = [wasteData.longitude, wasteData.latitude];

    let candidateIndustries = await Industry.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: originCoords
          },
          $maxDistance: 300000 // 300 km radius max
        }
      }
    }).limit(15);

    if (!candidateIndustries || candidateIndustries.length === 0) {
      candidateIndustries = await Industry.find().limit(15);
    }

    // 2. Multi-Criteria Explainable Scoring Engine
    const scoredCandidates = await Promise.all(candidateIndustries.map(async (ind) => {
      const destCoords = ind.location ? ind.location.coordinates : [77.6000, 12.9800];
      
      // Calculate road distance
      const routeInfo = await calculateRoadRoute(originCoords, destCoords);
      const roadDistanceKm = routeInfo.distanceKm;

      // 1. Material score (100 if matching category/name keywords)
      const desc = `${ind.companyName} ${ind.industryType} ${ind.neededWasteTypes || ''} ${ind.description || ''}`.toLowerCase();
      const queryName = wasteData.name.toLowerCase();
      const queryCategory = wasteData.category.toLowerCase();
      let matMatches = 0;
      if (desc.includes(queryCategory)) matMatches += 50;
      if (desc.includes(queryName)) matMatches += 30;
      if (ind.neededWasteTypes && ind.neededWasteTypes.toLowerCase().includes(queryCategory)) matMatches += 20;
      const materialScore = Math.min(100, 50 + matMatches);

      // 2. Purity score (100 if purity >= 90%)
      const purityScore = Math.min(100, Math.round(wasteData.purity * 1.02));

      // 3. Quantity score (100 if quantity <= 5000 kg within process capacity)
      const quantityScore = Math.min(100, Math.max(60, 100 - Math.floor(wasteData.quantity / 500)));

      // 4. Industry score
      const industryScore = ind.isVerified ? 95 : 82;

      // 5. Logistics score (100 for <50km, decreases linearly)
      const logisticsScore = Math.max(20, Math.round(100 - (roadDistanceKm / 3.5)));

      // 6. Demand score
      const demandScore = ind.businessRole === 'receiver' ? 92 : 80;

      // Overall Composite Score (0 - 100)
      const compatibilityScore = Math.round(
        0.35 * materialScore +
        0.15 * purityScore +
        0.10 * quantityScore +
        0.15 * industryScore +
        0.15 * logisticsScore +
        0.10 * demandScore
      );

      // Carbon Savings (kg CO2e)
      const landfillAvoided = wasteData.quantity * 1.8;
      const transportEmissions = routeInfo.co2EmissionsKg;
      const carbonSavedKg = Math.max(0.0, landfillAvoided - transportEmissions);
      const carbonSavedTons = parseFloat((carbonSavedKg / 1000.0).toFixed(2));

      // Sustainability Score (Weighted for Greenest Match ranking)
      const sustainabilityScore = Math.round(
        0.40 * (carbonSavedKg / 50.0) +
        0.35 * logisticsScore +
        0.25 * compatibilityScore
      );

      // Explainable AI Human-Readable Reasons
      const explanation = [];
      if (materialScore >= 80) {
        explanation.push(`Material requirement (${wasteData.category}) directly matches ${ind.companyName}'s manufacturing input needs.`);
      }
      if (purityScore >= 90) {
        explanation.push(`Material purity (${wasteData.purity}%) exceeds the industry minimum standard (90%).`);
      }
      if (roadDistanceKm <= 100) {
        explanation.push(`Short transit distance (${roadDistanceKm} km) minimizes freight cost (₹${routeInfo.transportCostUsd}) and carbon emissions.`);
      } else {
        explanation.push(`Moderate freight distance (${roadDistanceKm} km) with viable transport economics.`);
      }
      if (wasteData.contamination <= 6.0) {
        explanation.push(`Low contamination level (${wasteData.contamination}%) simplifies pre-processing.`);
      }
      if (ind.isVerified) {
        explanation.push(`Verified industry partner with compliance documentation.`);
      }

      return {
        compatibility_score: compatibilityScore,
        sustainability_score: sustainabilityScore,
        material_score: materialScore,
        purity_score: purityScore,
        quantity_score: quantityScore,
        industry_score: industryScore,
        logistics_score: logisticsScore,
        demand_score: demandScore,
        explanation,
        match_breakdown: {
          compatibility: compatibilityScore,
          distance_km: roadDistanceKm,
          distance_score: logisticsScore,
          travel_time_minutes: routeInfo.durationMinutes,
          demand_score: demandScore,
          carbon_saved_tons: carbonSavedTons,
          carbon_saved_kg: Math.round(carbonSavedKg),
          co2_emissions_kg: routeInfo.co2EmissionsKg,
          transport_cost_usd: routeInfo.transportCostUsd
        },
        industry: {
          _id: ind._id,
          companyName: ind.companyName,
          registrationNumber: ind.registrationNumber,
          address: ind.address,
          city: ind.city,
          contactPhone: ind.contactPhone,
          industryType: ind.industryType,
          description: ind.description,
          location: ind.location,
          isVerified: ind.isVerified
        }
      };
    }));

    // Best Material Match (Sorted by compatibility_score)
    const sortedByMaterial = [...scoredCandidates].sort((a, b) => b.compatibility_score - a.compatibility_score);
    const bestMaterialMatch = sortedByMaterial[0] || null;

    // Best Sustainable Match (Sorted by sustainability_score)
    const sortedBySustainability = [...scoredCandidates].sort((a, b) => b.sustainability_score - a.sustainability_score);
    const bestSustainableMatch = sortedBySustainability[0] || null;

    return res.status(200).json({
      waste: wasteData,
      bestMaterialMatch,
      bestSustainableMatch,
      recommendations: sortedByMaterial.slice(0, 5)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRecommendationsForWaste
};
