
const routes = [
  {
    path: '/',
    redirect: '/signup/clinic/details',
    component: () => import('layouts/BlankLayout.vue'),
    children: [
      {
        name: 'clinic-details',
        path: '/signup/clinic/details',
        component: () => import('pages/hippocrades/signup/ClinicDetails.vue'),
      },
      {
        name: 'clinic-plan',
        path: '/signup/clinic/plan',
        component: () => import('pages/hippocrades/signup/ClinicPlan.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
