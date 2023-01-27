import { defineStore } from 'pinia';
import { sdk } from '@/boot/mycure';
import { omit } from 'lodash';

export const usePmeStore = defineStore('pme', {
  state: () => ({
    pmeEncounters: [],
  }),
  getters: {},
  actions: {
    async getPmeEncounters (opts) {
      try {
        const query = {
          pePerformed: true,
          $sort: { createdAt: -1 },
          $populate: {
            patient: {
              service: 'personal-details',
              method: 'get',
              localKey: 'patient',
            },
          },
          ...opts,
        };
        console.warn('query', query);
        const { items } = await sdk.service('medical-encounters').find(query);
        this.pmeEncounters = items.map(item => {
          return {
            ...omit(item, ['$populated']),
            patient: item?.$populated?.patient,
          };
        });
        console.warn('this.pmeEncounters', this.pmeEncounters);
      } catch (e) {
        console.error(e);
      }
    },
  },
});
