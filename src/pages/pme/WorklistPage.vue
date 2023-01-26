<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="initializing"
)
  q-card.shadow-1
    q-card-section
      pre {{items}}
</template>

<script>
import { computed, ref } from 'vue';
import GenericPage from '@/components/commons/GenericPage';
import { usePmeStore } from '@/stores/pme';
import { useUserStore } from '@/stores/current-user';

export default {
  components: {
    GenericPage,
  },
  setup () {
    const pmeStore = usePmeStore();
    const initializing = ref(false);
    const userStore = useUserStore();
    const items = computed(() => pmeStore.$state.pmeEncounters);
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);

    async function init (firstLoad) {
      try {
        if (firstLoad) initializing.value = true;
        await pmeStore.getPmeEncounters(activeOrganization.value.id);
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
