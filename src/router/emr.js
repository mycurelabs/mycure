import { getLayoutTypeQueryParam } from './utils';
const layoutType = getLayoutTypeQueryParam();
const appBuildType = process.env.APP_BUILD_TYPE;

const route = {
  path: '/emr',
  name: 'emr-landing',
  redirect: {
    name: 'emr-worklist',
  },
  component: () => import('src/layouts/FullStandaloneLayout.vue'),
  children: [
    {
      path: 'worklist',
      name: 'emr-worklist',
      component: () => import('pages/emr/WorklistPage'),
    },
  ],
};

if (layoutType === 'blank' || appBuildType === 'full') {
  route.component = () => import('layouts/BlankLayout.vue');
}

export default route;
