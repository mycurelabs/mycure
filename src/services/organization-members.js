import { sdk } from 'src/boot/mycure-old';
// import { omit } from 'lodash';

const SERVICE_NAME = 'organization-members';

/**
 * @param {Object} opts
 * @param {String} opts.facility - Facility id
 * @param {Boolean} opts.archived - Fetch archived patients or not
 * @param {String} opts.searchText - Search text query
 * @param {String} opts.sex - Sex of patient
 * @param {Array} opts.tags - Array tags
 * @returns Array of patients
 */
export const getOrganizationMembers = async (opts) => {
  if (!opts?.facility) throw new Error('Facility id is required to search patients');
  const query = {
    organization: opts.facility,
    $sort: { id: 1 },
    $populate: {
      personalDetails: {
        service: 'personal-details',
        localKey: 'uid',
        foreignKey: 'id',
      },
    },
  };

  if (opts.roles?.length) {
    query.roles = {
      $in: opts.roles,
    };
  }

  // pagination
  // if (typeof opts.limit === 'number') query.$limit = opts.limit;
  // if (typeof opts.skip === 'number') query.$skip = opts.skip;

  // if (opts?.searchText) {
  //   query.$search = {
  //     text: opts.searchText,
  //   };
  // }

  // if (opts?.searchText || opts?.sex || opts?.tags) {
  //   query.$search = {
  //     query: {
  //       text: opts.searchText,
  //       sex: opts.sex,
  //       tags: opts.tags,
  //     },
  //     sort: { 'name.lastNameNormalized': 1 },
  //     archived: { $exists: !!opts?.archived },
  //     archivedAt: { $exists: !!opts?.archived },
  //   };
  // }

  const { items, total } = await sdk.service(SERVICE_NAME).find(query);

  const mapped = items?.map(item => {
    return {
      ...item,
      ...item.$populated.personalDetails,
    };
  });

  return {
    items: mapped,
    total,
  };
};
