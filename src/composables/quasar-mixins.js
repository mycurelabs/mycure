import { computed } from 'vue';
import { dom, useQuasar } from 'quasar';
const { height, width } = dom;

export function useQuasarMixins () {
  const $q = useQuasar();
  const appVersion = require('../../package.json').version;
  const backButtonIcon = computed(() => isIOS ? 'mdi-chevron-left' : 'mdi-arrow-left');
  const brand = process.env.APP;
  const isAndroid = $q.platform.is.android;
  const isDesktop = $q.platform.is.desktop;
  const isIOS = $q.platform.is.ios;
  const isMobile = $q.platform.is.mobile || $q.platform.is.nativeMobile;
  const isNativeMobile = $q.platform.is.nativeMobile;
  const isScreenDesktop = computed(() => $q.screen.gt.sm);
  const isScreenMobile = computed(() => $q.screen.lt.md);
  const domHeight = computed(() => height(window));
  const domWidth = computed(() => width(window));

  async function logout () {
    // await this.$store.dispatch('auth/signout');
    // this.$store.dispatch('personalDetails/clearPersonalDetails');
    // this.$router.push({ name: 'landing' });
    // this.$localStorage.clear();
  }

  function rippleAwait (timeout = 200) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, timeout);
    });
  }

  async function showSnack (opts) {
    $q.notify(opts);
  }

  function getPlatform () {
    if (isNativeMobile && isAndroid) return 'android';
    if (isNativeMobile && isIOS) return 'ios';
    return 'web';
  }

  function setToDark () {
    $q.dark.set(true);
  }

  return {
    appVersion,
    backButtonIcon,
    brand,
    domHeight,
    domWidth,
    isAndroid,
    isDesktop,
    isIOS,
    isMobile,
    isNativeMobile,
    isScreenDesktop,
    isScreenMobile,
    getPlatform,
    logout,
    rippleAwait,
    showSnack,
    setToDark,
  };
}
