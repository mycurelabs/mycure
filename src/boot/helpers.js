import TimeAgo from 'javascript-time-ago';
import timeagoEn from 'javascript-time-ago/locale/en';
import * as datefns from 'date-fns';
import { useQuasar } from 'quasar';
import { ref, computed, readonly, watch, reactive } from 'vue';

// declare timeago locales
TimeAgo.addDefaultLocale(timeagoEn);

/**
 * capitalize string
 *
 * @param {string} str
 * @returns {string}
 */
export function capitalizeText (str) {
  if (!str || typeof str !== 'string') return str;
  return str[0].toUpperCase() + str.slice(1);
}

/**
 * debounce a function
 *
 * @param {function} fn
 * @param {number} [timeout=200]
 * @param {Object} opts
 * @param {boolean} opts.immediate
 * @returns {function} debounced function
 */
export function debounce (fn, timeout, opts) {
  let timeoutid = null;
  return function (...args) {
    if (timeoutid) clearTimeout(timeout);
    timeoutid = setTimeout(() => {
      timeoutid = null;
      if (!opts?.immediate) fn.apply(this, args);
    }, timeout);
    if (opts?.immediate || !timeout) fn.apply(this, args);
  };
}

/**
 * check if an entity is a POJO
 *
 * @param {any} obj
 * @returns {boolean}
 */
export function isPlainObject (obj) {
  if (obj === null || typeof obj !== 'object') return false;
  return Object.getPrototypeOf(obj) === Object.prototype;
}

/**
 * transform values in an object
 *
 * @param {Object.<string,any>} obj
 * @param {(value: any, key: string) => any} mapperFn
 * @returns {Object.<string,any>}
 */
export function mapValues (obj, mapperFn) {
  if (!obj) return obj;
  return Object.keys(obj).reduce((acc, key) => ({ ...acc, [key]: mapperFn(obj[key], key) }), {});
}

/**
 * pick key/value pairs in an object
 *
 * @param {Object.<string,any>} obj
 * @param {(value: any, key: string) => any} mapperFn
 * @returns {Object.<string,any>}
 */
export function pickBy (obj, pickerFn) {
  if (!obj) return obj;
  return Object.keys(obj).reduce((acc, key) => ({ ...acc, ...pickerFn(obj[key], key) && { [key]: obj[key] } }), {});
}

/**
 * Returns a function that tries to call a given callback, but backs off
 * every time it is called. After a reset interval elapses where the function is
 * not called at all, the backoff is reset.
 *
 * The chosen backoff is exponential, with random jitter of up to 50%.
 *
 * @param {Function} fn Callback to try
 * @param {Object} [state]
 * @param {number} [state.tryIndex=0] 0-based counter for number of tries
 * @param {Object} [state.callbackTimeoutId] Return value of setTimeout
 * @param {Object} [state.resetTimeoutId] Return value of setTimeout
 * @param {Object} [opts]
 * @param {Object} [opts.backoffParams]
 * @param {number} [opts.backoffParams.coefficient=1000]
 * @param {number} [opts.backoffParams.base=2]
 * @param {number} [opts.maxBackoffDelay=60000]
 * @param {number} [opts.resetInterval=10000]
 * @return {Function} A function that calls the fn callback with backoff.
 */
export function backoff (fn, state, opts) {
  // enforce default state
  state = { tryIndex: 0, ...state };

  // define helper functions
  const clearState = () => {
    state.tryIndex = 0;
    if (state.resetTimeoutId) clearTimeout(state.resetTimeoutId);
  };
  const setResetTimer = interval => {
    // start a "reset" timer:
    // if resetInterval milliseconds elapse without the timer being cleared,
    // assume a success and reset state counters
    state.resetTimeoutId = setTimeout(clearState, interval);
  };

  // return backed off function, to call several times
  // which will in turn call fn, but only after an exponentially growing delay
  return (...args) => {
    // the function has been called; assume a failure
    // remove all timers
    if (state.callbackTimeoutId) clearTimeout(state.callbackTimeoutId);
    if (state.resetTimeoutId) clearTimeout(state.resetTimeoutId);

    const { backoffParams, maxBackoffDelay = 60000, resetInterval = 10000 } = opts || {};
    const tryFn = () => {
      fn(...args);
      setResetTimer(resetInterval);
    };

    // calculate delay before trying the function
    let delay = 0;
    if (state.tryIndex) {
      // case: this is a retry
      // delay should grow exponentially with tryIndex
      const { coefficient = 1000, base = 2 } = backoffParams || {};
      const expDelay = coefficient * (base ** (state.tryIndex - 1));
      const limitedDelay = Math.min(expDelay, maxBackoffDelay);
      // add random jitter, plus or minus 50%
      const sign = Math.random() < 0.5 ? -1 : 1;
      const jitterFactor = 1 + (sign * 0.5 * Math.random());
      delay = limitedDelay * jitterFactor;
    }

    // try calling the function after the delay
    state.tryIndex += 1;
    state.callbackTimeoutId = setTimeout(tryFn, delay);
  };
}

