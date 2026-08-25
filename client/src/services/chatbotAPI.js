import API from './authAPI';

export const askChatbot = async (message, history = []) => {
  const response = await API.post('/chatbot/query', { message, history });
  return response.data;
};
