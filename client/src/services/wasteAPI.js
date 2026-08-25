import API from './authAPI';

export const createWasteListing = async (formData) => {
  const response = await API.post('/waste', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getMarketplaceListings = async (params) => {
  const response = await API.get('/waste/marketplace', { params });
  return response.data;
};

export const getListingDetails = async (id) => {
  const response = await API.get(`/waste/${id}`);
  return response.data;
};

export const getMyListings = async () => {
  const response = await API.get('/waste/my/listings');
  return response.data;
};

export const deleteListing = async (id) => {
  const response = await API.delete(`/waste/${id}`);
  return response.data;
};

export const requestExchange = async (id) => {
  const response = await API.post(`/waste/${id}/exchange`);
  return response.data;
};
