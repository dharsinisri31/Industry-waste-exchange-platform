const Dispute = require('../models/Dispute');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const User = require('../models/User');

const generateDisputeId = () => `DSP-ECOLINK-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

// @desc    Create a new dispute on an order
// @route   POST /api/disputes
// @access  Private (Buyer)
const createDispute = async (req, res) => {
  try {
    const { orderId, reason, description, evidenceImages = [] } = req.body;

    if (!orderId || !reason || !description) {
      return res.status(400).json({ success: false, message: 'Order ID, dispute reason, and description are required.' });
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

    // Auth check: buyer only (or admin)
    const isBuyer = order.buyer._id.equals(req.user._id);
    if (!isBuyer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only the buyer who placed the order can raise a dispute.' });
    }

    // Check if there is already an active dispute
    const activeDispute = await Dispute.findOne({
      order: order._id,
      status: { $in: ['Open', 'Under Review'] }
    });

    if (activeDispute) {
      return res.status(400).json({
        success: false,
        message: `An active dispute (${activeDispute.disputeId}) already exists for this order.`
      });
    }

    const disputeId = generateDisputeId();

    const dispute = await Dispute.create({
      disputeId,
      order: order._id,
      buyer: order.buyer._id,
      seller: order.seller._id,
      waste: order.waste?._id,
      reason,
      description: description.trim(),
      evidenceImages,
      status: 'Open',
      activityLog: [{
        actor: req.user.name || req.user.email,
        actorRole: 'Buyer',
        action: 'Dispute Raised',
        comment: `Reason: ${reason}. ${description.trim()}`,
        timestamp: new Date()
      }]
    });

    // Update order status
    order.orderStatus = 'Disputed';
    order.status = 'disputed';
    order.dispute = dispute._id;

    order.statusHistory.push({
      status: 'Disputed',
      title: 'Dispute Raised by Buyer',
      note: `Reason: ${reason} (Ref: ${disputeId})`,
      actor: req.user.name || 'Buyer',
      changedBy: req.user._id,
      changedByName: req.user.name || req.user.email,
      timestamp: new Date()
    });

    order.timeline.push({
      stage: 'Dispute',
      title: 'Trade Dispute Opened',
      description: `Dispute ${disputeId} logged: ${reason}. Under platform arbitration.`,
      timestamp: new Date(),
      locationName: 'EcoLink Resolution Hub',
      actor: req.user.name || 'Buyer'
    });

    await order.save();

    // Notify seller
    const wasteName = order.waste?.name || 'Waste Material';
    await Notification.create({
      user: order.seller._id,
      recipient: order.seller._id,
      type: 'dispute',
      title: '⚠️ Trade Dispute Raised by Buyer',
      message: `Buyer has opened dispute ${disputeId} for "${wasteName}". Reason: ${reason}. Please submit your response.`,
      relatedEntity: 'Dispute',
      relatedEntityId: dispute._id.toString(),
      link: `/disputes`
    });

    // Notify all Admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        recipient: admin._id,
        type: 'dispute',
        title: '🛡️ New Dispute Needs Mediation',
        message: `Dispute ${disputeId} raised for Order #${order.exchangeId || order._id.toString().slice(-6)}. Reason: ${reason}.`,
        relatedEntity: 'Dispute',
        relatedEntityId: dispute._id.toString(),
        link: `/admin/disputes`
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Dispute opened successfully and sent for review.',
      dispute,
      order
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all disputes (filtered by role)
// @route   GET /api/disputes
// @access  Private
const getDisputes = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (req.user.role === 'admin') {
      // Admin sees all disputes
    } else {
      // Industry user sees disputes where they are either buyer or seller
      query.$or = [{ buyer: req.user._id }, { seller: req.user._id }];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const disputes = await Dispute.find(query)
      .populate('buyer', 'name email companyName')
      .populate('seller', 'name email companyName')
      .populate('waste', 'name category price quantity unit')
      .populate('order', 'exchangeId totalPrice orderStatus paymentStatus')
      .sort({ createdAt: -1 });

    let results = disputes;
    if (search) {
      const q = search.toLowerCase();
      results = disputes.filter(d => {
        const id = (d.disputeId || '').toLowerCase();
        const reason = (d.reason || '').toLowerCase();
        const buyerName = (d.buyer?.name || d.buyer?.companyName || '').toLowerCase();
        const sellerName = (d.seller?.name || d.seller?.companyName || '').toLowerCase();
        const wasteName = (d.waste?.name || '').toLowerCase();
        const orderId = (d.order?.exchangeId || '').toLowerCase();
        return id.includes(q) || reason.includes(q) || buyerName.includes(q) || sellerName.includes(q) || wasteName.includes(q) || orderId.includes(q);
      });
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      disputes: results
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single dispute details
// @route   GET /api/disputes/:id
// @access  Private
const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findOne({
      $or: [
        { disputeId: req.params.id },
        ...(req.params.id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: req.params.id }] : [])
      ]
    })
      .populate('buyer', 'name email companyName')
      .populate('seller', 'name email companyName')
      .populate('waste')
      .populate('order');

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute record not found.' });
    }

    const isParty = dispute.buyer._id.equals(req.user._id) || dispute.seller._id.equals(req.user._id) || req.user.role === 'admin';
    if (!isParty) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this dispute.' });
    }

    return res.status(200).json({ success: true, dispute });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seller responds to an open dispute
