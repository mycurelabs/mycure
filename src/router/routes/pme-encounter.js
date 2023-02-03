import { getLayoutTypeQueryParam } from '../utils';
const layoutType = getLayoutTypeQueryParam();
const appBuildType = process.env.APP_BUILD_TYPE;

const route = {
  path: '/pme',
  redirect: {
    name: 'pme-encounter',
  },
  meta: {
    pageTitle: 'PME',
    requiresAuth: true,
    footprint: {
      name: 'PME',
      icon: 'la la-home',
    },
  },
  component: () => import('src/layouts/EncounterLayout'),
  children: [
    {
      path: 'encounter/:encounter',
      name: 'pme-encounter',
      component: () => import('pages/pme/EncounterPage'),
      meta: {
        pageTitle: 'PME Encounter',
        requiresAuth: true,
        footprint: {
          name: 'PME Encounter',
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
