<template lang="pug">
div(v-html="templateWithValues")#print-container
</template>

<script>
import { getPmeEncounter } from '@/services/pme';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/current-user';
import { fakeAwait } from '@/utils';
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
    const encounterDiagnosticOrders = ref([]);

    const router = useRouter();
    const userStore = useUserStore();
    const currentUser = computed(() => userStore.$state.user);

    const { TEMPLATE_TOKENS_MAP } = pmeHelper();

    const tokenDataSourceMap = {
      'current-user': currentUser,
      'medical-records': encounterMedicalRecords,
      clinic: encounterFacility,
      encounter,
      patient: encounterPatient,
      diagnosticOrders: encounterDiagnosticOrders,
    };

    const templateWithValues = computed(() => {
      let report = encounterApeReport.value?.report || '';
      const values = encounterApeReport.value?.values || [];

      // UI Components
      const medicalHistoryGroupRegex = new RegExp(UI_COMPONENT_GROUP_MEDICAL_RECORD_MEDICAL_HISTORY_ID, 'gi');
      const medicalHistories = encounterMedicalRecords.value?.filter(record => {
        return record.type === 'medical-history' && record.notes;
      }) || [];
      // Replace Medical History Group even if there is no medical history
      // with blank div so users can still write on the printed report
      if (medicalHistoryGroupRegex.test(report)) {
        report = replaceMedicalHistoryGroupUIValue({
          id: UI_COMPONENT_GROUP_MEDICAL_RECORD_MEDICAL_HISTORY_ID,
          report,
          data: medicalHistories || [],
        });
      }

      // Laboratory Block
      const laboratoryOrders = encounterDiagnosticOrders.value?.filter(order => {
        return order.type === 'laboratory';
      }) || [];
      const allLaboratoryTests = laboratoryOrders.reduce((acc, order) => {
        return [...acc, ...order.diagnosticOrderTests];
      }, []);

      if (allLaboratoryTests.length) {
        const diagnosticHepatitisBGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_HEPATITIS_B_ID, 'gi');
        const hepatitisBKeywords = ['hepatitis b', 'hepatitis-b', 'hepatitisb'];
        const hepatitisBTests = allLaboratoryTests.filter(test => {
          return hepatitisBKeywords.some(keyword => {
            return test.testName?.toLowerCase().includes(keyword) ||
              test.section?.toLowerCase().includes(keyword) ||
              test.tags?.some(tag => tag.toLowerCase().includes(keyword));
          });
        });
        if (diagnosticHepatitisBGroupRegex.test(report) && hepatitisBTests.length) {
          report = replaceDiagnosticGroupUIValue({
            id: UI_COMPONENT_GROUP_DIAGNOSTIC_HEPATITIS_B_ID,
            report,
            data: hepatitisBTests,
          });
        }

        const diagnosticHematologyGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_HEMATOLOGY_ID, 'gi');
        const hematologyKeywords = ['hematology', 'cbc', 'complete blood count'];
        const hematologyTests = allLaboratoryTests.filter(test => {
          return hematologyKeywords.some(keyword => {
            return test.testName?.toLowerCase().includes(keyword) ||
              test.section?.toLowerCase().includes(keyword) ||
              test.tags?.some(tag => tag.toLowerCase().includes(keyword));
          });
        });
        if (diagnosticHematologyGroupRegex.test(report) && hematologyTests.length) {
          report = replaceDiagnosticGroupUIValue({
            id: UI_COMPONENT_GROUP_DIAGNOSTIC_HEMATOLOGY_ID,
            report,
            data: hematologyTests,
          });
        }

        const diagnosticUrinalysisGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_URINALYSIS_ID, 'gi');
        const urinalysisKeywords = ['urinalysis', 'urine'];
        const urinalysisTests = allLaboratoryTests.filter(test => {
          return urinalysisKeywords.some(keyword => {
            return test.testName?.toLowerCase().includes(keyword) ||
              test.section?.toLowerCase().includes(keyword) ||
              test.tags?.some(tag => tag.toLowerCase().includes(keyword));
          });
        });
        if (diagnosticUrinalysisGroupRegex.test(report) && urinalysisTests.length) {
          report = replaceDiagnosticGroupUIValue({
            id: UI_COMPONENT_GROUP_DIAGNOSTIC_URINALYSIS_ID,
            report,
            data: urinalysisTests,
          });
        }

        const diagnosticFecalysisGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_FECALYSIS_ID, 'gi');
        const fecalysisKeywords = ['fecalysis', 'stool'];
        const fecalysisTests = allLaboratoryTests.filter(test => {
          return fecalysisKeywords.some(keyword => {
            return test.testName?.toLowerCase().includes(keyword) ||
              test.section?.toLowerCase().includes(keyword) ||
              test.tags?.some(tag => tag.toLowerCase().includes(keyword));
          });
        });
        if (diagnosticFecalysisGroupRegex.test(report) && fecalysisTests.length) {
          report = replaceDiagnosticGroupUIValue({
            id: UI_COMPONENT_GROUP_DIAGNOSTIC_FECALYSIS_ID,
            report,
            data: fecalysisTests,
          });
        }

        const diagnosticPregnancyGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_PREGNANCY_ID, 'gi');
        const pregnancyKeywords = ['pregnancy', 'pregnancy test'];
        const pregnancyTests = allLaboratoryTests.filter(test => {
          return pregnancyKeywords.some(keyword => {
            return test.testName?.toLowerCase().includes(keyword) ||
              test.section?.toLowerCase().includes(keyword) ||
              test.tags?.some(tag => tag.toLowerCase().includes(keyword));
          });
        });
        if (diagnosticPregnancyGroupRegex.test(report) && pregnancyTests.length) {
          report = replaceDiagnosticGroupUIValue({
            id: UI_COMPONENT_GROUP_DIAGNOSTIC_PREGNANCY_ID,
            report,
            data: pregnancyTests,
          });
        }

        const diagnosticHepatitisAGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_HEPATITIS_A_ID, 'gi');
        const hepatitisAKeywords = ['hepatitis a', 'hepatitis-a', 'hepatitisa'];
        const hepatitisATests = allLaboratoryTests.filter(test => {
          return hepatitisAKeywords.some(keyword => {
            return test.testName?.toLowerCase().includes(keyword) ||
              test.section?.toLowerCase().includes(keyword) ||
              test.tags?.some(tag => tag.toLowerCase().includes(keyword));
          });
        });
        if (diagnosticHepatitisAGroupRegex.test(report) && hepatitisATests.length) {
          report = replaceDiagnosticGroupUIValue({
            id: UI_COMPONENT_GROUP_DIAGNOSTIC_HEPATITIS_A_ID,
            report,
            data: hepatitisATests,
          });
        }
      }

      // Radiology Block
      const radiologyOrders = encounterDiagnosticOrders.value?.filter(order => order.type === 'radiology') || [];
      const allRadiologyTests = radiologyOrders.reduce((acc, order) => {
        return [...acc, ...order.diagnosticOrderTests];
      }, []);

      if (allRadiologyTests.length) {
        const diagnosticRadiologyGroupRegex = new RegExp(UI_COMPONENT_GROUP_DIAGNOSTIC_RADIOLOGY_ID, 'gi');
        if (diagnosticRadiologyGroupRegex.test(report)) {
          report = replaceDiagnosticGroupUIValue({
            id: UI_COMPONENT_GROUP_DIAGNOSTIC_RADIOLOGY_ID,
            report,
            data: allRadiologyTests,
          });
        }
      }

      values?.forEach((item) => {
        const mapKey = generateKeyFromToken(item.id);
        const matchedToken = TEMPLATE_TOKENS_MAP.get(mapKey);

        if (!matchedToken) {
          report = report.replace(`{${item.id}}`, item.answer || '');
        }

        const dataSource = tokenDataSourceMap[matchedToken?.dataSource];

        let answer = '';

        console.warn('item', item.answer);

        if (matchedToken?.dataSource === 'patient') {
          answer = item.answer || matchedToken.format(dataSource?.value);
          report = report.replace(`{${item.id}}`, answer);
          return;
        }

        /** Display the formatted answer */
        answer = item.answer || matchedToken?.format(dataSource?.value);
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
        encounterDiagnosticOrders.value = result.diagnosticOrders;

        await fakeAwait(3000);
        // await print();
        window.focus();
        window.print();
        router.go(-1);
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    function addStyles (win, styles) {
      styles.forEach(style => {
        const link = win.document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', style);
        win.document.getElementsByTagName('head')[0].appendChild(link);
      });
    }

    function openWindow (url, name, props) {
      let windowRef = null;
      windowRef = window.open(url, name, props);
      if (!windowRef.opener) {
        windowRef.opener = self;
      }
      windowRef.focus();
      return windowRef;
    }

    async function print () {
      const element = window.document.getElementById('print-container');
      const url = '';
      const win = openWindow(url);

      win.document.write(`
        <html>
          <head>
            <title>Print</title>
            <style>
              body, span, a, p, div, b, small, td, th {
                font-size: 12px !important;
              }
            </style>
          </head>
          <body>
            ${element.outerHTML.trim()}
          </body>
        </html>
      `);

      addStyles(win);

      win.focus();
      win.print();

      router.go(-1);
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
    zoom: 70%;
    background: white !important;
  }
}
</style>
