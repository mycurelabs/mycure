import { date } from 'quasar';
import { sdk } from '@/boot/mycure';
import { useRoute, useRouter } from 'vue-router';
import { format } from 'date-fns';

const DEFAULT_ADDRESS_FORMAT = 'street1 street2 village city municipality province state region country';
const DEFAULT_NAME_FORMAT = 'firstName middleName lastName generationalSuffix';

export const capitalized = (str) => {
  if (!str) return '';
  return `${str.charAt(0).toUpperCase()}${str.substring(1, str.length)}`;
};

export const formatAddress = (address, format = DEFAULT_ADDRESS_FORMAT) => {
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

export const formatName = (name = {}, format = DEFAULT_NAME_FORMAT) => {
  const { firstName, middleName, lastName, generationalSuffix } = name;
  return format.replace(/firstName/gi, firstName || '')
    .replace(/middleName/gi, middleName || '')
    .replace(/middleInitial/gi, middleName ? `${middleName.substr(0, 1).toUpperCase()}.` : '')
    .replace(/lastName/gi, lastName || '')
    .replace(/generationalSuffix/gi, generationalSuffix || '')
    .trim();
};

export const formatDate = (d, format) => {
  return date.formatDate(d, format);
};

export const formatCurrency = (num = 0, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(num);
};

export const cleanObject = (obj) => {
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

export const handleToken = async (token, redirect) => {
  const router = useRouter();
  const route = useRoute();
  await sdk.service('auth').signout();
  await sdk.service('auth').signin('jwt', { accessToken: token }, true);
  const query = route.query;
  delete query.token;
  router.push({ name: redirect || 'onboarding', query });
};

export const tableColumnBuilder = (array = []) => {
  return array.map(item => {
    return {
      style: 'min-width: 160px; max-width: 200px; white-space: normal;',
      align: 'left',
      ...item,
    };
  });
};

export const paginationQueryBuilder = (query, page = 1, limit = 5) => {
  return {
    $skip: (page - 1) * limit,
    $limit: limit,
    ...query,
  };
};

export const fakeAwait = (wait = 1000) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, wait);
  });
};

export const superTrim = (str) => {
  if (!str) return '';
  return str.split(' ').filter(Boolean).join(' ');
};

export const generateId = () => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const datePrefix = format(Date.now(), 'yy-MMddhhss');
  let randomSuffix = '';
  for (let i = 0; i < 5; i++) {
    randomSuffix += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return `${datePrefix}-${randomSuffix}`;
};
