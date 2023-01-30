import { defineStore } from 'pinia';
import { sdk } from '@/boot/mycure';
import { omit } from 'lodash';

export const usePmeStore = defineStore('pme', {
  state: () => ({
    pmeEncounters: [],
    pmeEncountersTotal: [],
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
        const { items, total } = await sdk.service('medical-encounters').find(query);
        this.pmeEncountersTotal = total;
        this.pmeEncounters = items.map(item => {
          return {
            ...omit(item, ['$populated']),
            patient: item?.$populated?.patient,
          };
        });
        return {
          items,
          total,
        };
      } catch (e) {
        console.error(e);
      }
    },
  },
});
