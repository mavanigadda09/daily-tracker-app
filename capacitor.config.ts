import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.phoenix.tracker',
  appName: 'Phoenix Tracker',
  webDir: 'dist',                    // ← must be 'dist' for Vite, not 'www'
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '287796839565-ds6ag7l9io777n0limmnctq3i4c1sne6.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;