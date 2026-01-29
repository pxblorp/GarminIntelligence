declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BACKEND_URL: string;
      JWT_SECRET: string;
      TURSO_DB_URL: string;
      TURSO_DB_AUTH_TOKEN: string;
      NODE_ENV: 'development' | 'production';
    }
  }
}

export {};
