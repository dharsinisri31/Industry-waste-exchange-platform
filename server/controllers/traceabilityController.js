const Transaction = require('../models/Transaction');
const Waste = require('../models/Waste');
const Industry = require('../models/Industry');
const Notification = require('../models/Notification');

// @desc    Get complete end-to-end traceability timeline and record by Batch ID or Exchange ID
// @route   GET /api/traceability/:batchOrExchangeId
// @access  Public / Authenticated
const getTraceability = async (req, res) => {
  try {
    const { batchOrExchangeId } = req.params;
    const query = batchOrExchangeId.trim();

    // 1. Try finding transaction by exchangeId, batchId, or _id
    let transaction = await Transaction.findOne({
      $or: [
        { exchangeId: query },
        { batchId: query },
        ...(query.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: query }] : [])
      ]
    })
      .populate('seller', 'name email')
      .populate('buyer', 'name email')
      .populate('waste');

    let waste = transaction ? transaction.waste : null;

    // 2. If not found in Transaction, look in Waste listings
    if (!waste) {
      waste = await Waste.findOne({
        $or: [
          { batchId: query },
          ...(query.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: query }] : [])
        ]
      }).populate('uploader', 'name email');
    }

    if (!waste && !transaction) {
      return res.status(404).json({
        success: false,
        message: `No traceability record found for Batch or Exchange ID "${query}".`
      });
    }

    // Get seller and buyer industry profiles
    const sellerUserId = transaction ? transaction.seller?._id : waste?.uploader?._id;
    const buyerUserId = transaction ? transaction.buyer?._id : null;

    const [sellerIndustry, buyerIndustry] = await Promise.all([
      sellerUserId ? Industry.findOne({ user: sellerUserId }) : null,
      buyerUserId ? Industry.findOne({ user: buyerUserId }) : null
    ]);

    // Build or use real event timeline
    let timeline = transaction?.timeline || [];

    if (timeline.length === 0 && waste) {
      timeline = [
        {
          stage: 'Created',
          title: 'Waste Stream Generated & Cataloged',
          description: `Batch ${waste.batchId || 'EL-BATCH-001'} registered at ${sellerIndustry?.companyName || 'Producer Facility'}.`,
          timestamp: waste.createdAt,
          locationName: `${waste.city || 'Regional'}, India`,
          actor: sellerIndustry?.companyName || 'Waste Producer'
        },
        {
          stage: 'Inspected',
          title: 'AI Computer Vision & Quality Analysis',
          description: `Classified as ${waste.category} with ${waste.qualityGrade || 'Grade A'} purity rating (${waste.purity?.estimated || 92}%).`,
          timestamp: new Date(new Date(waste.createdAt).getTime() + 15 * 60000),
          locationName: 'EcoLink AI Intelligence Hub',
          actor: 'AI Inspection Engine'
        },
        {
          stage: 'Listed',
          title: 'Active on EcoLink Marketplace',
          description: `Listed for ${waste.pricingMode === 'auction' ? 'Dynamic Auction' : 'Direct Exchange'} at ₹${waste.price}/${waste.unit || 'kg'}.`,
          timestamp: new Date(new Date(waste.createdAt).getTime() + 30 * 60000),
          locationName: 'National Industrial Exchange',
          actor: 'Marketplace Gateway'
        }
      ];
    }

    return res.status(200).json({
      success: true,
      batchId: waste?.batchId || transaction?.batchId || 'EL-BATCH-DEFAULT',
      exchangeId: transaction?.exchangeId || null,
      material: {
        id: waste?._id,
        name: waste?.name || 'Industrial Secondary Material',
        category: waste?.category || 'General Industrial',
        quantity: transaction?.quantity || waste?.quantity || 5000,
        unit: waste?.unit || 'kg',
        qualityGrade: waste?.qualityGrade || 'Grade A',
        purity: waste?.purity?.estimated || 92,
        moisture: waste?.moisture?.estimated || 2,
        description: waste?.description,
        hazardousStatus: waste?.hazardousStatus || false,
        pricingMode: waste?.pricingMode || transaction?.pricingMode || 'fixed',
        price: waste?.price || transaction?.totalPrice
      },
      seller: {
        companyName: sellerIndustry?.companyName || 'Industrial Waste Producer',
        email: sellerIndustry?.user?.email || waste?.uploader?.email,
        city: sellerIndustry?.city || waste?.city || 'Vadodara',
        address: sellerIndustry?.address || waste?.address || 'Industrial Estate',
        trustMetrics: sellerIndustry?.trustMetrics
      },
      buyer: buyerIndustry ? {
        companyName: buyerIndustry.companyName,
        email: buyerIndustry.user?.email,
        city: buyerIndustry.city,
        address: buyerIndustry.address,
        trustMetrics: buyerIndustry.trustMetrics
      } : null,
      status: transaction?.status || waste?.status || 'active',
      paymentStatus: transaction?.paymentStatus || 'pending',
      weighment: transaction?.weighment || {
        sellerDeclaredWeight: waste?.quantity || 5000,
        pickupWeight: 0,
        receivedWeight: 0,
        processedWeight: 0,
        variancePercent: 0,
        varianceStatus: 'Normal'
      },
      logistics: transaction?.logistics || {
        status: 'Scheduled',
        vehicleNumber: 'TN-38-EX-8842',
        driverName: 'R. Soundararajan',
        carrierName: 'GreenFreight Express Logistics',
        distanceKm: transaction?.distanceKm || 326.94,
        etaHours: 4.5
      },
      documents: transaction?.documents || [],
      ratings: transaction?.ratings || {},
      sustainability: transaction?.sustainability || {
        wasteDivertedKg: (transaction?.quantity || waste?.quantity || 5000),
        carbonSavedKg: transaction?.carbonSavedKg || Math.round((transaction?.quantity || waste?.quantity || 5000) * 1.85),
        virginMaterialAvoidedKg: Math.round((transaction?.quantity || waste?.quantity || 5000) * 0.85)
      },
      timeline,
      isDemo: transaction?.isDemo || waste?.isDemo || false
    });
  } catch (err) {
    console.error('Traceability fetch error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving traceability data.' });
  }
};

