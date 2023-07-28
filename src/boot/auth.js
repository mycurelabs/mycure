import { useSdk } from './mycure';

export function useAuth () {
  const sdk = useSdk();

  const currentUser = sdk.currentUser$;
  const signin = async (data) => sdk.signinWithEmail(data.email, data.password);
  const signout = async () => sdk.signout();

  return {
    currentUser,
    signin,
    signout,
  };
}

export function useCurrentUser () {
  return useAuth().currentUser;
}

export function registerAuthGuards (router, sdk) {
  // guard must be authenticated
  router.beforeEach(async (to, from) => {
    if (!to.matched.some(record => record.meta.requiresAuth)) return;
    const currentUser = await sdk.currentUser();
    // requires authenticated
    if (!currentUser) return { name: 'signin', query: { next: to.fullPath } };
    // requires service account
    if (to.matched.some(record => record.meta.requiresServiceAccount)) {
      if (!currentUser.isServiceAccount) {
        return { name: 'forbidden', query: { to: to.path, from: from.path } };
      }
    }
  });

  // guard must be unauthenticated
  router.beforeEach(async (to, from) => {
    if (!to.matched.some(record => record.meta.requiresUnauth)) return;
    if (!await sdk.currentUser()) return;
    return { name: 'app' };
  });
}

// boot initialization
export default function boot ({ app, router }) {
  // attach global auth module
  const sdk = app.config.globalProperties.$sdk;

  // register guards
  registerAuthGuards(router, sdk);
}
