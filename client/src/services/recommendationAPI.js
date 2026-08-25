import API from './authAPI';

export const getRecommendations = async (wasteId) => {
  const response = await API.get(`/recommendations/waste/${wasteId}`);
  return response.data;
};
