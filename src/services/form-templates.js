import { sdk } from '@/boot/mycure';

export const getFormTemplates = async (opts) => {
  if (!opts.facility) throw new Error('Facility id is required to search patients');
  const facility = opts.facility;
  const query = {
    type: 'ape-report',
    facility,
    hiddenAt: null,
  };

  if (opts?.searchText) {
    query.name = { $regex: `^${opts.searchText}`, $options: 'i' };
  }

  return sdk.service('form-templates').find(query);
};
