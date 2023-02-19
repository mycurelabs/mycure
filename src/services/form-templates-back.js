import { sdk } from '@/boot/mycure';

export const getFormTemplates = async (opts) => {
  if (!opts.facility) throw new Error('Facility id is required to search patients');
  const facility = opts.facility;
  const query = {
    type: 'ape-report',
    facility,
    $sort: { name: 1 },
  };

  if (opts.includeHidden) {
    opts.hiddenAt = { $exists: true };
  }

  if (opts.limit) query.$limit = opts.limit;
  if (opts.skip) query.$skip = opts.skip;

  if (opts?.searchText) {
    query.name = { $regex: `^${opts.searchText}`, $options: 'i' };
  }

  console.warn('query', query);

  return sdk.service('form-templates').find(query);
};

export const archiveFormTemplate = async (id) => {
  if (!id) throw new Error('Form template id is required');
  return sdk.service('form-templates').update(id, { hide: true });
};

export const unarchiveFormTemplate = async (id) => {
  if (!id) throw new Error('Form template id is required');
  return sdk.service('form-templates').update(id, { hide: false });
};

export const removeFormTemplate = async (id) => {
  if (!id) throw new Error('Form template id is required');
  return sdk.service('form-templates').remove(id);
};

export const getFormTemplate = async (id) => {
  if (!id) throw new Error('Report tepmplate id is required');
  return sdk.service('form-templates').get(id);
};
