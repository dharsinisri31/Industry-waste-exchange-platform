const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const Waste = require('../models/Waste');
const Notification = require('../models/Notification');
const Industry = require('../models/Industry');

/**
 * Generate unique IDs
 */
const generateTransactionId = () => `TXN-ECOLINK-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
const generatePaymentId = () => `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
const generateInvoiceNumber = () => `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

// @desc    Get order details for payment summary
// @route   GET /api/payments/order/:orderId
// @access  Private (Buyer or Admin)
const getOrderPaymentSummary = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Transaction.findOne({
      $or: [
        { exchangeId: orderId },
        { orderId: orderId },
        ...(orderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: orderId }] : [])
      ]
    })
      .populate('waste')
      .populate('seller', 'name email companyName')
      .populate('buyer', 'name email companyName')
      .populate('paymentId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Authorization check: only buyer or admin can access checkout
    const isBuyer = order.buyer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isBuyer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only view payments for your own orders.' });
    }

    const [sellerIndustry, buyerIndustry] = await Promise.all([
      Industry.findOne({ user: order.seller._id }),
      Industry.findOne({ user: order.buyer._id })
    ]);

    const unitPrice = order.waste?.price || (order.totalPrice / (order.quantity || 1)) || 0;
    const wasteCost = order.wasteCost || (unitPrice * order.quantity);
    const transportCost = order.transportCost || 0;
    const totalAmount = order.totalPrice || (wasteCost + transportCost);

    return res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        exchangeId: order.exchangeId || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
        orderStatus: order.orderStatus || 'Order Placed',
        paymentStatus: order.paymentStatus || 'Pending',
        invoiceNumber: order.invoiceNumber || null,
        transactionId: order.transactionId || null,
        quantity: order.quantity,
        unit: order.unit || order.waste?.unit || 'kg',
        unitPrice,
        wasteCost,
        transportCost,
        totalAmount,
        distanceKm: order.distanceKm || 0,
        waste: {
          _id: order.waste?._id,
          name: order.waste?.name || 'Industrial Waste Material',
          category: order.waste?.category || 'General',
          qualityGrade: order.waste?.qualityGrade || 'Grade A',
          imageUrl: order.waste?.imageUrl || null
        },
        seller: {
          _id: order.seller._id,
          name: order.seller.name,
          email: order.seller.email,
          companyName: sellerIndustry?.companyName || order.seller.companyName || 'Industrial Supplier',
          city: sellerIndustry?.city || order.waste?.city || 'Regional Hub',
          address: sellerIndustry?.address || ''
        },
        buyer: {
          _id: order.buyer._id,
          name: order.buyer.name,
          email: order.buyer.email,
          companyName: buyerIndustry?.companyName || order.buyer.companyName || 'Procuring Enterprise',
          city: buyerIndustry?.city || '',
          address: buyerIndustry?.address || ''
        },
        payment: order.paymentId || null
      }
    });
  } catch (error) {
    console.error('Error fetching order payment summary:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Simulate payment execution (Success or Failure)
// @route   POST /api/payments/simulate
// @access  Private (Buyer Only)
const simulatePayment = async (req, res) => {
  try {
    const { orderId, paymentMethod = 'UPI', simulationResult = 'success', methodDetails = {} } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    const order = await Transaction.findOne({
      $or: [
        { exchangeId: orderId },
        { orderId: orderId },
        ...(orderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: orderId }] : [])
      ]
    }).populate('waste').populate('seller').populate('buyer');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order record not found.' });
    }

    // Authorization
    if (order.buyer._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only the ordering buyer can process payment.' });
    }

    // Validation: Cannot pay for cancelled order
    if (order.orderStatus === 'Cancelled' || order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot process payment for a cancelled order.' });
    }

    // Validation: Cannot pay twice if already paid
    const isAlreadyPaid = (order.paymentStatus || '').toLowerCase() === 'paid' || (order.paymentStatus || '').toLowerCase() === 'confirmed';
    if (isAlreadyPaid && simulationResult === 'success') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid successfully.',
        transactionId: order.transactionId,
        invoiceNumber: order.invoiceNumber
      });
    }

    const unitPrice = order.waste?.price || (order.totalPrice / (order.quantity || 1)) || 0;
    const wasteCost = order.wasteCost || (unitPrice * order.quantity);
    const transportCost = order.transportCost || 0;
    const totalAmount = order.totalPrice || (wasteCost + transportCost);

    const isSuccess = simulationResult === 'success';
    const txnId = generateTransactionId();
    const payId = generatePaymentId();
    const invNumber = order.invoiceNumber || generateInvoiceNumber();

    // Create Payment Record
    const payment = await Payment.create({
      paymentId: payId,
      transactionId: txnId,
      order: order._id,
      buyer: order.buyer._id,
      seller: order.seller._id,
      amount: totalAmount,
      currency: 'INR',
      breakdown: {
        wasteCost,
        transportCost,
        platformFee: 0,
        taxAmount: 0
      },
      paymentMethod,
      paymentMethodDetails: {
        upiId: methodDetails.upiId || 'ecolink.demo@upi',
        cardLast4: methodDetails.cardLast4 || '4242',
        cardBrand: methodDetails.cardBrand || 'Visa',
        bankName: methodDetails.bankName || 'State Bank of India'
      },
      paymentStatus: isSuccess ? 'Paid' : 'Failed',
      isSimulated: true,
      simulationNotes: isSuccess 
        ? 'Dummy Escrow Payment Verified for Academic/Project Demo.' 
        : 'Simulated Payment Rejection (Simulated insufficient limit or buyer cancellation).',
      paidAt: isSuccess ? new Date() : undefined,
      failureReason: isSuccess ? undefined : (methodDetails.failureReason || 'Simulated bank server timeout or declined authorization')
    });

    if (isSuccess) {
      // Update Order Model
      order.paymentStatus = 'Paid';
      order.paymentId = payment._id;
      order.transactionId = txnId;
      order.invoiceNumber = invNumber;
      order.paymentMethod = paymentMethod;
      order.paymentAmount = totalAmount;
      order.orderStatus = 'Payment Confirmed';
      order.status = 'accepted';

      // Status History
      order.statusHistory.push({
        status: 'Payment Confirmed',
        title: 'Escrow Payment Confirmed',
        note: `Simulated payment of ₹${totalAmount.toLocaleString()} verified via ${paymentMethod}. Transaction ID: ${txnId}`,
        actor: req.user.name || 'Buyer',
        changedBy: req.user._id,
        changedByName: req.user.name || req.user.email,
        timestamp: new Date()
      });

      // Timeline
      order.timeline.push({
        stage: 'Payment',
        title: 'Payment Confirmed (Simulated Escrow)',
        description: `Funds secured in EcoLink Escrow account. Reference: ${txnId}`,
        timestamp: new Date(),
        locationName: 'EcoLink Payment Gateway',
        actor: req.user.name || 'Buyer'
      });

      await order.save();

      // Notifications
      const wasteName = order.waste?.name || 'Secondary Material';
      await Notification.create({
        user: order.seller._id,
        recipient: order.seller._id,
        type: 'payment',
        title: '💰 Payment Confirmed for Order',
        message: `Buyer has completed payment of ₹${totalAmount.toLocaleString()} for "${wasteName}". Please accept and prepare waste.`,
        relatedEntity: 'Transaction',
        relatedEntityId: order._id.toString(),
        link: `/exchange/${order.exchangeId || order._id}`
      });

      await Notification.create({
        user: order.buyer._id,
        recipient: order.buyer._id,
        type: 'payment',
        title: '✅ Payment Successful',
        message: `Your payment of ₹${totalAmount.toLocaleString()} for "${wasteName}" was successful. TXN ID: ${txnId}`,
        relatedEntity: 'Transaction',
        relatedEntityId: order._id.toString(),
        link: `/exchange/${order.exchangeId || order._id}`
      });

      return res.status(200).json({
        success: true,
        message: 'Payment simulation succeeded.',
        paymentStatus: 'Paid',
        transactionId: txnId,
        paymentId: payId,
        invoiceNumber: invNumber,
        payment,
        order
      });
    } else {
      // Failed Simulation
      order.paymentStatus = 'Failed';
      order.statusHistory.push({
        status: 'Payment Failed',
        title: 'Payment Simulation Failed',
        note: `Simulated payment failed: ${payment.failureReason}`,
        actor: req.user.name || 'Buyer',
        changedBy: req.user._id,
        changedByName: req.user.name || req.user.email,
        timestamp: new Date()
      });
      await order.save();

      await Notification.create({
        user: order.buyer._id,
        recipient: order.buyer._id,
        type: 'payment',
        title: '❌ Payment Simulation Failed',
        message: `Payment simulation for order #${order.exchangeId || order._id.toString().slice(-6)} failed. You can retry anytime.`,
        relatedEntity: 'Transaction',
        relatedEntityId: order._id.toString(),
        link: `/payment/${order.exchangeId || order._id}`
      });

      return res.status(200).json({
        success: false,
        message: 'Simulated payment declined for demonstration purposes.',
        paymentStatus: 'Failed',
        payment,
        order
      });
    }
  } catch (error) {
    console.error('Simulate payment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get buyer payment history
// @route   GET /api/payments/buyer
// @access  Private (Buyer)
const getBuyerPaymentHistory = async (req, res) => {
  try {
    const { status, search, fromDate, toDate } = req.query;
    const query = { buyer: req.user._id };

    if (status && status !== 'All') {
      query.paymentStatus = new RegExp(`^${status}$`, 'i');
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(new Date(toDate).setHours(23, 59, 59));
    }

    const payments = await Payment.find(query)
      .populate('seller', 'name email companyName')
      .populate({
        path: 'order',
        populate: { path: 'waste', select: 'name category price quantity unit imageUrl' }
      })
      .sort({ createdAt: -1 });

    let results = payments;
    if (search) {
      const q = search.toLowerCase();
      results = payments.filter(p => {
        const txn = (p.transactionId || '').toLowerCase();
        const payId = (p.paymentId || '').toLowerCase();
        const orderId = (p.order?.exchangeId || p.order?._id?.toString() || '').toLowerCase();
        const sellerName = (p.seller?.name || p.seller?.companyName || '').toLowerCase();
        const wasteName = (p.order?.waste?.name || '').toLowerCase();
        return txn.includes(q) || payId.includes(q) || orderId.includes(q) || sellerName.includes(q) || wasteName.includes(q);
      });
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      payments: results
    });
  } catch (error) {
    console.error('Buyer payments fetch error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get seller sales/payments received
// @route   GET /api/payments/seller
// @access  Private (Seller)
const getSellerPaymentHistory = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { seller: req.user._id };

    if (status && status !== 'All') {
      query.paymentStatus = new RegExp(`^${status}$`, 'i');
    }

    const payments = await Payment.find(query)
      .populate('buyer', 'name email companyName')
      .populate({
        path: 'order',
        populate: { path: 'waste', select: 'name category price quantity unit' }
      })
      .sort({ createdAt: -1 });

    let results = payments;
    if (search) {
      const q = search.toLowerCase();
      results = payments.filter(p => {
        const txn = (p.transactionId || '').toLowerCase();
        const orderId = (p.order?.exchangeId || p.order?._id?.toString() || '').toLowerCase();
        const buyerName = (p.buyer?.name || p.buyer?.companyName || '').toLowerCase();
        const wasteName = (p.order?.waste?.name || '').toLowerCase();
        return txn.includes(q) || orderId.includes(q) || buyerName.includes(q) || wasteName.includes(q);
      });
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      payments: results
    });
  } catch (error) {
    console.error('Seller payments fetch error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single payment details
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('seller', 'name email companyName')
      .populate('buyer', 'name email companyName')
      .populate({
        path: 'order',
        populate: { path: 'waste' }
      });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // Auth check
    const isParty = payment.buyer._id.equals(req.user._id) || payment.seller._id.equals(req.user._id) || req.user.role === 'admin';
    if (!isParty) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this payment.' });
    }

    return res.status(200).json({ success: true, payment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get overall admin payment statistics
// @route   GET /api/payments/admin/stats
// @access  Private (Admin Only)
const getAdminPaymentStats = async (req, res) => {
  try {
    const allPayments = await Payment.find()
      .populate('buyer', 'name email companyName')
      .populate('seller', 'name email companyName')
      .populate({
        path: 'order',
        populate: { path: 'waste', select: 'name category' }
      })
      .sort({ createdAt: -1 });

    const totalTransactions = allPayments.length;
    const successfulPayments = allPayments.filter(p => p.paymentStatus === 'Paid').length;
    const failedPayments = allPayments.filter(p => p.paymentStatus === 'Failed').length;
    const pendingPayments = allPayments.filter(p => p.paymentStatus === 'Pending').length;
    const totalTransactionValue = allPayments
      .filter(p => p.paymentStatus === 'Paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalTransactions,
        successfulPayments,
        failedPayments,
        pendingPayments,
        totalTransactionValue
      },
      payments: allPayments
    });
  } catch (error) {
    console.error('Admin payment stats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOrderPaymentSummary,
  simulatePayment,
  getBuyerPaymentHistory,
  getSellerPaymentHistory,
  getPaymentById,
  getAdminPaymentStats
};
