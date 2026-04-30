import config, { validateConfig } from './config.js';

try {
  validateConfig(config);
} catch (error) {
  console.error('Configuration Error:', error.message);
  process.exit(1);
}

export { config, validateConfig };
export default config;
