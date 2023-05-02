import { getLayoutTypeQueryParam } from '../utils';
const layoutType = getLayoutTypeQueryParam();
const appBuildType = process.env.APP_BUILD_TYPE;

const route = {
  path: '/print',
  name: 'print-landing',
  component: () => import('src/layouts/BlankLayout.vue'),
  children: [
    {
      path: 'pme-report/:encounter',
      name: 'print-pme-report',
      component: () => import('pages/pme/PrintReport.vue'),
    },
  ],
};

if (layoutType === 'blank' || appBuildType === 'full') {
  route.component = () => import('layouts/BlankLayout.vue');
}

export default route;
