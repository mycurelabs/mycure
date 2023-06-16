const path = require('path');
const lodashMerge = require('lodash').merge;
const ESLintPlugin = require('eslint-webpack-plugin');
const DEFAULT_MODULE = 'full';

module.exports = function (ctx) {
  console.warn('process.argv', process.argv);

  let moduleOptionValue = null;

  const indexOfModuleOption = process.argv.indexOf('--module');
  if (indexOfModuleOption > 0) {
    moduleOptionValue = process.argv?.[indexOfModuleOption + 1];
  }

  console.log('moduleOptionValue', moduleOptionValue);

  let moduleConfig;

  if (moduleOptionValue) {
    moduleConfig = require(`./.module-${moduleOptionValue || DEFAULT_MODULE}/config.js`)({ ESLintPlugin });
  } else {
    moduleConfig = require('./.full/config.js')({ ESLintPlugin });
  }

  console.log('moduleConfig', moduleConfig);

  const config = {
    ...moduleConfig,
  };

  console.log('🚀 RUNNING CONFIG FOR', (moduleOptionValue ? moduleOptionValue.toUpperCase() : null) || DEFAULT_MODULE.toUpperCase());

  const customQuasarConfig = config.quasarConfig;

  const env = {
    APP: moduleOptionValue || DEFAULT_MODULE,
    ...require('dotenv').config({ path: './.full/.env' }).parsed,
    ...require('dotenv').config({ path: `./.module-${moduleOptionValue || DEFAULT_MODULE}/.env` }).parsed,
  };

  console.log('env', env);

  const defaultQuasarConfig = {
    supportTS: false,
    boot: [
      'axios',
      'i18n',
      'footprints',
      'html-to-paper',
      {
        server: false,
        path: 'mycure.js',
      },
    ],
    css: [
      'app.scss',
    ],
    extras: [
      'fontawesome-v6',
      'line-awesome',
      // 'mdi-v6',
      // 'ionicons-v4',
      // 'eva-icons',
      // 'themify',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!
      // 'roboto-font', // optional, you are not bound to it
      // 'material-icons', // optional, you are not bound to it
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js#Property%3A-build
    build: {
      env,

      vueRouterMode: 'history', // available values: 'hash', 'history'

      // transpile: false,
      // publicPath: '/',

      // Add dependencies for transpiling with Babel (Array of string/regex)
      // (from node_modules, which are by default not transpiled).
      // Applies only if "transpile" is set to true.
      // transpileDependencies: [],

      // rtl: true, // https://quasar.dev/options/rtl-support
      // preloadChunks: true,
      // showProgress: false,
      // gzip: true,
      // analyze: true,

      // Options below are automatically set depending on the env, set them if you want to override
      // extractCSS: false,

      // https://v2.quasar.dev/quasar-cli-webpack/handling-webpack
      // "chain" is a webpack-chain object https://github.com/neutrinojs/webpack-chain

      chainWebpack (chain) {
        chain.plugin('eslint-webpack-plugin')
          .use(ESLintPlugin, [{ extensions: ['js', 'vue'] }]);
      },

      extendWebpack (cfg) {
        cfg.module.rules.push(
          // {
          //   enforce: 'pre',
          //   test: /\.(js|vue)$/,
          //   loader: 'eslint-loader',
          //   exclude: /node_modules/,
          // },
          {
            test: /\.pug$/,
            loader: 'pug-plain-loader',
          },
        );
        cfg.resolve.alias = {
          ...cfg.resolve.alias,
          '@/': path.resolve(__dirname, './src'),
          '@/assets': path.resolve(__dirname, './src/assets'),
          '@/boot': path.resolve(__dirname, './src/boot'),
          '@/components': path.resolve(__dirname, './src/components'),
          '@/composables': path.resolve(__dirname, './src/composables'),
          '@/constants': path.resolve(__dirname, './src/constants'),
          '@/layouts': path.resolve(__dirname, './src/layouts'),
          '@/pages': path.resolve(__dirname, './src/pages'),
          '@/plugins': path.resolve(__dirname, './src/plugins'),
          '@/router': path.resolve(__dirname, './src/router'),
          '@/services': path.resolve(__dirname, './src/services'),
          '@/stores': path.resolve(__dirname, './src/stores'),
          '@/utils': path.resolve(__dirname, './src/utils'),
        };
      },

    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js#Property%3A-devServer
    devServer: {
      server: {
        type: 'http',
      },
      port: 8080,
      open: true, // opens browser window automatically
    },

    // https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js#Property%3A-framework
    framework: {
      iconSet: 'line-awesome', // Quasar icon set
      config: {
        ripple: {},
      },

      // Possible values for "importStrategy":
      // * 'auto' - (DEFAULT) Auto-import needed Quasar components & directives
      // * 'all'  - Manually specify what to import
      importStrategy: 'auto',

      // Quasar plugins
      plugins: [
        'BottomSheet',
        'Meta',
        'Notify',
        'Ripple',
        'Dialog',
      ],
    },

    // animations: 'all', // --- includes all animations
    // https://quasar.dev/options/animations
    animations: 'all',

    // https://v2.quasar.dev/quasar-cli-webpack/developing-ssr/configuring-ssr
    ssr: {
      pwa: false,

      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,

      prodPort: 3000, // The default port that the production server should use
      // (gets superseded if process.env.PORT is specified at runtime)

      maxAge: 1000 * 60 * 60 * 24 * 30,
      // Tell browser when a file from the server should expire from cache (in ms)

      chainWebpackWebserver (chain) {
        chain.plugin('eslint-webpack-plugin')
          .use(ESLintPlugin, [{ extensions: ['js'] }]);
      },

      middlewares: [
        ctx.prod ? 'compression' : '',
        'render', // keep this as last one
      ],
    },

    // https://v2.quasar.dev/quasar-cli-webpack/developing-pwa/configuring-pwa
    pwa: {
      workboxPluginMode: 'GenerateSW', // 'GenerateSW' or 'InjectManifest'
      workboxOptions: {}, // only for GenerateSW

      // for the custom service worker ONLY (/src-pwa/custom-service-worker.[js|ts])
      // if using workbox in InjectManifest mode

      chainWebpackCustomSW (chain) {
        chain.plugin('eslint-webpack-plugin')
          .use(ESLintPlugin, [{ extensions: ['js'] }]);
      },

      manifest: {
        name: 'MYCURE Dynamic Modules',
        short_name: 'MYCURE Dynamic Modules',
        description: 'MYCURE Dynamic Modules',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#0099cc',
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

    // Full list of options: https://v2.quasar.dev/quasar-cli-webpack/developing-cordova-apps/configuring-cordova
    cordova: {
      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-webpack/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true,
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-webpack/developing-electron-apps/configuring-electron
    electron: {
      bundler: 'packager', // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options

        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',

        // Windows only
        // win32metadata: { ... }
      },

      builder: {
        // https://www.electron.build/configuration/configuration
        appId: 'mycure-app',
      },

      // "chain" is a webpack-chain object https://github.com/neutrinojs/webpack-chain
      chainWebpackMain (chain) {
        chain.plugin('eslint-webpack-plugin')
          .use(ESLintPlugin, [{ extensions: ['js'] }]);
      },

      chainWebpackPreload (chain) {
        chain.plugin('eslint-webpack-plugin')
          .use(ESLintPlugin, [{ extensions: ['js'] }]);
      },

    },
  };

  const mergedConfig = lodashMerge(defaultQuasarConfig, customQuasarConfig);

  return mergedConfig;
};