/**
 * recursively freeze object/array
 *
 * @param {object|Array} obj object or array to freeze
 * @return {object|Array}
 */
export function deepFreeze (obj) {
  if (Object.isFrozen(obj)) return obj;
  if (Array.isArray(obj)) return Object.freeze(obj.map(deepFreeze));
  if (isPlainObject(obj)) return Object.freeze(mapValues(obj, deepFreeze));
  return obj;
}

// ----------- QUASAR -----------

export function toQuasarPagination (pagination) {
  return computed({
    get: () => ({
      page: pagination.value.page,
      rowsPerPage: pagination.value.pageSize,
      rowsNumber: pagination.value.itemsTotal,
    }),
    set: v => {
      pagination.value = {
        page: v.page,
        pageSize: v.rowsPerPage,
        itemsTotal: v.rowsNumber,
      };
    },
  });
}

export function toQuasarSelectFilterFn (dataset) {
  return (searchstring, updatefn) => updatefn(() => {
    dataset.searchstring.value = searchstring;
  });
}

// ----------- PERSON -----------

export function formatPersonName (name, opts) {
  return [
    !opts?.lastNameFirst && name?.firstName,
    name?.lastName,
    opts?.lastNameFirst && name?.firstName,
  ].filter(Boolean).join(opts?.lastNameFirst ? ', ' : ' ');
}

export function calculateAge (dateOfBirth, opts) {
  if (!dateOfBirth) return dateOfBirth;
  dateOfBirth = new Date(dateOfBirth);
  const { years, months, days } = datefns.intervalToDuration({ start: dateOfBirth, end: new Date() });
  if (years) return String(years) + 'yrs';
  if (!months) return String(days) + 'days';
  return String(months) + 'mos';
}

// ----------- NUMBERS -----------

/**
 * format a number with commas
 *
 * @param {number|string} num
 * @returns {string} comma-separated representation
 */
export function formatNumberWithCommas (num) {
  return Number(num).toLocaleString().split(',').join(', ');
}

// ----------- DATES -----------

/**
 * @param {number|Date} date
 * @param {string} [fmt='MMMM dd, yyyy']
 * @returns {string}
 */
export function formatDate (date, fmt = 'MMMM dd, yyyy') {
  if (!date) return '';
  return datefns.format(new Date(date), fmt);
}

/**
 * @param {number|Date} date
 * @returns {string}
 */
export function formatTimeAgo (date) {
  if (!date) return '';
  const fmt = formatTimeAgo.fmt = formatTimeAgo.fmt || new TimeAgo('en-US');
  return fmt.format(date, 'mini-now');
}

/**
 * @param {string|object} dateRange
 * @param {string} [fmt='MMMM dd, yyyy']
 * @returns {string}
 */
export function formatDateRange (dateRange, fmt = 'MMMM dd, yyyy') {
  if (!dateRange) return '';
  const from = typeof dateRange === 'string' ? dateRange : dateRange.from;
  const to = typeof dateRange === 'string' ? dateRange : dateRange.to;
  if (!to) return formatDate(from, fmt);
  if (!from) return formatDate(to, fmt);
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (datefns.isSameDay(fromDate, toDate)) {
    return formatDate(fromDate, fmt);
  }
  return [
    formatDate(fromDate, fmt),
    formatDate(toDate, fmt),
  ].join(' - ');
}

// ----------- DATASET -----------

const COERCION_MAP = {
  string: String,
  number: Number,
  boolean: Boolean,
};

/**
 * @typedef {object} Query
 * @property {string} searchstring
 * @property {Array<object>} filters
 * @property {string} filters.name
 * @property {any} filters.value
 */

/**
 * @typedef {object} Pagination
 * @property {number} itemsTotal
 * @property {number} pageSize
 * @property {number} page
 */

