import qs from 'qs';
import { Cookies } from 'quasar';
import { ref, getCurrentInstance } from 'vue';
import { isPlainObject, mapValues } from './helpers.js';

function parseJWTPayload (token) {
  try {
    let payloadPart = token.split('.')[1];
    // Replace non-url compatible chars with base64 standard chars
    payloadPart = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    // Pad out with standard base64 required padding characters
    const pad = payloadPart.length % 4;
    if (pad) {
      if (pad === 1) throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
      payloadPart += new Array(5 - pad).join('=');
    }
    return JSON.parse(window.atob(payloadPart));
  } catch (error) {
    error.message = 'Failed to parse JWT. ' + error.message;
    throw error;
  }
}

function encodeValues (obj) {
  // array
  if (Array.isArray(obj)) {
    // empty array
    if (!obj.length) return '#[]';
    // iterate list
    return obj.map(encodeValues);
  }

  // boolean
  if (typeof obj === 'boolean') {
    return `#${obj}`;
  }

  // encode numbers
  if (typeof obj === 'number') {
    return `#${obj}`;
  }

  // deep encoding
  if (isPlainObject(obj)) {
    return mapValues(obj, encodeValues);
  }

  // no encoding
  return obj;
}

export const STORAGE_KEY_UID = 'usr:uid';
export const STORAGE_KEY_TOKEN = 'usr:acc';
export const STORAGE_KEY_REFRESH = 'usr:ref';
export const STORAGE_KEY_API = 'usr:api';
export const COOKIE_KEY_API_BASE_URL = 'hh_api_base_url'; // all cookie keys are lowercase

export class Sdk {
  /**
   * @param {string} apiBaseUrl
   * @param {object} opts
   */
  constructor (apiBaseUrl, opts) {
    this.apiBaseUrl = apiBaseUrl;
    this.log = opts?.log || console.log.bind(console);
    this.currentUser$ = ref(null);
  }

  async setBaseUrl (apiBaseUrl, opts) {
    apiBaseUrl = apiBaseUrl || useSdkConstants().apiBaseUrl;
    if (!apiBaseUrl) throw new Error('Api Base Url required');
    if (this.apiBaseUrl === apiBaseUrl) return;
    globalThis.localStorage.setItem(STORAGE_KEY_API, apiBaseUrl);
    this.apiBaseUrl = apiBaseUrl;
    this.log('base url reset to', this.apiBaseUrl);
  }

  async currentUser () {
    // return cached currentUser
    if (this.currentUser$.value) return this.currentUser$.value;

    // check if there is a cached access token
    const accessToken = await this.token().catch(error => {
      // handle network errors
      switch (error.message) {
        case 'Failed to fetch':
        case 'NetworkError when attempting to fetch resource.':
        case 'Network request failed': {
          throw error;
        }
      }

      // signout expired jwt error
      this.log('invalid token, signing out.', error);
      return this.signout();
    });
    if (!accessToken) {
      this.log('no cached access token');
      return null;
    }

    // signin with the token
    return this.signinWithToken(accessToken);
  }

  async token () {
    const accessToken = globalThis.localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!accessToken) return;
    const refreshToken = globalThis.localStorage.getItem(STORAGE_KEY_REFRESH);
    const expiresIn = parseJWTPayload(accessToken).exp;

    // no refresh/expiration, let the server check
    if (!refreshToken || !expiresIn) return accessToken;

    // not yet expired
    if ((Date.now() / 1000) < expiresIn) return accessToken;

    // refresh the token
    this.log('token expired. refreshing');
    const body = { action: 'refreshAccessToken', refreshToken };
    const creds = await this.create('authentication', body, { skipAuth: true });
    if (!creds?.accessToken) throw new Error('Invalid refresh response. missing accessToken');
    if (!creds?.refreshToken) throw new Error('Invalid refresh response. missing refreshToken');
    globalThis.localStorage.setItem(STORAGE_KEY_TOKEN, creds.accessToken);
    globalThis.localStorage.setItem(STORAGE_KEY_REFRESH, creds.refreshToken);

