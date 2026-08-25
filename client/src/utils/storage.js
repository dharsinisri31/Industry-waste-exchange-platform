export const getStoredToken = () => localStorage.getItem('accessToken');
export const setStoredToken = (token) => localStorage.setItem('accessToken', token);
export const removeStoredToken = () => localStorage.removeItem('accessToken');
