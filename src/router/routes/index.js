const routes = [
  {
    path: '/',
    component: () => import('layouts/BlankLayout.vue'),
    redirect: '/signin',
    children: [
      { path: 'signin', component: () => import('pages/SigninPage.vue') },
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
