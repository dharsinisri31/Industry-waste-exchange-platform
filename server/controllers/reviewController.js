const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const Industry = require('../models/Industry');
const Notification = require('../models/Notification');
const Waste = require('../models/Waste');

// @desc    Submit a rating & review for an order
// @route   POST /api/reviews
// @access  Private (Buyer or Seller)
const submitReview = async (req, res) => {
  try {
    const {
      orderId,
      overallRating,
      wasteQualityRating,
      sellerCommunicationRating,
      deliveryExperienceRating,
      buyerCommunicationRating,
      transactionExperienceRating,
      comment
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ success: false, message: 'Overall rating must be between 1 and 5 stars.' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Written review comment is required.' });
    }

    const order = await Transaction.findOne({
      $or: [
        { exchangeId: orderId },
        { orderId: orderId },
        ...(orderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: orderId }] : [])
      ]
    }).populate('waste').populate('seller').populate('buyer');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const isBuyer = order.buyer._id.equals(req.user._id);
    const isSeller = order.seller._id.equals(req.user._id);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only participants of this order can submit reviews.' });
    }

    // Check order state: only delivered or completed orders can be reviewed
    const normStatus = (order.orderStatus || order.status || '').toLowerCase();
    const canReview = normStatus.includes('deliver') || normStatus.includes('complet') || normStatus.includes('received') || normStatus.includes('processed');
    if (!canReview) {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted after the order is delivered or completed.'
      });
    }

    // Check for duplicate review
    const existingReview = await Review.findOne({ order: order._id, reviewer: req.user._id });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this order.'
      });
    }

    const reviewerRole = isBuyer ? 'buyer' : 'seller';
    const revieweeId = isBuyer ? order.seller._id : order.buyer._id;

    // Fetch reviewer company name
    const reviewerIndustry = await Industry.findOne({ user: req.user._id });
    const reviewerCompanyName = reviewerIndustry?.companyName || req.user.companyName || req.user.name || 'Verified Partner';

    const review = await Review.create({
      order: order._id,
      waste: order.waste?._id,
      reviewer: req.user._id,
      reviewee: revieweeId,
      reviewerRole,
      overallRating: Number(overallRating),
      wasteQualityRating: isBuyer ? Number(wasteQualityRating || overallRating) : undefined,
      sellerCommunicationRating: isBuyer ? Number(sellerCommunicationRating || overallRating) : undefined,
      deliveryExperienceRating: isBuyer ? Number(deliveryExperienceRating || overallRating) : undefined,
      buyerCommunicationRating: isSeller ? Number(buyerCommunicationRating || overallRating) : undefined,
      transactionExperienceRating: isSeller ? Number(transactionExperienceRating || overallRating) : undefined,
      comment: comment.trim(),
      reviewerName: req.user.name || req.user.email,
      reviewerCompany: reviewerCompanyName
    });

    // Update Transaction embedded ratings to preserve compatibility
    if (isBuyer) {
      order.ratings.sellerRating = {
        materialQuality: Number(wasteQualityRating || overallRating),
        quantityAccuracy: Number(overallRating),
        communication: Number(sellerCommunicationRating || overallRating),
        deliveryReliability: Number(deliveryExperienceRating || overallRating),
        overall: Number(overallRating),
        comment: comment.trim(),
        createdAt: new Date()
      };
    } else {
      order.ratings.buyerRating = {
        paymentTimeliness: Number(overallRating),
        communication: Number(buyerCommunicationRating || overallRating),
        overall: Number(overallRating),
        comment: comment.trim(),
        createdAt: new Date()
      };
    }

    order.timeline.push({
      stage: 'Rating',
      title: `${isBuyer ? 'Buyer' : 'Seller'} Review Submitted`,
      description: `${overallRating}/5 ⭐: "${comment.trim().slice(0, 80)}${comment.length > 80 ? '...' : ''}"`,
      timestamp: new Date(),
      locationName: 'EcoLink Trust Network',
      actor: reviewerCompanyName
    });

    await order.save();

    // Update Industry trust metrics
    const revieweeIndustry = await Industry.findOne({ user: revieweeId });
    if (revieweeIndustry) {
      const allReviewsForUser = await Review.find({ reviewee: revieweeId });
      const avgRating = allReviewsForUser.reduce((sum, r) => sum + r.overallRating, 0) / allReviewsForUser.length;
      if (!revieweeIndustry.trustMetrics) revieweeIndustry.trustMetrics = {};
      revieweeIndustry.trustMetrics.rating = Number(avgRating.toFixed(1));
      revieweeIndustry.trustMetrics.totalExchanges = (revieweeIndustry.trustMetrics.totalExchanges || 0) + 1;
      await revieweeIndustry.save();
    }

    // Send Notification to reviewee
    await Notification.create({
      user: revieweeId,
      recipient: revieweeId,
      type: 'rating',
      title: `⭐ New ${overallRating}-Star Review Received`,
      message: `${reviewerCompanyName} left a ${overallRating}-star review for order #${order.exchangeId || order._id.toString().slice(-6)}.`,
      relatedEntity: 'Review',
      relatedEntityId: review._id.toString(),
      link: `/exchange/${order.exchangeId || order._id}`
    });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      review
    });
  } catch (error) {
    console.error('Submit review error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get ratings & reviews for a specific seller
// @route   GET /api/reviews/seller/:sellerId
// @access  Public
const getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const reviews = await Review.find({
      reviewee: sellerId,
      reviewerRole: 'buyer'
    })
      .populate('waste', 'name category')
      .sort({ createdAt: -1 });

    const count = reviews.length;
    const avgOverall = count > 0 ? Number((reviews.reduce((sum, r) => sum + r.overallRating, 0) / count).toFixed(1)) : 5.0;
    const avgQuality = count > 0 ? Number((reviews.reduce((sum, r) => sum + (r.wasteQualityRating || r.overallRating), 0) / count).toFixed(1)) : 5.0;
    const avgComm = count > 0 ? Number((reviews.reduce((sum, r) => sum + (r.sellerCommunicationRating || r.overallRating), 0) / count).toFixed(1)) : 5.0;
    const avgDelivery = count > 0 ? Number((reviews.reduce((sum, r) => sum + (r.deliveryExperienceRating || r.overallRating), 0) / count).toFixed(1)) : 5.0;

    return res.status(200).json({
      success: true,
      metrics: {
        averageRating: avgOverall,
        wasteQualityRating: avgQuality,
        communicationRating: avgComm,
        deliveryRating: avgDelivery,
        totalReviews: count
      },
      reviews
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for an order
// @route   GET /api/reviews/order/:orderId
// @access  Private
const getOrderReviews = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Transaction.findOne({
      $or: [
        { exchangeId: orderId },
        { orderId: orderId },
        ...(orderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: orderId }] : [])
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const reviews = await Review.find({ order: order._id }).populate('reviewer', 'name email companyName');

    return res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitReview,
  getSellerReviews,
  getOrderReviews
};