/**
 * TODO:
 * - support keyword: `is` (object results should be of a specific type)
 * - support keyword: `in` (searchstring value should be searched in a specific field)
 *
 * @param {string} str searchstring that may contain advanced search syntax
 * @param {object} opts
 * @param {Array<object>} opts.filters
 * @param {string} opts.filters.name
 * @param {string} opts.filters.type value type to coerce the filter to
 * @param {boolean} opts.filters.multi flag if the filter accepts multiple values
 * @returns {Query}
 */
export function parseSearchstring (str, opts) {
  if (str && typeof str !== 'string') {
    throw new Error('Searchstring must be a string');
  }
  const result = {
    searchstring: '',
    filters: [],
  };
  const filtersMap = {};
  if (str) {
    const parsed = str.split(' ');
    parsed.forEach(comp => {
      // normal searchstring
      if (!comp.includes(':')) {
        result.searchstring += comp + ' ';
        return;
      }
      // filter
      const [type, value] = comp.split(':');
      const conf = opts?.filters?.find(f => f.name === type);
      const valueFormatter = COERCION_MAP[conf?.type] || (v => v);
      const filter = filtersMap[type] || { name: type, value: conf?.multi ? [] : null };
      if (conf?.multi) filter.value.push(valueFormatter(value));
      else filter.value = valueFormatter(value);
      filtersMap[type] = filter;
    });
  }
  result.searchstring = result.searchstring.trim();
  result.filters = Object.keys(filtersMap).reduce((filters, k) => filters.concat(filtersMap[k]), []);
  return result;
}

/**
 * @typedef {object} FetchResult
 * @property {number} itemsTotal
 * @property {Array<any>} items
 *
 * @typedef {object} FetchParams
 * @param {Query} query
 * @param {Pagination} pagination
 *
 * @callback FetcherFn
 * @param {FetchParams} params
 * @returns {Promise<FetchResult>}
 *
 * @param {FetcherFn} fetcher function to run to fetch items
 * @param {object} opts
 * @param {number} [opts.pageSize=20]
 * @param {number} [opts.fetchImmediate=false]
 * @param {boolean} [opts.append]
 */
export function createPaginatedDataset (fetcher, opts) {
  opts = Object.assign({
    isSameItem: (a, b) => a.id === b.id,
  }, opts);

  // fetcher check
  if (typeof fetcher !== 'function') {
    throw new Error('Fetcher fn required');
  }

  // search
  const searchstring = reactive(opts?.searchstring || ref(''));
  const query = computed({
    get: () => parseSearchstring(searchstring.value, opts),
    set: (val) => {
      searchstring.value = val?.searchstring;
    },
  });

  // pagination
  const hasNext = ref(false);
  const itemsTotal = ref(0);
  const pageSizeInternal = ref(opts?.pageSize || 10);
  const pageSize = computed({
    get: () => pageSizeInternal.value,
    set: (val) => {
      if (typeof val !== 'number') return;
      if (val < 1) return;
      pageSizeInternal.value = val;
    },
  });
  const pageInternal = ref(1);
  const page = computed({
    get: () => pageInternal.value,
    set: (val) => {
      if (typeof val !== 'number') return;
      if (val < 1) return;
      pageInternal.value = val;
    },
  });
  const pagination = computed({
    get: () => ({
      itemsTotal: itemsTotal.value,
      pageSize: pageSize.value,
      page: page.value,
      hasPrev: page.value > 1,
      hasNext: hasNext.value,
    }),
    set: val => {
      pageSize.value = val?.pageSize;
      page.value = val?.page;
    },
  });

  // sorting
  const sortingopts = deepFreeze(opts?.sortingopts?.slice() || []);
  const sorting = reactive(opts?.sorting || ref(sortingopts[0] || null));

  // filtering
  const filteropts = deepFreeze(opts?.filteropts?.slice() || []);
  const filter = reactive(opts?.filter || ref(null));

  // items fetcher
  const loading = ref(false);
  const items = ref([]);
  const addItem = async (item, addopts) => {
    if (!item) return;
    const existing = items.value.findIndex(i => opts.isSameItem(i, item));
    if (~existing) items.value[existing] = item;
    else if (!addopts?.unshift) items.value.push(item);
    else items.value.unshift(item);
    itemsTotal.value = Math.max(itemsTotal.value, items.value.length);
  };
  const deleteItem = async (item) => {
    if (!item) return;
    const prevLength = items.value.length;
    items.value = items.value.filter(i => !opts.isSameItem(i, item));
    const deltaLength = items.value.length - prevLength;
    itemsTotal.value = Math.max(itemsTotal.value - deltaLength, items.value.length - deltaLength, 0);
  };
  const fetchItemsPromises = [];
  const fetchItems = async (fopts) => {
    try {
      loading.value = true;
      // fetch items
      const result = await fetcher({
        query: query.value,
        pagination: pagination.value,
        sorting: sorting.value,
        filter: filter.value,
      });

      const res = {
        items: Array.isArray(result) ? result : result?.data,
        itemsTotal: Array.isArray(result) ? 0 : result?.total ?? result?.itemsTotal,
        hasNext: Array.isArray(result) ? false : result?.hasNext,
      };

      // invalid result
      if (!Array.isArray(res.items)) {
        console.warn('Invalid result returned by fetched function', result);
        return;
      }

      // set more
      hasNext.value = !!res.hasNext;

      // append
      if (opts?.append && !fopts?.override) {
        res.items.forEach(addItem);
        return;
      }

      // object result
      items.value = res.items;
      if (typeof res.itemsTotal === 'number') itemsTotal.value = res.itemsTotal;
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
      while (fetchItemsPromises.length) {
        const promise = fetchItemsPromises.shift();
        if (!promise) break;
        promise(hasNext.value);
      }
    }
  };
  const fetchNextItems = () => new Promise(resolve => {
    fetchItemsPromises.push(resolve);
    pagination.value = { ...pagination.value, page: pagination.value.page + 1 };
  });
  const fetchPrevItems = () => new Promise(resolve => {
    fetchItemsPromises.push(resolve);
    pagination.value = { ...pagination.value, page: Math.max(0, pagination.value.page - 1) };
  });

  // autofetching
  watch([searchstring, sorting, filter], fetchItems, { immediate: !!opts?.fetchImmediate });
  watch([page, pageSize], () => fetchItems({ force: true }));

  // exports
  return {
    query,
    searchstring,

    pagination,
    page,
    pageSize,
    hasNext,

    sortingopts,
    sorting,

    filteropts,
    filter,

    fetchItems,
    fetchNextItems,
    fetchPrevItems,
    addItem,
    deleteItem,
    items: readonly(items),
    itemsTotal: readonly(itemsTotal),
    loading: readonly(loading),
  };
}

