import { sdk } from '@/boot/mycure';
import { omit } from 'lodash';

export const getServices = async (opts) => {
  if (!opts?.facility) throw new Error('Facility id is required to search services');
  const query = {
    facility: opts.facility,
    archivedAt: {
      $exists: false,
    },
    $populate: {
      coveragesData: {
        service: 'insurance-coverages',
        key: 'coverages',
        $populate: {
          contractData: {
            service: 'insurance-contracts',
            key: 'contract',
          },
        },
      },
      refData: {
        service: 'diagnostic-tests',
        method: 'get',
        localKey: 'ref',
        foreignKey: 'id',
      },
    },
  };

  if (opts?.searchText) {
    query.name = { $regex: `^${opts.searchText}`, $options: 'i' };
  }

  if (opts?.type) {
    if (!query.$and?.length) query.$and = [];
    const types = Array.isArray(opts.type) ? opts.type : [opts.type];
    query.$and.push({
      $or: [
        { type: { $in: types } },
        { subtype: { $in: types } },
      ],
    });
  }

  const { items } = await sdk.service('services').find(query);
  return {
    items: items.map(item => {
      return {
        ...omit(item, ['$populated']),
        coveragesData: item.$populated?.coveragesData,
      };
    }),
  };
};
