// Production-safe logger utility
// In production, only errors are logged
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  },
  info: (...args) => {
    if (!isProduction) {
      console.info(...args);
    }
  },
  debug: (...args) => {
    if (!isProduction) {
      console.debug(...args);
    }
  }
};

