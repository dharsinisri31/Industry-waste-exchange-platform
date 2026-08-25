import API from './authAPI';

export const getUserProfile = async () => {
  const response = await API.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await API.put('/users/profile', profileData);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await API.get('/users');
  return response.data;
};
