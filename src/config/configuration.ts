export default () => ({
  port: parseInt(process.env.PORT ?? "3001", 10),
  database_url: process.env.DATABASE_URL || "mongodb://localhost:27017/nest",
  jwt_secret: process.env.JWT_SECRET || "default_jwt_secret_for_development",
  // AWS S3 Configuration
  s3: {
    endPoint: process.env.S3_END_POINT || "s3-ap-southeast-1.amazonaws.com",
    port: parseInt(process.env.S3_PORT || "443", 10),
    useSSL: process.env.S3_USE_SSL === "true",
    accessKey: process.env.S3_ACCESS_KEY || "",
    secretKey: process.env.S3_SECRET_KEY || "",
    bucket: process.env.S3_BUCKET || "your-bucket-name",
    region: process.env.S3_REGION || "ap-southeast-1",
  },
  // rate limit
  throttler: {
    ttl: parseInt(process.env.THROTTLE_TTL || "60", 10), // 1 minute
    limit: parseInt(process.env.THROTTLE_LIMIT || "10", 10), // 10 requests per minute
  },
  // OpenRouter
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    defaultModel:
      process.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-3.5-turbo",
    maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || "4000", 10),
    temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || "0.7"),
  },
  app: {
    baseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  },
});
