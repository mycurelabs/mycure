import { boot } from 'quasar/wrappers';
import VueFootprints from 'vue-footprints';

export default boot(({ app }) => {
  app.use(VueFootprints);
});
