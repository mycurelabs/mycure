import { sdk } from '@/boot/mycure';
import { omit, uniqBy } from 'lodash';
import { getPatient } from '@/services/patients';

export const getPmeEncounter = async (opts) => {
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
        facility: {
          method: 'findOne',
          service: 'organizations',
          localKey: 'facility',
        },
        medicalRecords: {
          service: 'medical-records',
          idField: 'encounter',
          method: 'find',
          key: 'id',
          type: {
            $nin: ['ape-report', 'philhealht-form'],
          },
          $populate: {
            template: {
              service: 'form-templates',
              localKey: 'template',
              method: 'get',
            },
            createdByDetails: {
              service: 'personal-details',
              idField: 'id',
              method: 'findOne',
              key: 'createdBy',
            },
            createdByMembership: {
              service: 'organization-members',
              idField: 'uid',
              method: 'findOne',
              key: 'createdBy',
            },
            medicalProcedureProviders: {
              service: 'personal-details',
              method: 'find',
              localKey: 'providers',
              foreignKey: 'id',
            },
            ref: {
              service: 'services',
              method: 'get',
              localKey: 'ref',
            },
            tests: {
              service: 'diagnostic-tests',
              method: 'find',
              localKey: 'tests',
              extractKey: 'id',
              foreignKey: 'id',
            },
            measures: {
              service: 'diagnostic-measures',
              method: 'find',
              localKey: 'tests',
              extractKey: 'id',
              foreignKey: 'test',
            },
            results: {
              service: 'medical-records',
              method: 'find',
              localKey: 'id',
              foreignKey: 'order',
              type: {
                $in: ['lab-test-result', 'imaging-test-result'],
              },
              $populate: {
                tests: {
                  service: 'diagnostic-tests',
                  method: 'find',
                  localKey: 'results',
                  extractKey: 'test',
                  foreignKey: 'id',
                },
                measures: {
                  service: 'diagnostic-measures',
                  method: 'find',
                  localKey: 'results',
                  extractKey: 'measure',
                  foreignKey: 'id',
                },
              },
            },
            service: {
              service: 'services',
              method: 'findOne',
              localKey: 'service',
              foreignKey: 'id',
            },
            provider: {
              service: 'personal-details',
              method: 'findOne',
              localKey: 'provider',
            },
          },
        },
      },
    },
  });

  const patient = await getPatient(encounter.patient);

  // const { items: medicalRecords } = await sdk.service('medica-records').find({

  // });

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

  const patientMapped = patient;
  const apeReportMapped = {
    ...omit(apeReport, ['$populated']),
    ...apeReport?.$populated,
  };
  const facilityMapped = encounter.$populated?.facility;
  const medicalRecords = encounter.$populated?.medicalRecords;

  return {
    encounter: omit(encounter, ['$populated']),
    patient: patientMapped,
    facility: facilityMapped,
    apeReport: apeReportMapped,
    medicalRecords,
  };
};

export const getPmeEncounters = async (opts) => {
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
    // query override
    ...opts,
  };

  if (opts?.patient) query.patient = opts.patient;

  const { items, total } = await sdk.service('medical-encounters').find(query);
  const itemsMapped = items.map(item => {
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
    items: itemsMapped,
    total,
  };
};
