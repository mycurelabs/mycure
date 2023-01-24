<template lang="pug">
q-page(:padding="padding")
  slot(name="default")
  q-page-sticky(position="bottom-right", :offset="[18, 18]")
    slot(name="fab")
  q-dialog(v-model="loadingModel", full-screen, persistent)
    q-spinner(size="50px", color="white")
</template>

<script>
import { computed } from 'vue-demi';
export default {
  props: {
    loading: Boolean,
    padding: Boolean,
  },
  setup (props, { emit }) {
    const loadingModel = computed({
      get: () => props.loading,
      set: (val) => emit('update:loading', val),
    });

    return {
      loadingModel,
    };
  },
};
</script>
