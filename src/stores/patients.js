import { defineStore } from 'pinia';
import { sdk } from '@/boot/mycure';

export const usePatientsStore = defineStore('patients', {
  state: () => ({
    patients: [],
  }),
  getters: {},
  actions: {
    async getPatients (opts) {
      try {
        const query = {
          archivedAt: { $exists: false },
          removedAt: { $exists: false },
          $populate: {
            account: {
              service: 'personal-details',
              method: 'get',
              key: 'account',
            },
          },
          ...opts,
        };
        const { items, total } = await sdk.service('medical-patients').find(query);
        console.warn('items', items);
        const mapped = items;
        this.patients = mapped;
        return {
          items: mapped,
          total,
        };
      } catch (e) {
        console.error(e);
      }
    },
  },
});
