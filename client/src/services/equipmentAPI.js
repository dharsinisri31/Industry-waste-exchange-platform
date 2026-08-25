import API from './authAPI';

export const getEquipmentListings = async (params) => {
  const response = await API.get('/equipment', { params });
  return response.data;
};

export const createEquipmentListing = async (formData) => {
  const response = await API.post('/equipment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const bookEquipment = async (id, bookingData) => {
  const response = await API.post(`/equipment/${id}/book`, bookingData);
  return response.data;
};

export const updateBookingStatus = async (bookingId, statusData) => {
  const response = await API.patch(`/equipment/bookings/${bookingId}/status`, statusData);
  return response.data;
};

export const getEquipmentRecommendations = async (params) => {
  const response = await API.get('/equipment/recommend', { params });
  return response.data;
};

export const getMyBookings = async () => {
  const response = await API.get('/equipment/my/bookings');
  return response.data;
};
