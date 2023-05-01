import { format } from 'date-fns';
import { formatDoctorName } from '@/utils';
import { sdk } from '@/boot/mycure';

const SERVICE_NAME = 'medical-records';

export const getApeReportsUsingTemplate = async (opts) => {
  if (!opts.template) throw new Error('Facility id is required to search patients');
  const template = opts.template;
  const query = {
    type: 'ape-report',
    template,
    $limit: 1,
  };

  return sdk.service(SERVICE_NAME).find(query);
};

export const getAmendments = async (opts) => {
  const query = {
    id: opts.id,
    $history: true,
    $sort: { _id: -1 },
    $limit: 100,
    $populate: {
      creator: {
        service: 'personal-details',
        method: 'findOne',
        localKey: '_createdBy',
        foreignKey: 'id',
        $select: ['id', 'name'],
      },
    },
  };

  const { items } = await sdk.service('medical-records').find(query);
  return items.map((item) => {
    const creator = item?.$populated?.creator || {};
    const creatorName = formatDoctorName({ name: creator.name });
    const creationDate = format(item._createdAt, 'MMM dd, yyyy hh:mm a');
    return {
      creationDate,
      creatorName,
    };
  });
};
