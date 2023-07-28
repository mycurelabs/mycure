export default {
  path: '/app',
  name: 'app',
  component: () => import('layouts/BlankLayout.vue'),
  redirect: '/app/dashboard',
  children: [
    {
      name: 'dashboard',
      path: 'dashboard',
      component: () => import('pages/DashboardPage.vue'),
      meta: {
        requiresAuth: true,
      },
    },
  ],
};
