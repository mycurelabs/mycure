import { sdk } from 'src/boot/mycure-old';
const appBuildType = process.env.APP_BUILD_TYPE;

export default async (to, from, next) => {
  try {
    if (to.query.token) {
      await sdk.service('auth').signout();
      await sdk.service('auth').signin('jwt', { accessToken: to.query.token }, true);
      const query = to.query;
      delete query.token;
      return next({ name: to.query.redirect || `${appBuildType}-landing`, query });
    }

    const user = await sdk.service('auth').currentUser();
    const requiresAuth = to.matched.some(r => r.meta.requiresAuth);
    if (requiresAuth) {
      // if no user go to signin
      if (!user) return next({ name: 'landing' });
    }

    // If in login and the user is logged in
    // redirect to default module landing page.
    if (to.name === 'landing-login' && user) return next({ name: to.query.redirect || `${appBuildType}-landing`, query: to.query });

    next();
  } catch (e) {
    console.error(e);
    next({ name: 'landing' });
  }
};
