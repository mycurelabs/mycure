import { defineStore } from 'pinia';
import { sdk } from '@/boot/mycure';
import { omit } from 'lodash';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: {},
    uid: null,
    userMemberships: [],
    userOrganizations: [],
    userActiveOrganization: {},
    userActiveMembership: {},
    userActiveOrganizationBranches: [],
  }),
  getters: {},
  actions: {
    async populateCurrentUser () {
      try {
        /**
         * Get logged in user and their personal details
         */
        const user = await sdk.service('auth').currentUser();
        const personalDetails = await sdk.service('personal-details').get(user.uid);
        this.user = {
          ...user,
          ...personalDetails,
        };
        this.uid = user.uid;

        /**
         * Get user membership data
         * and populate organization details
         */
        const membershipQuery = {
          uid: user.uid,
          $populate: {
            organization: {
              service: 'organizations',
              method: 'get',
              localKey: 'organization',
              $select: ['id', 'name', 'description', 'picURL', 'picDataURI', 'type'],
            },
          },
        };
        const { items } = await sdk.service('organization-members').find(membershipQuery);
        this.userMemberships = items?.map(item => {
          return {
            membership: omit(item, ['$populated']),
            organization: item?.$populated?.organization,
          };
        });

        /**
         * Set organizations
         */
        this.userOrganizations = items?.map(item => item?.$populated?.organization || {});

        /**
         * Set active organization
         */
        const activeOrgId = localStorage.getItem('active-organization');
        if (activeOrgId) {
          this.setActiveOrganzation(activeOrgId);
          return;
        }
        const firstOrg = this.userOrganizations?.[0] || {};
        this.setActiveOrganzation(firstOrg.id);
      } catch (e) {
        console.error(e);
      }
    },
    async setActiveOrganzation (id) {
      this.userActiveOrganization = this.userOrganizations.find(item => item.id === id) || {};
      localStorage.setItem('active-organization', id);
      this.setActiveMembership(id);
      const { items } = await sdk.service('organizations').find({ parent: id });
      this.userActiveOrganizationBranches = items;
    },
    setActiveMembership (orgId) {
      const result = this.userMemberships.find(item => item.organization.id === orgId);
      this.userActiveMembership = result?.membership || {};
    },
  },
});
