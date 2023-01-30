import { date } from 'quasar';
import { sdk } from '@/boot/mycure';
import { useRoute, useRouter } from 'vue-router';

const DEFAULT_ADDRESS_FORMAT = 'street1 street2 village city municipality province state region country';
const DEFAULT_NAME_FORMAT = 'firstName middleName lastName generationalSuffix';

export const useHelpers = () => {
  const formatAddress = (address, format = DEFAULT_ADDRESS_FORMAT) => {
    if (!address) return null;
    const { street1, street2, village, city, municipality, province, state, region, country } = address;
    return format.replace(/street1/gi, street1 ? `${street1},` : '')
      .replace(/street2/gi, street2 ? `${street2},` : '')
      .replace(/village/gi, village ? `${village}.` : '')
      .replace(/city/gi, city ? `${city},` : '')
      .replace(/municipality/gi, municipality ? `${municipality},` : '')
      .replace(/province/gi, province ? `${province},` : '')
      .replace(/state/gi, state ? `${state},` : '')
      .replace(/region/gi, region ? `${region},` : '')
      .replace(/country/gi, country || '')
      .trim();
  };

  const formatName = (name, format = DEFAULT_NAME_FORMAT) => {
    const { firstName, middleName, lastName, generationalSuffix } = name;
    return format.replace(/firstName/gi, firstName || '')
      .replace(/middleName/gi, middleName || '')
      .replace(/middleInitial/gi, middleName ? `${middleName.substr(0, 1).toUpperCase()}.` : '')
      .replace(/lastName/gi, lastName || '')
      .replace(/generationalSuffix/gi, generationalSuffix || '')
      .trim();
  };

  const formatDate = (d, format) => {
    return date.formatDate(d, format);
  };

  const formatCurrency = (num = 0, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(num);
  };

  const cleanObject = (obj) => {
    const newObj = {};
    for (const key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        const element = obj[key];
        if (!element) continue;
        newObj[key] = element;
      }
    }
    return newObj;
  };

  const handleToken = async (token, redirect) => {
    console.warn('token, redirect', token, redirect);
    const router = useRouter();
    const route = useRoute();
    await sdk.service('auth').signout();
    await sdk.service('auth').signin('jwt', { accessToken: token }, true);
    const query = route.query;
    delete query.token;
    router.push({ name: redirect || 'onboarding', query });
  };

  const tableColumnBuilder = (array = []) => {
    return array.map(item => {
      return {
        style: 'max-width: 180px; white-space: normal;',
        align: 'left',
        ...item,
      };
    });
  };

  const paginationQueryBuilder = (query, page = 1, limit = 5) => {
    return {
      $skip: (page - 1) * limit,
      $limit: limit,
      ...query,
    };
  };

  return {
    cleanObject,
    formatAddress,
    formatCurrency,
    formatDate,
    formatName,
    handleToken,
    paginationQueryBuilder,
    tableColumnBuilder,
  };
};
