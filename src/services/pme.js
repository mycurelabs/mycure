import { sdk } from '@/boot/mycure';
import { omit, uniqBy } from 'lodash';
import { getPatient } from '@/services/patients';

const MEDICAL_ENCOUNTER_SERVICE_NAME = 'medical-encounters';
const MEDICAL_RECORDS_SERVICE_NAME = 'medical-records';
const PERSONAL_DETAILS_SELECT_KEYS = [
  'doc_eSignatureURL',
  'doc_PRCLicenseNo',
  'doc_PTRNo',
  'name',
  'picURL',
  'PRCLicenseNo',
];

export const getApeReport = async (opts) => {
  const encounterId = opts?.encounterId;
  return sdk.service(MEDICAL_RECORDS_SERVICE_NAME).findOne({
    encounter: encounterId,
    type: 'ape-report',
    $populate: {
      examinedByData: {
        service: 'personal-details',
        foreignKey: 'id',
        method: 'findOne',
        localKey: 'examinedBy',
        $select: PERSONAL_DETAILS_SELECT_KEYS,
      },
      reviewedByData: {
        service: 'personal-details',
        foreignKey: 'id',
        method: 'findOne',
        localKey: 'reviewedBy',
        $select: PERSONAL_DETAILS_SELECT_KEYS,
      },
      createdByDetails: {
        service: 'personal-details',
        foreignKey: 'id',
        method: 'findOne',
        localKey: 'createdBy',
        $select: PERSONAL_DETAILS_SELECT_KEYS,
      },
      finalizedByData: {
        service: 'personal-details',
        foreignKey: 'id',
        method: 'findOne',
        localKey: 'finalizedBy',
        $select: PERSONAL_DETAILS_SELECT_KEYS,
      },
      templateData: {
        service: 'form-templates',
        foreignKey: 'id',
        method: 'findOne',
        localKey: 'template',
      },
    },
  });
};

export const getPmeEncounter = async (opts) => {
  if (!opts?.id) throw new Error('Encounter id is required');

  const encounterId = opts.id;
  const encounter = await sdk.service(MEDICAL_ENCOUNTER_SERVICE_NAME).get(encounterId, {
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

  const apeReport = await getApeReport({ encounterId });

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
      facilityData: {
        service: 'organizations',
        method: 'get',
        localKey: 'facility',
      },
      apeReport: {
        service: 'medical-records',
        foreignKey: 'encounter',
        type: 'ape-report',
        method: 'get',
      },
    },
    // query override
    ...opts,
  };

  if (opts?.patient) query.patient = opts.patient;
  if (opts?.finishedAt) query.finishedAt = opts.finishedAt;

  if (opts?.APEReportFinalizedAt) query.APEReportFinalizedAt = opts.APEReportFinalizedAt;

  const { items, total } = await sdk.service(MEDICAL_ENCOUNTER_SERVICE_NAME).find(query);

  const itemsMapped = [];

  for (const item of items) {
    const encounterId = item.id;
    const apeReport = await getApeReport({ encounterId });
    const newItem = {
      ...omit(item, ['$populated']),
      isFollowup: item?.preceding || item?.precedingParent,
      // NOTE: combine unique billing items from current encounter and preceding encounter
      invoiceItems: uniqBy([
        ...(item?.$populated?.billingItemsData || []),
        ...(item?.$populated?.precedingBillingItemsData || []),
      ], 'ref'),
      apeReport,
      patient: item?.$populated?.patient,
      facility: item?.$populated?.facilityData,
    };
    itemsMapped.push(newItem);
  }

  return {
    items: itemsMapped,
    total,
  };
};
