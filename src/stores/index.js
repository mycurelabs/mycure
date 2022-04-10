import { store } from 'quasar/wrappers';
import { createPinia } from 'pinia';
import persistedstate from 'pinia-persistedstate';

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default store((/* { ssrContext } */) => {
  const pinia = createPinia();

  // You can add Pinia plugins here
  pinia.use(persistedstate({
    key: 'client',
    // paths: ['dataStore', 'dataStore.count']  // Keep state, use module id, or state
  }));

  return pinia;
});
