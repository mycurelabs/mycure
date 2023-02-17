<template lang="pug">
q-layout(view="hHh LpR lFr" style="background: #fafafa")
  q-page-container
    div.bg-white.q-pa-sm
      q-breadcrumbs(gutter="sm")
        template(v-slot:separator)
          q-icon(name="la la-angle-right" size="14px")
        template(v-for="item in $footprints")
          q-breadcrumbs-el(:label="item.footprint.name" :icon="item.footprint.icon")
    router-view
</template>

<script>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import GenericPage from '@/components/commons/GenericPage';
import PatientCard from '@/components/commons/PatientCard';

export default {
  components: {
    GenericPage,
    PatientCard,
  },
  setup () {
    const route = useRoute();
    const rightDrawerOpen = ref(false);
    const patient = ref({});
    const reportTemplateId = route.params.reportTemplate;
    const isUpdating = computed(() => {
      return !!reportTemplateId;
    });

    async function init () {
      try {
        console.warn(reportTemplateId);
      } catch (e) {
        console.error(e);
      }
    }

    function toggleRightDrawer () {
      rightDrawerOpen.value = !rightDrawerOpen.value;
    }

    init();

    return {
      rightDrawerOpen,
      patient,
      isUpdating,
      toggleRightDrawer,
    };
  },
};
</script>
