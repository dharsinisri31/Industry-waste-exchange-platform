const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Mock / Nodemailer Email Dispatcher Service
 */
const sendEmailNotification = async (recipientEmail, subject, htmlBody) => {
  console.log(`[Email Dispatcher] 📧 Sending email to ${recipientEmail}`);
  console.log(`[Email Dispatcher] Subject: ${subject}`);
  // Simulated SMTP delivery response
  return { success: true, messageId: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}` };
};

/**
 * Trigger Automatic Match Alert to Buyer, Seller, and Equipment Owners
 */
const notifyMatchFound = async ({ sellerId, buyerId, wasteTitle, matchScore, equipmentOwnerId }) => {
  try {
    const alerts = [];

    // 1. Notify Seller
    if (sellerId) {
      const sellerAlert = await Notification.create({
        recipient: sellerId,
        title: '🎉 AI Compatible Symbiosis Match Found!',
        message: `Your waste listing "${wasteTitle}" matched with a high-affinity buyer at ${Math.round(matchScore * 100)}% compatibility score!`,
        type: 'recommendation'
      });
      alerts.push(sellerAlert);

      const sellerUser = await User.findById(sellerId);
      if (sellerUser && sellerUser.email) {
        await sendEmailNotification(
          sellerUser.email,
          `AI Waste Match Found for ${wasteTitle}`,
          `<div style="font-family: sans-serif;">
            <h2>🎉 Circular Symbiosis Match Found!</h2>
            <p>Your listing <b>${wasteTitle}</b> has achieved a <b>${Math.round(matchScore * 100)}%</b> match score with a verified buyer.</p>
            <p>Log in to your EcoLink dashboard to review and initiate transport logistics.</p>
          </div>`
        );
      }
    }

    // 2. Notify Buyer
    if (buyerId) {
      const buyerAlert = await Notification.create({
        recipient: buyerId,
        title: '💡 AI Feedstock Material Recommendation',
        message: `AI identified raw material "${wasteTitle}" matching your feedstock composition criteria (${Math.round(matchScore * 100)}% match).`,
        type: 'recommendation'
      });
      alerts.push(buyerAlert);

      const buyerUser = await User.findById(buyerId);
      if (buyerUser && buyerUser.email) {
        await sendEmailNotification(
          buyerUser.email,
          `AI Feedstock Recommendation: ${wasteTitle}`,
          `<div style="font-family: sans-serif;">
            <h2>💡 Feedstock Material Available</h2>
            <p>High-affinity material <b>${wasteTitle}</b> is available for circular exchange with a <b>${Math.round(matchScore * 100)}%</b> match rating.</p>
          </div>`
        );
      }
    }

    // 3. Notify Equipment Owner (if machinery required for transformation)
    if (equipmentOwnerId) {
      const equipAlert = await Notification.create({
        recipient: equipmentOwnerId,
        title: '🚜 Machinery Processing Match Alert',
        message: `Your industrial equipment is requested for processing "${wasteTitle}" in a local circular exchange.`,
        type: 'recommendation'
      });
      alerts.push(equipAlert);
    }

    return alerts;
  } catch (error) {
    console.error('[Notification Service] Error triggering match alert:', error);
    return [];
  }
};

module.exports = {
  sendEmailNotification,
  notifyMatchFound
};
