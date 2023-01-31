import { defineStore } from 'pinia';
import { sdk } from '@/boot/mycure';
import { omit, uniqBy } from 'lodash';

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
          // id: '63bd1d72e7668c5f2040e178',
          $sort: { createdAt: -1 },
          $populate: {
            patient: {
              service: 'personal-details',
              method: 'get',
              localKey: 'patient',
            },
            billingItemsData: {
              service: 'billing-items',
              method: 'find',
              type: 'service',
              refType: 'pe',
              localKey: 'invoice',
              foreignKey: 'invoice',
              $populate: {
                serviceData: {
                  service: 'services',
                  method: 'findOne',
                  localKey: 'ref',
                  foreignKey: 'id',
                },
              },
            },
            precedingBillingItemsData: {
              service: 'billing-items',
              refType: 'pe',
              method: 'find',
              localKey: 'precedingParent',
              foreignKey: 'invoice',
              $populate: {
                serviceData: {
                  service: 'services',
                  localKey: 'ref',
                },
              },
            },
          },
          ...opts,
        };

        const { items, total } = await sdk.service('medical-encounters').find(query);
        this.pmeEncountersTotal = total;
        this.pmeEncounters = items.map(item => {
          return {
            ...omit(item, ['$populated']),
            isFollowup: item?.preceding || item?.precedingParent,
            patient: item?.$populated?.patient,
            // NOTE: combine unique billing items from current encounter and preceding encounter
            invoiceItems: uniqBy([
              ...(item?.$populated?.billingItemsData || []),
              ...(item?.$populated?.precedingBillingItemsData || []),
            ], 'ref'),
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
