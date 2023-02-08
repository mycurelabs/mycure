import { defineStore } from 'pinia';
import { getPmeEncounters, getPmeEncounter } from '@/services/pme';

export const usePmeStore = defineStore('pme', {
  state: () => ({
    pmeEncounters: [],
    pmeEncountersTotal: [],
    pmeEncounter: {},
  }),
  getters: {},
  actions: {
    async getPmeEncounters (opts) {
      const { items, total } = await getPmeEncounters(opts);
      this.pmeEncounters = items;
      this.pmeEncountersTotal = total;
    },
    async getPmeEncounter (opts) {
      return getPmeEncounter(opts);
    },
  },
});
