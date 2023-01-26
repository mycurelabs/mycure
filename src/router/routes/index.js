// Import all routes.
import emrRoutes from './emr';
import pmeRoutes from './pme';

// Define build type see README > App Build Type.
const appBuildType = process.env.APP_BUILD_TYPE;

// Register the module route.
// The key of the module must match the
// way it is registered in APP_BUILD_TYPE env.
// E.g. emr is APP_BUILD_TYPE=emr, pme is APP_BUILD_TYPE=pme.
const moduleRoutesMap = {
  emr: emrRoutes,
  pme: pmeRoutes,
};

// Register the landing page route.
const routes = [];

// Check APP_BUILD_TYPE
// If value is 'full', register
// all modules, otherwise register
// just the specific module.
if (appBuildType === 'full') {
  routes.push({
    path: '/',
    redirect: '/cms',
    children: [
      {
        path: '/cms',
        name: 'cms',
        redirect: '/emr',
        component: () => import('layouts/FullCmsLayout.vue'),
        children: [
          emrRoutes,
          pmeRoutes,
        ],
      },
    ],
  });
} else {
  routes.push({
    path: '/',
    name: 'landing',
    redirect: { name: 'login' },
    component: () => import('layouts/BlankLayout'),
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('pages/LoginPage'),
      },
    ],
  });
  routes.push(moduleRoutesMap[appBuildType]);
}

// Register 404 page.
// This must be always the last one.
routes.push({
  path: '/:catchAll(.*)*',
  component: () => import('pages/ErrorNotFound.vue'),
});

// Return the final route set.
export default routes;
