<template lang="pug">
q-layout(view="hHh LpR lFr" style="background: #fafafa")
  q-header(bordered).text-black.bg-white
    q-toolbar
      q-btn(
        icon="la la-arrow-left"
        dense
        flat
        round
        @click="goBack"
      )
      q-toolbar-title Report Template
      //- q-space
      //- q-btn(
      //-   icon="la la-prescription"
      //-   color="primary"
      //-   dense
      //-   unelevated
      //-   outline
      //-   no-caps
      //-   :label="`${rightDrawerOpen ? 'Hide' : 'Show'} Patient Records`"
      //-   @click="toggleRightDrawer"
      //- )

  //- q-drawer(
  //-   v-model="rightDrawerOpen"
  //-   side="right"
  //-   show-if-above
  //-   bordered
  //-   :width="400"
  //- )
  //-   patient-card(:patient="patient")
  //-   q-separator
  //-   q-scroll-area(style="height: calc(100% - 80px);")
  //-     div(style="height: 200px").row.full-width.justify-center.items-center
  //-       div.col-xs-12.text-center
  //-         q-icon(name="la la-notes-medical" size="60px").text-grey
  //-         h2.text-grey.text-h6 No past records

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
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import GenericPage from '@/components/commons/GenericPage';
import PatientCard from '@/components/commons/PatientCard';

export default {
  components: {
    GenericPage,
    PatientCard,
  },
  setup () {
    const router = useRouter();
    const route = useRoute();
    const rightDrawerOpen = ref(false);
    const patient = ref({});
    const reportTemplateId = route.params.reportTemplate;

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

    function goBack () {
      router.push({ name: 'pme-report-templates' });
    }

    init();

    return {
      rightDrawerOpen,
      patient,
      goBack,
      toggleRightDrawer,
    };
  },
};
</script>
