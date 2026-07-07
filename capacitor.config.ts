import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.equisaddles.www',
  appName: 'Equi Saddles',
  webDir: 'dist/public',
  server: {
    url: 'https://www.equisaddles.com',
    cleartext: false
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    backgroundColor: '#6B4226'
  }
};

export default config;
