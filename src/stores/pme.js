import { defineStore } from 'pinia';
import { sdk } from '@/boot/mycure';

export const usePmeStore = defineStore('counter', {
  state: () => ({
    pmeEncounters: [],
  }),
  getters: {},
  actions: {
    async getPmeEncounters () {
      try {
        const { items } = await sdk.service('fixtures').find({ type: 'address-country' });
        this.pmeEncounters = items;
      } catch (e) {
        console.error(e);
      }
    },
  },
});
