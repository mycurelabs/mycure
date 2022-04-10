<template lang="pug">
q-page(:padding="padding")
  slot(name="default")
  q-page-sticky(position="bottom-right" :offset="[18, 18]")
    slot(name="fab")
  q-dialog(
    v-model="loading"
    full-screen
    persistent
  )
    q-spinner(
      size="50px"
      color="white"
    )
</template>

<script>
import { ref } from 'vue';
export default {
  setup () {
    const padding = ref(false);
    const loading = ref(false);

    return {
      padding,
      loading,
    };
  },
};
</script>