// ----------- ACTIONS -----------

export function handleAction (fn, opts) {
  opts = Object.assign({
    confirm: true,
    loader: true,
    errorPrefix: 'Failed to perform action',
  }, opts);

  const $q = useQuasar();

  // expand confirmation conf
  if (opts.confirm) {
    opts.confirm = Object.assign({
      title: opts.confirmTitle || 'Confirm',
      message: opts.confirmMessage || 'Are you sure about the action?',
    }, opts.confirm === true ? {} : opts.confirm);
  }

  // expand loader
  if (opts.loader) {
    opts.loader = Object.assign({
      message: opts.loaderMessage || 'Processing request...',
      boxClass: opts.loaderBoxClass || 'bg-grey-2 text-grey-9',
      spinnerColor: opts.loaderSpinnerColor || 'primary',
    }, opts.loader === true ? {} : opts.loader);
  }

  // default error handler
  if (typeof opts.errorHandler !== 'function') {
    opts.errorHandler = error => {
      $q.notify({
        type: 'negative',
        message: `${opts.errorPrefix}. ` + error.message,
      });
    };
  }

  return async (...args) => {
    // handle confirmation
    if (opts.confirm) {
      const message = typeof opts.confirm.message === 'function'
        ? opts.confirm.message(...args)
        : opts.confirm.message;
      const confirmed = await new Promise(resolve => $q.dialog({
        title: opts.confirm.title,
        message,
        cancel: true,
        persistent: true,
      }).onOk(() => resolve(true)).onCancel(() => resolve(false)));
      if (!confirmed) return;
    }

    // handle loading
    if (opts.loader) {
      const message = typeof opts.loader.message === 'function'
        ? opts.loader.message(...args)
        : opts.loader.message;
      $q.loading.show({
        message,
        boxClass: opts.loader.boxClass,
        spinnerColor: opts.loader.spinnerColor,
      });
    }

    try {
      // execute action
      await fn(...args);
    } catch (error) {
      // TODO: hide this in a flag
      console.error(error);

      // handle error
      opts.errorHandler(error);
    } finally {
      // handle closing loader
      if (opts?.loader) {
        $q.loading.hide();
      }
    }
  };
}
