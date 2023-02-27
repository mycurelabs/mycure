import { sdk } from '@/boot/mycure';

export const getApeReportsUsingTemplate = async (opts) => {
  if (!opts.template) throw new Error('Facility id is required to search patients');
  const template = opts.template;
  const query = {
    type: 'ape-report',
    template,
    $limit: 1,
  };

  return sdk.service('medical-records').find(query);
};