// @route   POST /api/disputes/:id/respond
// @access  Private (Seller)
const respondToDispute = async (req, res) => {
  try {
    const { comment, evidenceImages = [] } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Response explanation is required.' });
    }

    const dispute = await Dispute.findOne({
      $or: [
        { disputeId: req.params.id },
        ...(req.params.id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: req.params.id }] : [])
      ]
    }).populate('order').populate('buyer');

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found.' });
    }

    if (!dispute.seller.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only the seller involved in this order can respond.' });
    }

    dispute.sellerResponse = {
      comment: comment.trim(),
      respondedAt: new Date(),
      evidenceImages
    };
    dispute.status = 'Under Review';

    dispute.activityLog.push({
      actor: req.user.name || req.user.email,
      actorRole: 'Seller',
      action: 'Seller Response Provided',
      comment: comment.trim(),
      timestamp: new Date()
    });

    await dispute.save();

    // Notify Buyer
    await Notification.create({
      user: dispute.buyer._id,
      recipient: dispute.buyer._id,
      type: 'dispute',
      title: '💬 Seller Responded to Dispute',
      message: `Seller provided an explanation for dispute ${dispute.disputeId}. Dispute is now under administrator review.`,
      relatedEntity: 'Dispute',
      relatedEntityId: dispute._id.toString(),
      link: `/disputes`
    });

    return res.status(200).json({
      success: true,
      message: 'Seller explanation recorded successfully. Dispute moved to Under Review.',
      dispute
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin resolves or rejects a dispute
// @route   PATCH /api/disputes/:id/resolve
// @access  Private (Admin Only)
const resolveDispute = async (req, res) => {
  try {
    const { action, resolutionNote } = req.body; // action: 'Resolved' or 'Rejected'

    if (!action || !['Resolved', 'Rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "Resolved" or "Rejected".' });
    }

    if (!resolutionNote || resolutionNote.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Resolution explanation note is required.' });
    }

    const dispute = await Dispute.findOne({
      $or: [
        { disputeId: req.params.id },
        ...(req.params.id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: req.params.id }] : [])
      ]
    }).populate('order').populate('buyer').populate('seller');

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found.' });
    }

    dispute.status = action;
    dispute.adminResolution = {
      resolutionNote: resolutionNote.trim(),
      resolvedBy: req.user._id,
      resolvedByName: req.user.name || 'Platform Administrator',
      resolvedAt: new Date(),
      action
    };

    dispute.activityLog.push({
      actor: req.user.name || 'Platform Administrator',
      actorRole: 'Admin',
      action: `Dispute Marked as ${action}`,
      comment: resolutionNote.trim(),
      timestamp: new Date()
    });

    await dispute.save();

    // Update order status
    if (dispute.order) {
      const order = await Transaction.findById(dispute.order._id);
      if (order) {
        order.orderStatus = action === 'Resolved' ? 'Completed' : 'Delivered';
        order.status = action === 'Resolved' ? 'completed' : 'delivered';

        order.statusHistory.push({
          status: action === 'Resolved' ? 'Completed' : 'Delivered',
          title: `Dispute ${action} by Admin`,
          note: `Admin resolution: ${resolutionNote.trim()}`,
          actor: 'Platform Administrator',
          changedBy: req.user._id,
          changedByName: req.user.name || 'Admin',
          timestamp: new Date()
        });

        order.timeline.push({
          stage: 'Dispute Resolution',
          title: `Dispute ${action} by Platform Governance`,
          description: resolutionNote.trim(),
          timestamp: new Date(),
          locationName: 'Platform Governance Hub',
          actor: 'EcoLink Admin'
        });

        await order.save();
      }
    }

    // Notify Buyer
    await Notification.create({
      user: dispute.buyer._id,
      recipient: dispute.buyer._id,
      type: 'dispute',
      title: `⚖️ Dispute ${dispute.disputeId} ${action}`,
      message: `Platform mediation concluded: ${resolutionNote.trim()}`,
      relatedEntity: 'Dispute',
      relatedEntityId: dispute._id.toString(),
      link: `/disputes`
    });

    // Notify Seller
    await Notification.create({
      user: dispute.seller._id,
      recipient: dispute.seller._id,
      type: 'dispute',
      title: `⚖️ Dispute ${dispute.disputeId} ${action}`,
      message: `Platform mediation concluded: ${resolutionNote.trim()}`,
      relatedEntity: 'Dispute',
      relatedEntityId: dispute._id.toString(),
      link: `/disputes`
    });

    return res.status(200).json({
      success: true,
      message: `Dispute has been ${action}.`,
      dispute
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDispute,
  getDisputes,
  getDisputeById,
  respondToDispute,
  resolveDispute
};
