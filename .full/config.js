const APP_NAME = 'MYCURE PME';
const APP_SHORT_NAME = 'MYCURE PME';
const APP_DESCRIPTION = 'MYCURE\'s Physical Medical Exam Module';
const APP_PUBLIC_ICONS_FOLDER = 'icons';
const THEME = {
  primary: '#0099cc',
  secondary: '#2196F3',
  accent: '#FFC107',

  dark: '#1D1D1D',

  positive: '#7fad33',
  negative: '#f75a5f',
  info: '#2196F3',
  warning: '#FFC107',
};

module.exports = (opts) => ({
  name: APP_NAME,
  quasarConfig: {
    htmlVariables: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      publicIconsPath: APP_PUBLIC_ICONS_FOLDER,
    },
    framework: {
      config: {
        brand: THEME,
      },
    },
    pwa: {
      workboxPluginMode: 'GenerateSW', // 'GenerateSW' or 'InjectManifest'
      workboxOptions: {}, // only for GenerateSW

      manifest: {
        name: APP_NAME,
        short_name: APP_SHORT_NAME,
        description: APP_DESCRIPTION,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: THEME.primary,
        icons: [
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png',
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    },
  },
});
