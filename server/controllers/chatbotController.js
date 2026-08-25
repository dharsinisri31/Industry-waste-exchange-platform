const { queryChatbot } = require('../services/aiService');

// @desc    Query the AI circular economy chatbot (RAG)
// @route   POST /api/chatbot/query
// @access  Private
const queryChat = async (req, res) => {
  const { message, history } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message content is required' });
  }

  try {
    const chatbotResult = await queryChatbot(message, history || []);
    return res.status(200).json(chatbotResult);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  queryChat
};
