import { sdk } from '@/boot/mycure';
import { omit } from 'lodash';

export const getPatient = async (id) => {
  const query = {
    $populate: {
      personalDetails: {
        service: 'personal-details',
        localKey: 'id',
        foreignKey: 'id',
      },
      medicalNote: {
        service: 'medical-records',
        method: 'findOne',
        localKey: 'id',
        foreignKey: 'patient',
        type: 'medical-note',
      },
    },
  };

  // Map insurance ids from org equivalent
  const patient = await sdk.service('medical-patients').get(id, { query });
  let insurances = patient?.$populated?.personalDetails?.insuranceCards;
  let insuranceCards;
  if (insurances?.length) {
    insuranceCards = await Promise.all(
      insurances.map(item => {
        return sdk.service('organizations').get(item.insurance);
      }),
    );

    insurances = insurances.map(insurance => {
      const matched = insuranceCards.find(card => card.id === insurance.insurance);
      return {
        ...insurance,
        ...matched,
      };
    });
  }

  return {
    ...omit(patient, ['$populated']),
    ...patient?.$populated?.personalDetails,
    // overrides
    medicalNote: patient?.$populated?.medicalNote,
    insuranceCards: insurances,
    hell: '1',
  };
};

/**
 * @param {Object} opts
 * @param {String} opts.facility - Facility id
 * @param {Boolean} opts.archived - Fetch archived patients or not
 * @param {String} opts.searchText - Search text query
 * @param {String} opts.sex - Sex of patient
 * @param {Array} opts.tags - Array tags
 * @returns Array of patients
 */
export const getPatients = async (opts) => {
  if (!opts?.facility) throw new Error('Facility id is required to search patients');
  const query = {
    type: 'medical-patients',
    facility: opts.facility,
    archived: { $exists: !!opts?.archived },
    archivedAt: { $exists: !!opts?.archived },
    removedAt: { $exists: false },
    $sort: { id: 1 },
    $populate: {
      patient: {
        service: 'medical-patients',
        localKey: 'id',
        foreignKey: 'id',
      },
    },
  };

  // pagination
  // if (typeof opts.limit === 'number') query.$limit = opts.limit;
  // if (typeof opts.skip === 'number') query.$skip = opts.skip;

  if (opts?.searchText) {
    query.$search = {
      text: opts.searchText,
    };
  }

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

  const { items, total } = await sdk.service('personal-details').find(query);

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