    this.log('token refreshed');
    return creds.accessToken;
  }

  async signinWithEmail (email, password) {
    if (!email) throw new Error('email is required');
    if (!password) throw new Error('password is required');
    this.log(`signing-in with email ${email}`);

    const body = { strategy: 'local', email, password };
    const creds = await this.create('authentication', body, { skipAuth: true });

    return this.loadUser(creds);
  }

  async signinWithToken (token) {
    if (!token) throw new Error('token is required');
    this.log('signing-in with token');

    const body = { strategy: 'jwt', accessToken: token };
    const creds = await this.create('authentication', body, { skipAuth: true });

    return this.loadUser(creds);
  }

  async loadUser (creds) {
    if (!creds?.uid) throw new Error('Invalid authenticated response. missing uid');
    if (!creds?.accessToken) throw new Error('Invalid authentication response. missing accessToken');
    if (!creds?.user?.uid) throw new Error('Invalid authenticated response. missing populated user');

    // save tokens
    this.log('saving tokens');
    globalThis.localStorage.setItem(STORAGE_KEY_UID, creds.uid);
    globalThis.localStorage.setItem(STORAGE_KEY_TOKEN, creds.accessToken);
    globalThis.localStorage.setItem(STORAGE_KEY_REFRESH, creds.refreshToken);

    // fetch account details
    this.log('fetching user details');
    const user = creds.user;
    this.currentUser$.value = user;

    return user;
  }

  async signout () {
    globalThis.localStorage.removeItem(STORAGE_KEY_UID);
    globalThis.localStorage.removeItem(STORAGE_KEY_TOKEN);
    globalThis.localStorage.removeItem(STORAGE_KEY_REFRESH);
    globalThis.localStorage.removeItem(STORAGE_KEY_API);
    this.currentUser$.value = null;
    this.log('signed out');

    await this.setBaseUrl(null, { skipSignout: true });
  }

  /**
   * @param {string} input
   * @param {object} opts
   * @param {string} opts.method
   * @param {string} opts.prefixUrl
   * @param {string} opts.responseType json (default) | text
   * @param {object} opts.headers
   * @param {object} opts.data JSON body
   * @param {object} opts.searchParams query params in object notation
   * @param {boolean} opts.throwHttpErrors defaults to true. throws on 200 > x > 299
   * @param {boolean} opts.returnBodyOnly returns only the parsed body
   * @returns {object}
   */
  async request (input, opts) {
    // handle opts
    opts = Object.assign({
      method: 'GET',
      prefixUrl: this.apiBaseUrl,
      responseType: 'json',
      throwHttpErrors: true,
      returnBodyOnly: false,
    }, opts);

    // build request options
    const req = {
      url: [opts.prefixUrl, input].filter(Boolean).join('/'),
      method: opts.method.toUpperCase(),
      headers: opts.headers || {},
    };

    // attach body
    if (opts.data) {
      req.body = JSON.stringify(opts.data);
      req.headers['Content-Type'] = 'application/json';
    }

    // build query string
    if (opts.searchParams) {
      req.searchParams = opts.searchParams;
      req.searchParamsStringified = qs.stringify(encodeValues(opts.searchParams), { strictNullHandling: true });
      req.url += `?${req.searchParamsStringified}`;
    }

    // auto authentication token attachment
    if (!opts.skipAuth) {
      const token = await this.token();
      if (token) {
        req.headers.Authorization = `Bearer ${token}`;
      }
    }

    this.log('request.req', req);
    const res = await globalThis.fetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });
    const resobj = {
      statusCode: res.status,
      statusText: res.statusText,
      responseType: opts.responseType,
    };
    Object.defineProperty(resobj, 'req', {
      enumerable: false,
      writable: false,
      value: req,
    });
    Object.defineProperty(resobj, 'res', {
      enumerable: false,
      writable: false,
      value: res,
    });

    // parse body
    switch (opts.responseType) {
      case 'json': {
        resobj.data = res.status === 204 ? null : await res.json();
        break;
      }
      default: {
        resobj.data = await res.text();
      }
    }

    // handle http error
    if (!res.ok && opts.throwHttpErrors) {
      const error = new Error(resobj.data?.message || `Request failed with status ${resobj.statusText || resobj.statusCode}`);
      error.res = resobj;
      error.name = 'HttpError';
      error.type = resobj.data?.type;
      error.code = resobj.data?.code;
      error.errors = resobj.data?.errors;
      throw error;
    }

    this.log('request.res', resobj);
    return opts.returnBodyOnly ? resobj.data : resobj;
  }

  async list (input, query, opts) {
    opts = Object.assign({
      method: 'GET',
      returnBodyOnly: true,
    }, opts);

    // NOTE: handle backwards compat
    if (query?.$page && query?.$limit) {
      query.$skip = query.$limit * (query.$page - 1);
      delete query.$page;
    }

    if (query) opts.searchParams = query;
    const res = await this.request(input, opts);

    // NOTE: handle backwards compat
    const result = {};
    result.data = Array.isArray(res) ? res : res.data;
    result.total = Array.isArray(res) ? undefined : res.total;
    result.limit = Array.isArray(res) ? undefined : res.limit;
    result.skip = Array.isArray(res) ? undefined : res.skip;
    return result;
  }

  async get (input, query, opts) {
    opts = Object.assign({
      method: 'GET',
      returnBodyOnly: true,
    }, opts);
    if (typeof query === 'string') {
      input = [input, query].join('/');
    } else if (query) {
      opts.searchParams = query;
    }
    const res = await this.request(input, opts);
    return Array.isArray(res?.data) ? res.data[0] : res;
  }

  async create (input, data, opts) {
    opts = Object.assign({
      method: 'POST',
      returnBodyOnly: true,
    }, opts);
    if (data) {
      opts.data = data;
    }
    return this.request(input, opts);
  }

  async update (input, query, data, opts) {
    opts = Object.assign({
      method: 'PATCH',
      returnBodyOnly: true,
    }, opts);
    if (typeof query === 'string') {
      input = [input, query].join('/');
    } else if (query) {
      opts.searchParams = query;
    }
    if (data) {
      opts.data = data;
    }
    return this.request(input, opts);
  }

  async delete (input, query, opts) {
    opts = Object.assign({
      method: 'DELETE',
      returnBodyOnly: true,
    }, opts);
    if (typeof query === 'string') {
      input = [input, query].join('/');
    } else if (query) {
      opts.searchParams = query;
    }
    return this.request(input, opts);
  }
}

