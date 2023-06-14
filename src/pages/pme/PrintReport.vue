<template lang="pug">
div(v-html="templateWithValues")#print-container
</template>

<script>
import { getPmeEncounter } from '@/services/pme';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/current-user';
import pmeHelper, { useMedicalHistoryUIComponentHandler } from '@/composables/pme-helpers';
export default {
  setup () {
    const route = useRoute();
    const encounterId = route.params.encounter;
    const loading = ref(false);
    const encounter = ref({});
    const encounterApeReport = ref({});
    const encounterFacility = ref({});
    const encounterMedicalRecords = ref({});
    const encounterPatient = ref({});

    const router = useRouter();
    const userStore = useUserStore();
    const currentUser = computed(() => userStore.$state.user);

    const {
      TEMPLATE_TOKENS_MAP,
    } = pmeHelper();

    const tokenDataSourceMap = {
      'current-user': currentUser,
      'medical-records': encounterMedicalRecords,
      clinic: encounterFacility,
      encounter,
      patient: encounterPatient,
    };

    const templateWithValues = computed(() => {
      let rawTemplate = encounterApeReport.value?.report || '';
      console.warn('rawTemplate', rawTemplate);
      const values = encounterApeReport.value?.values || [];
      console.warn('values', values);

      // Make composable for parsing just a part of
      // the report template
      if (/report-template-medical-history-group/gi.test(rawTemplate)) {
        rawTemplate = useMedicalHistoryUIComponentHandler(rawTemplate, encounterMedicalRecords.value);
      }

      values?.forEach((item) => {
        const mapKey = generateKeyFromToken(item.id);
        const matchedToken = TEMPLATE_TOKENS_MAP.get(mapKey);

        if (!matchedToken) {
          rawTemplate = rawTemplate.replace(`{${item.id}}`, item.answer || '');
        }

        const dataSource = tokenDataSourceMap[matchedToken?.dataSource];

        let answer = '';

        if (matchedToken?.dataSource === 'patient') {
          answer = matchedToken.format(dataSource?.value);
          rawTemplate = rawTemplate.replace(`{${item.id}}`, answer);
          return;
        }

        /** Display the formatted answer */
        answer = matchedToken?.format(dataSource?.value);
        rawTemplate = rawTemplate.replace(`{${item.id}}`, answer);
      });

      return rawTemplate;
    });

    function generateKeyFromToken (id) {
      if (!id) return null;
      const idWords = id.split('_');
      if (!idWords.length) return null;
      idWords.pop();
      return idWords.join('_');
    }

    async function init () {
      try {
        loading.value = true;
        const result = await getPmeEncounter({ id: encounterId });
        encounter.value = result.encounter;
        encounterApeReport.value = result.apeReport;
        encounterFacility.value = result.facility;
        encounterMedicalRecords.value = result.medicalRecords;
        encounterPatient.value = result.patient;

        setTimeout(() => {
          window.print();
          router.go(-1);
        }, 1000);
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    onMounted(() => init());

    return {
      loading,
      encounter,
      encounterApeReport,
      templateWithValues,
    };
  },
};
</script>

<style scoped>
@media print {
  body {
    background: white !important;
  }
  #print-container {
    size: legal;
    zoom: 90%;
    background: white !important;
  }
}
</style>
