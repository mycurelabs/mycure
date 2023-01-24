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
      meta: {
        pageTitle: 'PME Worklist',
      },
    },
    {
      path: 'walk-in-package',
      name: 'pme-walk-in-package',
      component: () => import('pages/pme/WalkInPackagePage'),
      meta: {
        pageTitle: 'Walk-in Package',
      },
    },
    {
      path: 'group-package',
      name: 'pme-group-package',
      component: () => import('pages/pme/GroupPackagePage'),
      meta: {
        pageTitle: 'Group Package',
      },
    },
    {
      path: 'monitoring-report',
      name: 'pme-monitoring-report',
      component: () => import('pages/pme/MonitoringReportPage'),
      meta: {
        pageTitle: 'Monitoring Report',
      },
    },
    {
      path: 'summary-report',
      name: 'pme-summary-report',
      component: () => import('pages/pme/SummaryReportPage'),
      meta: {
        pageTitle: 'Summary Report',
      },
    },
  ],
};

if (layoutType === 'blank' || appBuildType === 'full') {
  route.component = () => import('layouts/BlankLayout.vue');
}

export default route;
