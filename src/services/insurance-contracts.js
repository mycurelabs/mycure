import { sdk } from '@/boot/mycure';
import { omit } from 'lodash';

export const createInsuranceContracts = (payload) => {
  return sdk.service('insurance-contracts').create(payload);
};

export const getInsuranceContracts = async (opts) => {
  if (!opts?.facility) throw new Error('Facility id is required to get insurance contracts');
  const personalDetailsSelectKeys = [
    'doc_eSignatureURL',
    'doc_PRCLicenseNo',
    'doc_PTRNo',
    'name',
    'picURL',
    'PRCLicenseNo',
  ];
  const query = {
    type: { $in: ['corporate-partner-patient', 'insurance-patient'] },
    insuredOrganization: opts.facility,
    $sort: { createdAt: -1 },
    $populate: {
      insured: {
        method: 'get',
        service: 'medical-patients',
        localKey: 'insured',
      },
      insurerCorporate: {
        service: 'insurance-contracts',
        method: 'get',
        localKey: 'insurer',
      },
      insurerOrg: {
        service: 'organizations',
        method: 'get',
        localKey: 'insurer',
      },
      latestEncounter: {
        service: 'medical-encounters',
        method: 'findOne',
        localKey: 'insured',
        foreignKey: 'patient',
        $sort: { createdAt: -1 },
        finishedAt: { $exists: true },
        $populate: {
          invoice: {
            service: 'billing-invoices',
            method: 'get',
            localKey: 'invoice',
            $populate: {
              peItem: {
                service: 'billing-items',
                method: 'findOne',
                localKey: 'id',
                foreignKey: 'invoice',
                refType: 'pe',
                $populate: {
                  service: {
                    service: 'services',
                    method: 'get',
                    localKey: 'ref',
                  },
                },
              },
            },
          },
        },
      },
      apeReports: {
        service: 'medical-records',
        method: 'find',
        localKey: 'insured',
        foreignKey: 'patient',
        type: 'ape-report',
        finalizedAt: { $exists: true },
        $populate: {
          patient: {
            method: 'get',
            service: 'medical-patients',
            localKey: 'patient',
            $select: personalDetailsSelectKeys,
          },
        },
      },
    },
  };

  if (opts.label) query.label = opts.label;
  if (opts.insurer) query.insurer = opts.insurer;

  if (opts.limit) query.$limit = opts.limit;
  if (opts.skip) query.$skip = opts.skip;

  if (opts?.searchText) {
    query.name = { $regex: `^${opts.searchText}`, $options: 'i' };
  }

  const { items, total } = await sdk.service('insurance-contracts').find(query);
  return {
    total,
    items: items.map((item) => {
      const apeReports = item.$populated?.apeReports.map(report => {
        return {
          ...omit(report, ['$populated']),
          patient: report.$populated?.patient,
        };
      });
      const latestEncounter = {
        ...omit(item.$populated?.latestEncounter, ['$populated']),
        invoice: item.$populated?.latestEncounter?.$populated.invoice,
      };
      return {
        ...omit(item, ['$populated']),
        insured: item.$populated?.insured,
        apeReports,
        latestEncounter,
        insurerCorporate: item.$populated?.insurerCorporate,
        insurerOrg: item.$populated?.insurerOrg,
      };
    }),
  };
};

export const getInsuranceFacilities = async (opts) => {
  if (!opts?.facility) throw new Error('Facility id is required to search companies');
  const query = {
    insured: opts.facility,
    $sort: { insurerName: 1 },
    $populate: {
      insurerData: {
        service: 'organizations',
        method: 'get',
        localKey: 'insurer',
      },
    },
  };

  if (opts.type) query.type = opts.type;
  if (opts.insurerSubtype) query.insurerSubtype = opts.insurerSubtype;

  if (opts.searchString) {
    query.insurerName = { $regex: `^${opts.searchString}`, $options: 'i' };
  }

  const { items } = await sdk.service('insurance-contracts').find(query);
  return {
    items: items.map(item => {
      return {
        ...omit(item, ['$populated']),
        insurerData: item.$populated?.insurerData,
      };
    }),
  };
};
