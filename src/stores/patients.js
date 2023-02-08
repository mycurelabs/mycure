import { defineStore } from 'pinia';
import { getPatient, getPatients } from '@/services/patients';

export const usePatientsStore = defineStore('patients', {
  state: () => ({
    patients: [],
  }),
  getters: {},
  actions: {
    async getPatient (id) {
      return getPatient(id);
    },
    async getPatients (opts) {
      const { items, total } = await getPatients(opts);
      this.patients = items;
      return {
        items,
        total,
      };
    },
  },
});
