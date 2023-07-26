import '@babel/polyfill';
import { boot } from 'quasar/wrappers';
import sdk from '@mycure/sdk-js';

export default boot(({ app }) => {
  const apiServerURI = process.env.API;
  if (apiServerURI) {
    sdk.initialize(apiServerURI, {
      timeout: 30000,
    });
  }

  app.config.globalProperties.$mycureSdk = sdk;
});

export { sdk };
