import { defineStore } from 'pinia';
import { sdk } from '@/boot/mycure';

export const usePmeStore = defineStore('pme', {
  state: () => ({
    pmeEncounters: [],
  }),
  getters: {},
  actions: {
    async getPmeEncounters (facility) {
      try {
        const query = {
          type: 'ape-report',
          facility,
        };
        const { items } = await sdk.service('medical-records').find(query);
        console.warn(items);
        this.pmeEncounters = items.map(item => item.id);
      } catch (e) {
        console.error(e);
      }
    },
  },
});
