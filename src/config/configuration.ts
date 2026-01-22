export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT as string, 10) || 4000,
    apiPrefix: process.env.API_PREFIX || 'api/v1',
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    connectionString: process.env.SUPABASE_CONNECTION_STRING,
    pooler: process.env.SUPABASE_POOLER,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },

  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT as string, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '900s',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '1d',
  },

  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    testSecretKey: process.env.PAYSTACK_TEST_SECRET_KEY,
    testPublicKey: process.env.PAYSTACK_TEST_PUBLIC_KEY,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    testSecretKey: process.env.STRIPE_TEST_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    testPublishableKey: process.env.STRIPE_TEST_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT as string, 10) || 6379,
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT as string, 10) || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromName: process.env.SMTP_FROM_NAME,
    fromEmail: process.env.SMTP_FROM_EMAIL,
  },

  termii: {
    apiKey: process.env.TERMII_API_KEY,
    senderId: process.env.TERMII_SENDER_ID || 'PayPips',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
});
