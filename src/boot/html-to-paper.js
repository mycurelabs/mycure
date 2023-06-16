import { boot } from 'quasar/wrappers';
import VueHtmlToPaper from 'vue-html-to-paper';

export default boot(({ app }) => {
  app.use(VueHtmlToPaper);
});
