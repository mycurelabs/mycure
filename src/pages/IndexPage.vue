<template>
  <q-page class="flex flex-center">
    <img
      alt="Quasar logo"
      src="~assets/quasar-logo-vertical.svg"
      style="width: 200px; height: 200px"
    >
  </q-page>
</template>

<script>
import { useSdk } from 'src/boot/mycure';

export default {
  setup () {
    const sdk = useSdk();
    console.warn(sdk);
  },
};
</script>