const getMyExchanges = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin' || (req.user.roles && req.user.roles.includes('admin'));

    const query = isAdmin
      ? {}
      : { $or: [{ buyer: userId }, { seller: userId }] };

    const transactions = await Transaction.find(query)
      .populate('seller', 'name email companyName')
      .populate('buyer', 'name email companyName')
      .populate('waste')
      .populate('paymentId')
      .populate('dispute')
      .sort({ createdAt: -1 });

    const userIds = [];
    transactions.forEach(t => {
      if (t.seller?._id) userIds.push(t.seller._id);
      if (t.buyer?._id) userIds.push(t.buyer._id);
    });

    const industries = await Industry.find({ user: { $in: userIds } });
    const industryMap = {};
    industries.forEach(ind => {
      if (ind.user) industryMap[ind.user.toString()] = ind;
    });

    const formatted = transactions.map(t => {
      const isBuyer = t.buyer?._id ? t.buyer._id.equals(userId) : false;
      const isSeller = t.seller?._id ? t.seller._id.equals(userId) : false;

      const sellerIndustry = industryMap[t.seller?._id?.toString()];
      const buyerIndustry = industryMap[t.buyer?._id?.toString()];

      const partnerName = isBuyer
        ? (sellerIndustry?.companyName || t.seller?.companyName || t.seller?.name || 'Seller Facility')
        : (buyerIndustry?.companyName || t.buyer?.companyName || t.buyer?.name || 'Buyer Facility');

      return {
        ...t.toObject(),
        sellerIndustry,
        buyerIndustry,
        partnerName,
        roleInExchange: isBuyer ? 'Buyer' : (isSeller ? 'Seller' : 'Admin')
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      exchanges: formatted
    });
  } catch (err) {
    console.error('Get my exchanges error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving exchanges.' });
  }
};

const getExchangeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin' || (req.user.roles && req.user.roles.includes('admin'));

    const transaction = await Transaction.findOne({
      $or: [
        { exchangeId: id },
        { orderId: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    })
      .populate('seller', 'name email companyName')
      .populate('buyer', 'name email companyName')
      .populate('waste')
      .populate('paymentId')
      .populate('dispute');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Exchange order not found.' });
    }

    // Strict Security Authorization Check: Must be Buyer, Seller, or Admin
    const isBuyer = transaction.buyer?._id ? transaction.buyer._id.equals(userId) : transaction.buyer?.equals(userId);
    const isSeller = transaction.seller?._id ? transaction.seller._id.equals(userId) : transaction.seller?.equals(userId);

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have authorization to view this exchange.'
      });
    }

    const [sellerIndustry, buyerIndustry] = await Promise.all([
      Industry.findOne({ user: transaction.seller?._id }),
      Industry.findOne({ user: transaction.buyer?._id })
    ]);

    return res.status(200).json({
      success: true,
      exchange: {
        ...transaction.toObject(),
        sellerIndustry,
        buyerIndustry,
        isCurrentUserBuyer: isBuyer,
        isCurrentUserSeller: isSeller,
        currentUserRole: isBuyer ? 'Buyer' : (isSeller ? 'Seller' : 'Admin')
      }
    });
  } catch (err) {
    console.error('Get exchange error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving exchange.' });
  }
};

// @desc    Upload document to exchange
// @route   POST /api/exchanges/:id/documents
// @access  Authenticated
const uploadExchangeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, docType, url, notes } = req.body;

    const transaction = await Transaction.findOne({
      $or: [
        { exchangeId: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Exchange not found.' });
    }

    const docObj = {
      name: name || `${docType} Document`,
      docType: docType || 'Material Quality Report',
      url: url || '/uploads/sample_manifest.pdf',
      uploadedBy: req.user._id,
      uploaderName: req.user.name || req.user.email,
      uploadedAt: new Date(),
      version: 'v1.0',
      status: 'Under Review',
      notes: notes || 'Submitted for compliance verification.'
    };

    transaction.documents.push(docObj);

    // Append to timeline
    transaction.timeline.push({
      stage: 'Documents',
      title: `${docType} Uploaded`,
      description: `Document "${docObj.name}" submitted by ${docObj.uploaderName}. Status: Under Review.`,
      timestamp: new Date(),
      locationName: 'Compliance Portal',
      actor: docObj.uploaderName
    });

    await transaction.save();

    // Create Notification
    await Notification.create({
      user: transaction.buyer._id.equals(req.user._id) ? transaction.seller : transaction.buyer,
      type: 'document',
      title: 'New Exchange Document Uploaded',
      message: `${docObj.name} was uploaded for Exchange #${transaction.exchangeId || transaction._id.toString().slice(-6)}.`,
      link: `/exchange/${transaction.exchangeId || transaction._id}`
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      documents: transaction.documents,
      timeline: transaction.timeline
    });
  } catch (err) {
    console.error('Upload document error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload document.' });
  }
};

// @desc    Verify or Reject exchange document
// @route   PATCH /api/exchanges/:id/documents/:docId/verify
// @access  Admin Only
const verifyExchangeDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const { status, notes } = req.body; // 'Verified' or 'Rejected'

    const transaction = await Transaction.findOne({
      $or: [
        { exchangeId: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Exchange not found.' });
    }

    const doc = transaction.documents.id(docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    doc.status = status || 'Verified';
    doc.verifiedBy = req.user.name || 'Platform Compliance Officer';
    doc.verifiedAt = new Date();
    if (notes) doc.notes = notes;

    transaction.timeline.push({
      stage: 'Verification',
      title: `Document ${status}`,
      description: `"${doc.name}" verified by ${doc.verifiedBy}.`,
      timestamp: new Date(),
      locationName: 'Platform Governance Hub',
      actor: doc.verifiedBy
    });

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: `Document status updated to "${doc.status}".`,
      documents: transaction.documents,
      timeline: transaction.timeline
    });
  } catch (err) {
    console.error('Verify document error:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify document.' });
  }
};

