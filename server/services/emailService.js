const { sendEmailNotification } = require('./notificationService');

const sendEmail = async (to, subject, body) => {
  return await sendEmailNotification(to, subject, body);
};

module.exports = {
  sendEmail
};
