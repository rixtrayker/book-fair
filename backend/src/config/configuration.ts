export default () => {
  console.log('Configuration - JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
  console.log('Configuration - NODE_ENV:', process.env.NODE_ENV);
  
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3001,
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    
    database: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      name: process.env.DATABASE_NAME || 'kotobgy',
    },
    
    jwt: {
      secret: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
      expiresIn: process.env.JWT_EXPIRATION || '7d',
    },
    
    language: {
      default: process.env.DEFAULT_LANGUAGE || 'ar',
    },
    
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
      provider: process.env.EMAIL_PROVIDER || 'sendgrid',
      from: process.env.EMAIL_FROM || 'noreply@kotobgy.com',
      sendgridApiKey: process.env.SENDGRID_API_KEY,
    },
    
    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
      limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
    },
  };
};
