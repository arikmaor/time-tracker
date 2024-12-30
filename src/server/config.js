module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  debug: `${process.env.DEBUG}`.toLowerCase() === 'true',

  jwtSecret: process.env.JWT_SECRET || 'jwtsecret',
  jwtIssuer: process.env.JWT_ISSUER || 'uingame',
  jwtExpiration: process.env.JWT_EXPIRATION || '30 days',

  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost/time-tracker',

  sendGridUserName: process.env.SENDGRID_USERNAME || '',
  sendGridPassword: process.env.SENDGRID_PASSWORD || ''
}
