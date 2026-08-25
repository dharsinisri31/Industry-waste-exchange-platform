import API from './authAPI';

const formatUrl = (url) => (url && url.startsWith('/api/') ? url.substring(4) : url);

export const apiGet = async (url, config) => {
  const response = await API.get(formatUrl(url), config);
  return response.data;
};

export const apiPost = async (url, data, config) => {
  const response = await API.post(formatUrl(url), data, config);
  return response.data;
};

export const apiPut = async (url, data, config) => {
  const response = await API.put(formatUrl(url), data, config);
  return response.data;
};

export const apiPatch = async (url, data, config) => {
  const response = await API.patch(formatUrl(url), data, config);
  return response.data;
};

export const apiDelete = async (url, config) => {
  const response = await API.delete(formatUrl(url), config);
  return response.data;
};

export default API;