// @desc    Record digital weighment and automatically calculate weight variance
// @route   POST /api/exchanges/:id/weighment
// @access  Authenticated
const recordWeighment = async (req, res) => {
  try {
    const { id } = req.params;
    const { sellerDeclaredWeight, pickupWeight, receivedWeight, processedWeight } = req.body;

    const transaction = await Transaction.findOne({
      $or: [
        { exchangeId: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Exchange not found.' });
    }

    const declared = sellerDeclaredWeight || transaction.weighment?.sellerDeclaredWeight || transaction.quantity || 5000;
    const pickup = pickupWeight !== undefined ? pickupWeight : (transaction.weighment?.pickupWeight || declared);
    const received = receivedWeight !== undefined ? receivedWeight : (transaction.weighment?.receivedWeight || pickup);
    const processed = processedWeight !== undefined ? processedWeight : (transaction.weighment?.processedWeight || Math.round(received * 0.96));

    // Calculate variance % between declared and received
    const diff = Math.abs(declared - received);
    const variancePercent = Number(((diff / declared) * 100).toFixed(2));
    const varianceStatus = variancePercent > 2.0 ? 'Variance Alert' : 'Normal';

    transaction.weighment = {
      sellerDeclaredWeight: declared,
      pickupWeight: pickup,
      receivedWeight: received,
      processedWeight: processed,
      variancePercent,
      varianceStatus,
      recordedAt: new Date()
    };

    transaction.timeline.push({
      stage: 'Weighment',
      title: 'Digital Weighment Scale Logged',
      description: `Declared: ${declared} kg | Received: ${received} kg (Variance: ${variancePercent}% - ${varianceStatus}).`,
      timestamp: new Date(),
      locationName: 'Buyer Receiving Weighbridge',
      actor: req.user.name || 'Weighbridge Terminal'
    });

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Weighment logged successfully.',
      weighment: transaction.weighment,
      timeline: transaction.timeline
    });
  } catch (err) {
    console.error('Weighment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record weighment.' });
  }
};

// @desc    Rate partner on 5-star criteria after exchange completion
// @route   POST /api/exchanges/:id/rate
// @access  Authenticated
const submitPartnerRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, materialQuality, quantityAccuracy, communication, deliveryReliability, paymentTimeliness, overall, comment } = req.body;

    const transaction = await Transaction.findOne({
      $or: [
        { exchangeId: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Exchange not found.' });
    }

    if (role === 'buyer') {
      // Buyer is rating the seller
      transaction.ratings.sellerRating = {
        materialQuality: Number(materialQuality) || 5,
        quantityAccuracy: Number(quantityAccuracy) || 5,
        communication: Number(communication) || 5,
        deliveryReliability: Number(deliveryReliability) || 5,
        overall: Number(overall) || 5,
        comment: comment || 'High quality feedstock matching technical specification.',
        createdAt: new Date()
      };
    } else {
      // Seller is rating the buyer
      transaction.ratings.buyerRating = {
        paymentTimeliness: Number(paymentTimeliness) || 5,
        communication: Number(communication) || 5,
        overall: Number(overall) || 5,
        comment: comment || 'Smooth exchange, prompt receiving confirmation.',
        createdAt: new Date()
      };
    }

    transaction.timeline.push({
      stage: 'Rating',
      title: 'Partner Trust Rating Submitted',
      description: `${role === 'buyer' ? 'Buyer rated Seller' : 'Seller rated Buyer'}: ${overall || 5}/5 ⭐ ("${comment || 'Recommended partner'}").`,
      timestamp: new Date(),
      locationName: 'EcoLink Trust Network',
      actor: req.user.name || 'Exchange Partner'
    });

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Partner rating submitted successfully.',
      ratings: transaction.ratings,
      timeline: transaction.timeline
    });
  } catch (err) {
    console.error('Rating error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit rating.' });
  }
};

// @desc    Advance simulated logistics stage
// @route   POST /api/exchanges/:id/logistics/status
// @access  Authenticated
const updateLogisticsStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, lat, lng, address } = req.body; // 'Scheduled', 'Picked Up', 'In Transit', 'Delivered'

    const transaction = await Transaction.findOne({
      $or: [
        { exchangeId: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Exchange not found.' });
    }

    transaction.logistics.status = status || 'In Transit';
    if (lat && lng) {
      transaction.logistics.currentLocation = {
        lat: Number(lat),
        lng: Number(lng),
        address: address || 'Highway Transit Corridor'
      };
    }

    if (status === 'Delivered') {
      transaction.status = 'delivered';
      transaction.logistics.deliveredAt = new Date();
    } else if (status === 'Picked Up' || status === 'In Transit') {
      transaction.status = 'in_transit';
    }

    transaction.timeline.push({
      stage: 'Logistics',
      title: `Freight Status: ${status}`,
      description: `Shipment is now marked as ${status} (Carrier: ${transaction.logistics.carrierName}).`,
      timestamp: new Date(),
      locationName: address || 'Logistics Corridor',
      actor: transaction.logistics.carrierName
    });

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: `Logistics status updated to "${status}".`,
      logistics: transaction.logistics,
      status: transaction.status,
      timeline: transaction.timeline
    });
  } catch (err) {
    console.error('Logistics update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update logistics status.' });
  }
};

