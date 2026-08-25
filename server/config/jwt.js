module.exports = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key_for_industrial_waste_exchange_2026',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key_for_industrial_waste_exchange_2026',
  accessTokenExpire: '15m',
  refreshTokenExpire: '7d'
};
