import { defineStore } from 'pinia';
import { sdk } from '@/boot/mycure';
import { omit, uniqBy } from 'lodash';

export const usePmeStore = defineStore('pme', {
  state: () => ({
    pmeEncounters: [],
    pmeEncountersTotal: [],
    pmeEncounter: {},
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

        if (opts?.patient) query.patient = opts.patient;

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
    async getPmeEncounter (opts) {
      if (!opts?.id) throw new Error('Encounter id is required');
      const personalDetailsSelectKeys = [
        'doc_eSignatureURL',
        'doc_PRCLicenseNo',
        'doc_PTRNo',
        'name',
        'picURL',
        'PRCLicenseNo',
      ];
      const encounterId = opts.id;
      const encounter = await sdk.service('medical-encounters').get(encounterId, {
        query: {
          $populate: {
            patient: {
              service: 'personal-details',
              method: 'findOne',
              localKey: 'patient',
            },
            facility: {
              service: 'organizations',
              method: 'findOne',
              localKey: 'facility',
            },
          },
        },
      });

      const apeReport = await sdk.service('medical-records').findOne({
        encounter: encounterId,
        type: 'ape-report',
        $populate: {
          examinedByData: {
            service: 'personal-details',
            foreignKey: 'id',
            method: 'findOne',
            localKey: 'examinedBy',
            $select: personalDetailsSelectKeys,
          },
          reviewedByData: {
            service: 'personal-details',
            foreignKey: 'id',
            method: 'findOne',
            localKey: 'reviewedBy',
            $select: personalDetailsSelectKeys,
          },
          createdByDetails: {
            service: 'personal-details',
            foreignKey: 'id',
            method: 'findOne',
            localKey: 'createdBy',
            $select: personalDetailsSelectKeys,
          },
          finalizedByData: {
            service: 'personal-details',
            foreignKey: 'id',
            method: 'findOne',
            localKey: 'finalizedBy',
            $select: personalDetailsSelectKeys,
          },
          templateData: {
            service: 'form-templates',
            foreignKey: 'id',
            method: 'findOne',
            localKey: 'template',
          },
        },
      });

      // console.warn('encounter', encounter);
      // console.warn('apeReport', apeReport);

      return {
        encounter: {
          ...omit(encounter, ['$populated']),
          patient: encounter?.$populated.patient,
          facility: encounter?.$populated.facility,
        },
        apeReport: {
          ...omit(apeReport, ['$populated']),
          ...apeReport?.$populated,
        },
      };
    },
  },
});
