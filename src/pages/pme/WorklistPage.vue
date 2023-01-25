<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="initializing"
)
  q-card.shadow-1
    q-card-section
      pre {{items.map(item => item.alpha2)}}
</template>

<script>
import { computed, ref } from 'vue';
import GenericPage from '@/components/commons/GenericPage';
import { usePmeStore } from 'src/stores/pme';
export default {
  components: {
    GenericPage,
  },
  setup () {
    const store = usePmeStore();
    const initializing = ref(false);
    const items = computed(() => store.$state.pmeEncounters);

    async function init (firstLoad) {
      try {
        if (firstLoad) initializing.value = true;
        await store.getPmeEncounters();
      } catch (e) {
        console.error(e);
      } finally {
        initializing.value = false;
      }
    }

    if (!items.value.length) init(true);
    else init();
    return {
      items,
      initializing,
    };
  },
};
</script>
