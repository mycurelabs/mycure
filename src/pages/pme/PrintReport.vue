<template lang="pug">
div(v-html="templateWithValues")#print-container
</template>

<script>
import { getPmeEncounter } from '@/services/pme';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/current-user';
import pmeHelper, { replaceMedicalHistoryGroupUIValue, replaceDiagnosticGroupUIValue } from '@/composables/pme-helpers';
import {
  UI_COMPONENT_GROUP_MEDICAL_RECORD_MEDICAL_HISTORY_ID,
  UI_COMPONENT_GROUP_DIAGNOSTIC_HEMATOLOGY_ID,
  UI_COMPONENT_GROUP_DIAGNOSTIC_URINALYSIS_ID,
  UI_COMPONENT_GROUP_DIAGNOSTIC_FECALYSIS_ID,
  UI_COMPONENT_GROUP_DIAGNOSTIC_HEPATITIS_B_ID,
  UI_COMPONENT_GROUP_DIAGNOSTIC_PREGNANCY_ID,
  UI_COMPONENT_GROUP_DIAGNOSTIC_HEPATITIS_A_ID,
  UI_COMPONENT_GROUP_DIAGNOSTIC_RADIOLOGY_ID,
} from '@/constants/pme';

export default {
  setup () {
    const route = useRoute();
    const encounterId = route.params.encounter;
    const loading = ref(false);
    const encounter = ref({});
    const encounterApeReport = ref({});
    const encounterFacility = ref({});
    const encounterMedicalRecords = ref([]);
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
      let report = encounterApeReport.value?.report || '';
      const values = encounterApeReport.value?.values || [];

      // UI Components
      const medicalHistoryGroupRegex = new RegExp(UI_COMPONENT_GROUP_MEDICAL_RECORD_MEDICAL_HISTORY_ID, 'gi');
      const medicalHistories = encounterMedicalRecords.value?.filter(record => {
        return record.type === 'medical-history' && record.notes;
      }) || [];
      if (medicalHistoryGroupRegex.test(report) && medicalHistories.length) {
        report = replaceMedicalHistoryGroupUIValue({
          id: UI_COMPONENT_GROUP_MEDICAL_RECORD_MEDICAL_HISTORY_ID,
          report,
          data: medicalHistories,
        });
      }

      const diagnosticHepatitisBGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_HEPATITIS_B_ID, 'gi');
      if (diagnosticHepatitisBGroupRegex.test(report)) {
        report = replaceDiagnosticGroupUIValue({
          id: UI_COMPONENT_GROUP_DIAGNOSTIC_HEPATITIS_B_ID,
          report,
          data: [],
        });
      }

      const diagnosticHematologyGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_HEMATOLOGY_ID, 'gi');
      if (diagnosticHematologyGroupRegex.test(report)) {
        report = replaceDiagnosticGroupUIValue({
          id: UI_COMPONENT_GROUP_DIAGNOSTIC_HEMATOLOGY_ID,
          report,
          data: [],
        });
      }

      const diagnosticUrinalysisGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_URINALYSIS_ID, 'gi');
      if (diagnosticUrinalysisGroupRegex.test(report)) {
        report = replaceDiagnosticGroupUIValue({
          id: UI_COMPONENT_GROUP_DIAGNOSTIC_URINALYSIS_ID,
          report,
          data: [],
        });
      }

      const diagnosticFecalysisGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_FECALYSIS_ID, 'gi');
      if (diagnosticFecalysisGroupRegex.test(report)) {
        report = replaceDiagnosticGroupUIValue({
          id: UI_COMPONENT_GROUP_DIAGNOSTIC_FECALYSIS_ID,
          report,
          data: [],
        });
      }

      const diagnosticPregnancyGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_PREGNANCY_ID, 'gi');
      if (diagnosticPregnancyGroupRegex.test(report)) {
        report = replaceDiagnosticGroupUIValue({
          id: UI_COMPONENT_GROUP_DIAGNOSTIC_PREGNANCY_ID,
          report,
          data: [],
        });
      }

      const diagnosticHepatitisAGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_HEPATITIS_A_ID, 'gi');
      if (diagnosticHepatitisAGroupRegex.test(report)) {
        report = replaceDiagnosticGroupUIValue({
          id: UI_COMPONENT_GROUP_DIAGNOSTIC_HEPATITIS_A_ID,
          report,
          data: [],
        });
      }

      const diagnosticRadiologyGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_RADIOLOGY_ID, 'gi');
      if (diagnosticRadiologyGroupRegex.test(report)) {
        report = replaceDiagnosticGroupUIValue({
          id: UI_COMPONENT_GROUP_DIAGNOSTIC_RADIOLOGY_ID,
          report,
          data: [],
        });
      }

      values?.forEach((item) => {
        const mapKey = generateKeyFromToken(item.id);
        const matchedToken = TEMPLATE_TOKENS_MAP.get(mapKey);

        if (!matchedToken) {
          report = report.replace(`{${item.id}}`, item.answer || '');
        }

        const dataSource = tokenDataSourceMap[matchedToken?.dataSource];

        let answer = '';

        if (matchedToken?.dataSource === 'patient') {
          answer = matchedToken.format(dataSource?.value);
          report = report.replace(`{${item.id}}`, answer);
          return;
        }

        /** Display the formatted answer */
        answer = matchedToken?.format(dataSource?.value);
        report = report.replace(`{${item.id}}`, answer);
      });

      return report;
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
