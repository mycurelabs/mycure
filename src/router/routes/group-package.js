import { getLayoutTypeQueryParam } from '../utils';
const layoutType = getLayoutTypeQueryParam();
const appBuildType = process.env.APP_BUILD_TYPE;

const route = {
  path: '/pme',
  redirect: {
    name: 'group-package',
  },
  meta: {
    pageTitle: 'Group Package',
    requiresAuth: true,
    footprint: {
      name: 'Group Packages',
      icon: 'la la-home',
    },
  },
  component: () => import('src/layouts/GroupPackageLayout'),
  children: [
    {
      path: 'group-package/:insurer?',
      name: 'group-package',
      component: () => import('pages/pme/GroupPackagePage'),
      meta: {
        pageTitle: 'View Group Package',
        requiresAuth: true,
        footprint: {
          name: 'View Group Package',
          icon: 'la la-list',
        },
      },
    },
    {
      path: 'group-package/create',
      name: 'group-package-create',
      component: () => import('pages/pme/GroupPackageCreatePage'),
      meta: {
        pageTitle: 'Create Group Package',
        requiresAuth: true,
        footprint: {
          name: 'Create Group Package',
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