// @desc    Confirm demo payment
// @route   POST /api/exchanges/:id/payment/confirm
// @access  Authenticated
const confirmDemoPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      $or: [
        { exchangeId: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Exchange not found.' });
    }

    transaction.paymentStatus = 'confirmed';
    transaction.paymentAmount = transaction.totalPrice;

    transaction.timeline.push({
      stage: 'Payment',
      title: 'Escrow Payment Confirmed (Demo)',
      description: `Industrial trade amount ₹${transaction.totalPrice.toLocaleString()} secured in trade settlement account.`,
      timestamp: new Date(),
      locationName: 'Settlement Gateway',
      actor: 'Escrow Engine'
    });

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Demo payment confirmed.',
      paymentStatus: transaction.paymentStatus,
      timeline: transaction.timeline
    });
  } catch (err) {
    console.error('Payment confirm error:', err);
    return res.status(500).json({ success: false, message: 'Failed to confirm payment.' });
  }
};

// @desc    Recycler confirms material processing & recycling completion
// @route   POST /api/exchanges/:id/recycle-confirm
// @access  Authenticated
const confirmRecycling = async (req, res) => {
  try {
    const { id } = req.params;
    const { processedWeightKg, recycledProduct } = req.body;

    const transaction = await Transaction.findOne({
      $or: [
        { exchangeId: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Exchange not found.' });
    }

    const qty = processedWeightKg || transaction.quantity || 5000;
    const carbonSaved = Math.round(qty * 1.85);
    const virginAvoided = Math.round(qty * 0.85);

    transaction.status = 'completed';
    transaction.paymentStatus = 'settled';
    transaction.sustainability = {
      wasteDivertedKg: qty,
      carbonSavedKg: carbonSaved,
      virginMaterialAvoidedKg: virginAvoided
    };

    transaction.timeline.push({
      stage: 'Recycling',
      title: 'Material Processing & Upcycling Verified',
      description: `${qty} kg converted into ${recycledProduct || 'Secondary High-Grade Feedstock'}. Net Avoided CO₂: ${carbonSaved} kg CO₂e.`,
      timestamp: new Date(),
      locationName: 'Recycling Facility',
      actor: req.user.name || 'Recycling Plant Operator'
    });

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Recycling and circular transformation verified.',
      status: transaction.status,
      sustainability: transaction.sustainability,
      timeline: transaction.timeline
    });
  } catch (err) {
    console.error('Recycle confirm error:', err);
    return res.status(500).json({ success: false, message: 'Failed to confirm recycling.' });
  }
};

// @desc    Update order lifecycle status
// @route   PATCH /api/traceability/exchanges/:id/order-status
// @access  Private (Buyer, Seller, or Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, note } = req.body;

    const validStatuses = [
      'Order Placed',
      'Payment Confirmed',
      'Seller Accepted',
      'Waste Prepared',
      'Pickup Scheduled',
      'In Transit',
      'Delivered',
      'Completed',
      'Cancelled',
      'Disputed'
    ];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: `Invalid status "${orderStatus}". Valid statuses: ${validStatuses.join(', ')}` });
    }

    const transaction = await Transaction.findOne({
      $or: [
        { exchangeId: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    }).populate('waste').populate('seller').populate('buyer');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Exchange order not found.' });
    }

    const isBuyer = transaction.buyer._id.equals(req.user._id);
    const isSeller = transaction.seller._id.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized action.' });
    }

    // Role-based transition validation
    if (!isAdmin) {
      if (isSeller) {
        const sellerAllowed = ['Seller Accepted', 'Waste Prepared', 'Pickup Scheduled', 'In Transit', 'Delivered', 'Cancelled'];
        if (!sellerAllowed.includes(orderStatus)) {
          return res.status(403).json({ success: false, message: `Sellers can only update to: ${sellerAllowed.join(', ')}` });
        }
      } else if (isBuyer) {
        const buyerAllowed = ['Completed', 'Cancelled', 'Disputed', 'Order Placed'];
        if (!buyerAllowed.includes(orderStatus)) {
          return res.status(403).json({ success: false, message: `Buyers can only update to: ${buyerAllowed.join(', ')}` });
        }
      }
    }

    transaction.orderStatus = orderStatus;
    const statusMap = {
      'Order Placed': 'order_placed',
      'Payment Confirmed': 'accepted',
      'Seller Accepted': 'accepted',
      'Waste Prepared': 'accepted',
      'Pickup Scheduled': 'in_transit',
      'In Transit': 'in_transit',
      'Delivered': 'delivered',
      'Completed': 'completed',
      'Cancelled': 'cancelled',
      'Disputed': 'disputed'
    };
    transaction.status = statusMap[orderStatus] || transaction.status;

    if (orderStatus === 'In Transit' || orderStatus === 'Pickup Scheduled') {
      transaction.logistics.status = orderStatus === 'In Transit' ? 'In Transit' : 'Scheduled';
    } else if (orderStatus === 'Delivered') {
      transaction.logistics.status = 'Delivered';
      transaction.logistics.deliveredAt = new Date();
    } else if (orderStatus === 'Completed') {
      transaction.completedAt = new Date();
    }

    // Add to status history
    transaction.statusHistory.push({
      status: orderStatus,
      title: `Status: ${orderStatus}`,
      note: note || `Order updated to ${orderStatus} by ${req.user.name || (isSeller ? 'Seller' : (isBuyer ? 'Buyer' : 'Admin'))}.`,
      actor: req.user.name || (isSeller ? 'Seller' : (isBuyer ? 'Buyer' : 'Admin')),
      changedBy: req.user._id,
      changedByName: req.user.name || req.user.email,
      timestamp: new Date()
    });

    // Add to timeline
    transaction.timeline.push({
      stage: orderStatus,
      title: `Order: ${orderStatus}`,
      description: note || `Shipment/order status moved to "${orderStatus}".`,
      timestamp: new Date(),
      locationName: transaction.logistics?.currentLocation?.address || 'Transit Hub',
      actor: req.user.name || 'Order Manager'
    });

    await transaction.save();

    // Create Notification for the counterparty
    const notifyUser = isBuyer ? transaction.seller._id : transaction.buyer._id;
    const wasteName = transaction.waste?.name || 'Waste Material';
    
    let notificationTitle = `📦 Order #${transaction.exchangeId || transaction._id.toString().slice(-6)}: ${orderStatus}`;
    let notificationMessage = `Status updated to "${orderStatus}" for "${wasteName}".`;

    if (orderStatus === 'Seller Accepted') {
      notificationTitle = '✅ Exchange Request Accepted';
      notificationMessage = `Seller has accepted your exchange request for "${wasteName}". You can now proceed to payment.`;
    } else if (orderStatus === 'Cancelled' && isSeller) {
      notificationTitle = '❌ Exchange Request Declined';
      notificationMessage = `Seller declined the exchange request for "${wasteName}".`;
    } else if (orderStatus === 'Completed') {
      notificationTitle = '🎉 Exchange Completed Successfully';
      notificationMessage = `Custody transfer and recycling settlement verified for "${wasteName}".`;
    }

    await Notification.create({
      user: notifyUser,
      recipient: notifyUser,
      type: 'status_update',
      title: notificationTitle,
      message: notificationMessage,
      relatedEntity: 'Transaction',
      relatedEntityId: transaction._id.toString(),
      link: `/exchange/${transaction.exchangeId || transaction._id}`
    });

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${orderStatus}".`,
      orderStatus: transaction.orderStatus,
      status: transaction.status,
      statusHistory: transaction.statusHistory,
      timeline: transaction.timeline,
      exchange: transaction
    });
  } catch (err) {
    console.error('Order status update error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTraceability,
  getMyExchanges,
  getExchangeById,
  uploadExchangeDocument,
  verifyExchangeDocument,
  recordWeighment,
  submitPartnerRating,
  updateLogisticsStatus,
  confirmDemoPayment,
  confirmRecycling,
  updateOrderStatus
};
