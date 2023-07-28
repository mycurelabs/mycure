import { useSdk } from 'boot/mycure';
const appBuildType = process.env.APP_BUILD_TYPE;

export default async (to, from, next) => {
  try {
    const sdk = useSdk();
    if (to.query.token) {
      await sdk.service('auth').signout();
      await sdk.service('auth').signin('jwt', { accessToken: to.query.token }, true);
      const query = to.query;
      delete query.token;
      return next({ name: to.query.redirect, query });
    }

    const user = await sdk.service('auth').currentUser();
    const requiresAuth = to.matched.some(r => r.meta.requiresAuth);
    if (requiresAuth) {
      // if no user go to signin
      if (!user) return next({ name: 'signin' });
    }

    // If in login and the user is logged in
    // redirect to default module landing page.
    if (to.name === 'signin' && user) return next({ name: to.query.redirect, query: to.query });

    next();
  } catch (e) {
    console.error(e);
    next({ name: 'signin' });
  }
};
