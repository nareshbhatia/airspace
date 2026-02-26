/**
 * Application configuration
 * Reads from Vite environment variables
 */
interface AppConfig {
  serverUrl: string;
}

/**
 * Load configuration from environment variables
 */
function loadConfig(): AppConfig {
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  // Validation
  if (!serverUrl) {
    throw new Error(
      'VITE_SERVER_URL is not set. ' +
        'Create a .env.local file with VITE_SERVER_URL=https://api.example.com',
    );
  }

  return {
    serverUrl,
  };
}

/**
 * Singleton config instance
 */
export const config = loadConfig();

// Log config on startup
if (import.meta.env.MODE === 'development') {
  console.log('[Config] Loaded configuration:', config);
}
