import { getLayoutTypeQueryParam } from '../utils';
const layoutType = getLayoutTypeQueryParam();
const appBuildType = process.env.APP_BUILD_TYPE;

const route = {
  path: '/pme',
  redirect: {
    name: 'report-template',
  },
  meta: {
    pageTitle: 'Report Template',
    requiresAuth: true,
    footprint: {
      name: 'Report Templates',
      icon: 'la la-home',
    },
  },
  component: () => import('src/layouts/ReportTemplateLayout'),
  children: [
    {
      path: 'report-template/:reportTemplate?',
      name: 'report-template',
      component: () => import('pages/pme/ReportTemplatePage'),
      meta: {
        pageTitle: 'Create or Edit Template',
        requiresAuth: true,
        footprint: {
          name: 'Create or Edit Template',
          icon: 'la la-list',
        },
      },
    },
  ],
};

if (layoutType === 'blank' || appBuildType === 'full') {
  route.component = () => import('layouts/BlankLayout.vue');
}

export default route;
