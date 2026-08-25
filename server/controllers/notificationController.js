const Notification = require('../models/Notification');
const { notifyMatchFound } = require('../services/notificationService');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    notification.isRead = true;
    await notification.save();
    return res.status(200).json(notification);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Manually or programmatically trigger match alerts
// @route   POST /api/notifications/trigger-match
// @access  Private
const triggerMatchAlert = async (req, res) => {
  try {
    const { sellerId, buyerId, wasteTitle, matchScore, equipmentOwnerId } = req.body;
    const alerts = await notifyMatchFound({
      sellerId: sellerId || req.user._id,
      buyerId,
      wasteTitle: wasteTitle || 'Industrial Fly Ash',
      matchScore: matchScore || 0.92,
      equipmentOwnerId
    });
    return res.status(200).json({ message: 'Notifications and email alerts dispatched successfully', alerts });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  triggerMatchAlert
};
