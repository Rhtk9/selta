import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Grow',
  webDir: 'www',
  server: {
    androidScheme: 'https',    // 🔥 IMPORTANTE!
    iosScheme: 'https'         // 🔥 IMPORTANTE!
  }
};

export default config;