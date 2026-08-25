import API from './authAPI';

export const getDashboardData = async () => {
  const response = await API.get('/industry/dashboard');
  return response.data;
};

export const updateIndustryProfile = async (data) => {
  const response = await API.put('/industry/profile', data);
  return response.data;
};

export const getNearbyIndustries = async (distance) => {
  const response = await API.get('/industry/nearby', { params: { distance } });
  return response.data;
};
