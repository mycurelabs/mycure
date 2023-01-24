<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="loading"
)
  span.text-h1 PME Group Package
</template>

<script>
import { ref } from 'vue';
import GenericPage from '@/components/commons/GenericPage';
export default {
  components: {
    GenericPage,
  },
  setup () {
    const loading = ref(true);

    setTimeout(() => {
      loading.value = false;
    }, 1000);

    return {
      loading,
    };
  },
};
</script>
