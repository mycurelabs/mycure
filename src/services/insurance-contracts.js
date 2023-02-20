import { sdk } from '@/boot/mycure';
import { omit } from 'lodash';

export const getInsuranceContracts = async (opts) => {
  if (!opts.facility) throw new Error('Facility id is required to search patients');
  const query = {
    type: { $in: ['corporate-partner-patient', 'insurance-patient'] },
    insuredOrganization: opts.facility,
    $sort: { createdAt: -1 },
    $populate: {
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
      },
      apeReports: {
        service: 'medical-records',
        method: 'find',
        localKey: 'insured',
        foreignKey: 'patient',
        type: 'ape-report',
        finalizedAt: { $exists: true },
      },
    },
  };

  if (opts.limit) query.$limit = opts.limit;
  if (opts.skip) query.$skip = opts.skip;

  if (opts?.searchText) {
    query.name = { $regex: `^${opts.searchText}`, $options: 'i' };
  }

  const { items, total } = await sdk.service('insurance-contracts').find(query);
  return {
    total,
    items: items.map((item) => {
      return {
        ...omit(item, ['$populated']),
        apeReports: item.$populated?.apeReports,
        insurerCorporate: item.$populated?.insurerCorporate,
        insurerOrg: item.$populated?.insurerOrg,
        latestEncounter: item.$populated?.latestEncounter,
      };
    }),
  };
};