export function useSdk () {
  const instance = getCurrentInstance();
  return instance.appContext.config.globalProperties.$sdk;
}

export function useSdkConstants () {
  // all available static urls
  const apiBaseUrls = [
    ...Cookies.get(COOKIE_KEY_API_BASE_URL)?.split(',') || [],
    ...process.env.API_BASE_URL.split(','),
  ].filter(Boolean);

  // retrieve cached url
  const cachedApiUrl = globalThis.localStorage.getItem(STORAGE_KEY_API);

  // default url (cached has hiher priority)
  const apiBaseUrl = cachedApiUrl || apiBaseUrls[0];
  console.info('cookies', Cookies.getAll());
  console.info(`cookies.${COOKIE_KEY_API_BASE_URL}`, Cookies.get(COOKIE_KEY_API_BASE_URL));
  console.info('apiBaseUrl cached', cachedApiUrl);
  console.info('apiBaseUrl candidates', apiBaseUrls);
  console.info('apiBaseUrl', apiBaseUrl);

  return {
    apiBaseUrls,
    apiBaseUrl,
  };
}

// boot initialization
export default function boot ({ app, router }) {
  const { apiBaseUrl } = useSdkConstants();

  const log = (...args) => {
    if (!globalThis.localStorage.getItem('debug')) return;
    return console.log(...args);
  };
  app.config.globalProperties.$sdk = new Sdk(apiBaseUrl, { log });
}
