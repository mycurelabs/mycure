
const routes = [
  {
    path: '/',
    redirect: '/clinic/signup',
    component: () => import('layouts/BlankLayout.vue'),
    children: [
      {
        path: 'clinic/signup',
        component: () => import('pages/hippocrades/ClinicSignup.vue'),
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
