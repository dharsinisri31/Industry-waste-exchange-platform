import API from './authAPI';

export const getAnalyticsSummary = async () => {
  const response = await API.get('/analytics/summary');
  return response.data;
};
