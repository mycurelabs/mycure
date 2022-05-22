
const routes = [
  // {
  //   path: '/',
  //   redirect: '/portal-home',
  //   component: () => import('layouts/BlankLayout.vue'),
  //   children: [
  //     {
  //       name: 'portal-home',
  //       path: '/portal-home',
  //       component: () => import('pages/hippocrades-dev-portal/portal/Home.vue'),
  //     },
  //   ],
  // },
  {
    path: '/',
    component: () => import('pages/hippocrades-dev-portal/HomePage'),
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
