import { defineStore } from 'pinia';
import { sdk } from '@/boot/mycure';

export const usePatientsStore = defineStore('patients', {
  state: () => ({
    patients: [],
  }),
  getters: {},
  actions: {
    /**
     * @param {Object} opts
     * @param {String} opts.facility - Facility id
     * @param {Boolean} opts.archived - Fetch archived patients or not
     * @param {String} opts.searchText - Search text query
     * @param {String} opts.sex - Sex of patient
     * @param {Array} opts.tags - Array tags
     * @returns Array of patients
     */
    async getPatients (opts) {
      try {
        if (!opts.facility) throw new Error('Facility id is required to search patients');
        const query = {
          type: 'medical-patients',
          facility: opts.facility,
          archived: { $exists: !!opts?.archived },
          archivedAt: { $exists: !!opts?.archived },
          removedAt: { $exists: false },
          $sort: { id: 1 },
          $populate: {
            patient: {
              service: 'medical-patients',
              localKey: 'id',
              foreignKey: 'id',
            },
          },
        };

        // pagination
        // if (typeof opts.limit === 'number') query.$limit = opts.limit;
        // if (typeof opts.skip === 'number') query.$skip = opts.skip;

        if (opts?.searchText) {
          query.$search = {
            text: opts.searchText,
          };
        }

        // if (opts?.searchText || opts?.sex || opts?.tags) {
        //   query.$search = {
        //     query: {
        //       text: opts.searchText,
        //       sex: opts.sex,
        //       tags: opts.tags,
        //     },
        //     sort: { 'name.lastNameNormalized': 1 },
        //     archived: { $exists: !!opts?.archived },
        //     archivedAt: { $exists: !!opts?.archived },
        //   };
        // }

        const { items, total } = await sdk.service('personal-details').find(query);

        const mapped = items?.map(item => {
          return {
            ...item,
            ...item.$populated.personalDetails,
          };
        });

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
