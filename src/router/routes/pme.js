import { getLayoutTypeQueryParam } from '../utils';
const layoutType = getLayoutTypeQueryParam();
const appBuildType = process.env.APP_BUILD_TYPE;

const route = {
  path: '/pme',
  name: 'pme-landing',
  redirect: {
    name: 'pme-worklist',
  },
  meta: {
    pageTitle: 'PME',
    requiresAuth: true,
    footprint: {
      name: 'PME',
      icon: 'la la-home',
    },
  },
  component: () => import('src/layouts/pme/FullLayout.vue'),
  children: [
    {
      path: 'worklist',
      name: 'pme-worklist',
      component: () => import('pages/pme/WorklistPage'),
      meta: {
        pageTitle: 'Worklist',
        requiresAuth: true,
        footprint: {
          name: 'Worklist',
          icon: 'la la-list',
        },
      },
    },
    {
      path: 'walk-in-package',
      name: 'pme-walk-in-package',
      component: () => import('pages/pme/WalkInPackagePage'),
      meta: {
        pageTitle: 'Walk-in Package',
        requiresAuth: true,
        footprint: {
          name: 'Walk-in Package',
          icon: 'la la-walking',
        },
      },
    },
    {
      path: 'group-package',
      name: 'pme-group-package',
      component: () => import('pages/pme/GroupPackagePage'),
      meta: {
        pageTitle: 'Group Package',
        requiresAuth: true,
        footprint: {
          name: 'Group Package',
          icon: 'la la-users',
        },
      },
    },
    {
      path: 'monitoring-report',
      name: 'pme-monitoring-report',
      component: () => import('pages/pme/MonitoringReportPage'),
      meta: {
        pageTitle: 'Monitoring Report',
        requiresAuth: true,
        footprint: {
          name: 'Monitoring Report',
          icon: 'la la-chart-bar',
        },
      },
    },
    {
      path: 'summary-report',
      name: 'pme-summary-report',
      component: () => import('pages/pme/SummaryReportPage'),
      meta: {
        pageTitle: 'Summary Report',
        requiresAuth: true,
        footprint: {
          name: 'Summary Report',
          icon: 'la la-chart-pie',
        },
      },
    },
    {
      path: 'report-templates',
      name: 'pme-report-templates',
      component: () => import('pages/pme/ReportTemplatesPage'),
      meta: {
        pageTitle: 'Report Templates',
        requiresAuth: true,
        footprint: {
          name: 'Report Templates',
          icon: 'la la-file',
        },
      },
    },
  ],
};

if (layoutType === 'blank' || appBuildType === 'full') {
  route.component = () => import('layouts/BlankLayout.vue');
}

export default route;
