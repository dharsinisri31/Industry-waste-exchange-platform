const Waste = require('../models/Waste');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const Industry = require('../models/Industry');

// @desc    Place a bid in a dynamic waste auction
// @route   POST /api/waste/:id/bid
// @access  Private
const placeBid = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const bidAmount = Number(amount);

    if (!bidAmount || isNaN(bidAmount)) {
      return res.status(400).json({ success: false, message: 'Valid bid amount is required.' });
    }

    const waste = await Waste.findById(id).populate('uploader', 'name email');
    if (!waste) {
      return res.status(404).json({ success: false, message: 'Waste listing not found.' });
    }

    if (waste.pricingMode !== 'auction') {
      return res.status(400).json({ success: false, message: 'This listing is not configured for dynamic auction bidding.' });
    }

    if (waste.uploader._id.equals(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot bid on your own listing.' });
    }

    const minRequired = (waste.auctionInfo?.currentBid || waste.auctionInfo?.startingPrice || waste.price || 0) + (waste.auctionInfo?.minIncrement || 1);

    if (bidAmount < minRequired) {
      return res.status(400).json({
        success: false,
        message: `Bid must be at least ₹${minRequired} (Current: ₹${waste.auctionInfo?.currentBid || waste.price}, Min Increment: ₹${waste.auctionInfo?.minIncrement || 1}).`
      });
    }

    // Record the bid
    const bidderIndustry = await Industry.findOne({ user: req.user._id });
    const bidderName = bidderIndustry?.companyName || req.user.name || req.user.email;

    if (!waste.auctionInfo) {
      waste.auctionInfo = {
        startingPrice: waste.price,
        currentBid: bidAmount,
        highestBidder: req.user._id,
        minIncrement: 1,
        status: 'live',
        bids: []
      };
    }

    waste.auctionInfo.currentBid = bidAmount;
    waste.auctionInfo.highestBidder = req.user._id;
    waste.auctionInfo.bids.push({
      bidder: req.user._id,
      bidderName,
      amount: bidAmount,
      timestamp: new Date()
    });

    await waste.save();

    // Notify the seller
    await Notification.create({
      user: waste.uploader._id,
      type: 'auction_bid',
      title: 'New Highest Bid Received',
      message: `${bidderName} placed a bid of ₹${bidAmount}/${waste.unit || 'kg'} on ${waste.name}.`,
      relatedEntity: 'Waste',
      relatedEntityId: waste._id.toString(),
      link: `/waste/${waste._id}`
    });

    return res.status(200).json({
      success: true,
      message: `Bid of ₹${bidAmount}/${waste.unit || 'kg'} placed successfully!`,
      auctionInfo: waste.auctionInfo
    });
  } catch (err) {
    console.error('Place bid error:', err);
    return res.status(500).json({ success: false, message: 'Server error placing auction bid.' });
  }
};

// @desc    Close auction and create exchange with winning bidder
// @route   POST /api/waste/:id/auction/close
// @access  Private (Seller or Admin)
const closeAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const waste = await Waste.findById(id);

    if (!waste) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (!waste.auctionInfo?.highestBidder) {
      return res.status(400).json({ success: false, message: 'Cannot close auction with zero bids.' });
    }

    waste.auctionInfo.status = 'closed';
    waste.status = 'exchanged';
    await waste.save();

    // Generate unique Exchange ID
    const year = new Date().getFullYear();
    const count = await Transaction.countDocuments();
    const exchangeId = `EL-EX-${year}-${String(count + 101).padStart(5, '0')}`;
    const batchId = waste.batchId || `EL-BATCH-${year}-${String(count + 101).padStart(5, '0')}`;

    const totalVal = waste.quantity * waste.auctionInfo.currentBid;
    const distanceKm = 326.94;
    const carbonSaved = Math.round(waste.quantity * 1.85);

    const transaction = await Transaction.create({
      exchangeId,
      batchId,
      waste: waste._id,
      seller: waste.uploader,
      buyer: waste.auctionInfo.highestBidder,
      quantity: waste.quantity,
      unit: waste.unit || 'kg',
      totalPrice: totalVal,
      pricingMode: 'auction',
      status: 'accepted',
      paymentStatus: 'pending',
      distanceKm,
      carbonSavedKg: carbonSaved,
      transportCost: 11442,
      weighment: {
        sellerDeclaredWeight: waste.quantity,
        pickupWeight: 0,
        receivedWeight: 0,
        processedWeight: 0,
        variancePercent: 0,
        varianceStatus: 'Normal'
      },
      timeline: [
        {
          stage: 'Auction',
          title: 'Auction Completed & Awarded',
          description: `Winning bid of ₹${waste.auctionInfo.currentBid}/${waste.unit || 'kg'} accepted. Total value ₹${totalVal.toLocaleString()}.`,
          timestamp: new Date(),
          locationName: 'Dynamic Pricing Exchange',
          actor: 'Auction Engine'
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Auction closed and Exchange order created!',
      exchangeId: transaction.exchangeId,
      transaction
    });
  } catch (err) {
    console.error('Close auction error:', err);
    return res.status(500).json({ success: false, message: 'Server error closing auction.' });
  }
};

module.exports = {
  placeBid,
  closeAuction
};
