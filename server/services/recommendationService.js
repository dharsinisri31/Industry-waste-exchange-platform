const { recommendBuyers } = require('./aiService');

const getAIRecommendations = async (wasteData) => {
  return await recommendBuyers(wasteData);
};

module.exports = {
  getAIRecommendations
};
