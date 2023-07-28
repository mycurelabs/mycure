import { ref } from 'vue';
import { useSdk } from './mycure';
import { createPaginatedDataset } from './helpers.js';

export const STORAGE_KEY_LAST_MEMBERSHIP = 'usr:mem';

/**
 * @typedef {object} Organization
 * @property {string} id
 * @property {string} name
 * @property {string} picURL
 * @property {string} name
 * @property {string} description
 **/

/**
 * @typedef {object} Membership
 * @property {string} id membership id
 * @property {Organization} organization organization the membership is a part of
 * @property {string} uid uid of the associated account
 * @property {Array<string>} roles roles of the member
 **/

export function decorateSdk (sdk) {
  if (sdk.activeMembership$) return sdk;
  const formatMembership = (membership) => {
    if (!membership?.id) return membership;
    const { $populated, ...rest } = membership;
    return { ...rest, ...$populated };
  };
  const signoutOrig = sdk.signout;
  Object.assign(sdk, {
    activeMembership$: ref(null),
    async activeMembership () {
      if (sdk.activeMembership$.value) return this.activeMembership$;

      const currentUser = await this.currentUser();
      if (!currentUser?.uid) throw new Error('No current user is set');

      // get last active membership
      const query = {
        uid: currentUser.uid,
        $select: ['id', 'organization', 'uid', 'roles'],
        $populate: {
          organization: {
            service: 'organizations',
            localKey: 'organization',
            foreignKey: 'id',
            $select: ['id', 'type', 'picURL', 'name', 'description'],
          },
        },
      };
      const lastMembershipId = globalThis.localStorage.getItem(STORAGE_KEY_LAST_MEMBERSHIP);
      const lastMembership = await this.get(['organization-members', lastMembershipId].join('/'), query);
      if (lastMembership?.id) return this.setActiveMembership(formatMembership(lastMembership));

      // fetch current list of memberships
      const res = await this.fetchMemberships();
      // select first one by default
      if (!res.data?.length) return;
      return this.setActiveMembership(res.data[0]);
    },
    async setActiveMembership (membership) {
      if (!membership?.id && !membership.organization?.id) {
        throw new Error('A valid organization membership is required to set the active membership');
      }
      this.activeMembership$.value = {
        id: membership.id,
        roles: membership.roles || [],
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
          picURL: membership.organization.picURL,
          description: membership.organization.description,
        },
      };
      globalThis.localStorage.setItem(STORAGE_KEY_LAST_MEMBERSHIP, membership.id);
      return this.activeMembership();
    },
    async fetchMemberships (opts) {
      opts = Object.assign({
        searchstring: '',
        page: 1,
        pageSize: 20,
      }, opts);
      opts.searchstring = opts.searchstring.trim();

      const currentUser = await this.currentUser();
      if (!currentUser?.uid) throw new Error('No current user is set');

      const query = {
        uid: currentUser.uid,
        $page: opts.page,
        $limit: opts.pageSize,
        $select: ['id', 'organization', 'uid', 'roles'],
        $populate: {
          organization: {
            service: 'organizations',
            localKey: 'organization',
            foreignKey: 'id',
            $select: ['id', 'type', 'picURL', 'name', 'description'],
          },
        },
      };
      if (opts.searchstring) {
        // TODO: implement for organizations
        // query.name = {
        //   $regex: `^${opts.searchstring}`,
        //   $options: 'i',
        // };
      }
      const res = await this.list('organization-members', query);
      res.data = res.data.map(formatMembership);
      return res;
    },
    async signout () {
      await signoutOrig.apply(sdk);
      globalThis.localStorage.removeItem(STORAGE_KEY_LAST_MEMBERSHIP);
    },
  });
  return sdk;
}

export function useActiveMembership () {
  const sdk = useSdk();
  return sdk.activeMembership$;
}

export function useMemberships (opts) {
  // extract sdk
  const sdk = useSdk();

  // create dataset
  const dataset = createPaginatedDataset((params) => sdk.fetchMemberships({
    searchstring: params.query.searchstring || '',
    pageSize: params.pagination.pageSize,
    page: params.pagination.page,
  }), { ...opts });

  // set current organization
  const setActiveMembership = async membership => sdk.setActiveMembership(membership);

  return {
    ...dataset,
    setActiveMembership,
  };
}

export function registerAuthGuards (router, sdk) {
  // guard must be a member of a valid organization
  router.beforeEach(async (to, from) => {
    if (!to.matched.some(record => record.meta.requiresActiveMembership)) return;
    const activeMembership = await sdk.activeMembership();
    // requires authenticated
    if (activeMembership) return;
    // not allowed
    const reason = 'You are not an active member of a valid organization';
    return { name: 'forbidden', query: { to: to.path, from: from.path, reason } };
  });
}

// boot initialization
export default function boot ({ app, router }) {
  // attach global organizations module
  const sdk = decorateSdk(app.config.globalProperties.$sdk);

  // register guards
  registerAuthGuards(router, sdk);
}
