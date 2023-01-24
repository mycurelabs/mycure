import { getLayoutTypeQueryParam } from './utils';
const layoutType = getLayoutTypeQueryParam();
const appBuildType = process.env.APP_BUILD_TYPE;

const route = {
  path: '/pme',
  name: 'pme-landing',
  redirect: {
    name: 'pme-worklist',
  },
  component: () => import('src/layouts/FullStandaloneLayout.vue'),
  children: [
    {
      path: 'worklist',
      name: 'pme-worklist',
      component: () => import('pages/pme/WorklistPage'),
    },
  ],
};

if (layoutType === 'blank' || appBuildType === 'full') {
  route.component = () => import('layouts/BlankLayout.vue');
}

export default route;
