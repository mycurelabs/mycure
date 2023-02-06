<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="loading"
)
  div.row.items-center.justify-center
    div(style="width: 1100px;")
      q-card.shadow-1
        q-card-section
          q-scroll-area(style="height: 100vh;")
            div(v-html="apeReportTemplate" style="width: 1000px;")
        //- pre {{apeReportValues}}

q-footer(
  bordered
).bg-white
  q-toolbar
    q-space
    q-btn(
      label="Save Report"
      color="primary"
      unelevated
      no-caps
      @click="onSaveReport"
    )
</template>

<script>
import { computed, ref } from 'vue';
import { usePmeStore } from '@/stores/pme';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
// import { usePatient } from '@/composables/patient';
import GenericPage from '@/components/commons/GenericPage';
import pmeHelper from '@/composables/pme-helpers';
export default {
  components: {
    GenericPage,
  },
  setup () {
    const loading = ref(false);
    const q = useQuasar();
    const { PME_APE_REPORT_PATIENT_KEYS_MAP } = pmeHelper();
    const primaryColor = q.config.brand.primary;
    const route = useRoute();
    const pmeStore = usePmeStore();
    const encounterId = route.params.encounter;
    const encounter = ref({});
    const encounterPatient = computed(() => {
      // const patient =
      // usePatient(toRef(unref(encounter.value?.patient)));
      return encounter.value?.patient;
    });
    const apeReport = ref({});
    const apeReportFieldsModel = ref({});
    const apeReportValues = computed(() => apeReport.value?.values || []);
    const apeReportTemplateData = computed(() => apeReport.value?.templateData);
    const apeReportTemplateDataItems = computed(() => apeReport.value?.templateData?.items || []);

    const apeReportTemplate = computed(() => {
      let report = apeReport.value?.report;
      const values = apeReport.value?.values || [];
      if (!report) return '';
      values.forEach((value, index) => {
        if (value.id.startsWith('custom_text')) {
          report = report.replace(`{${value.id}}`,
            `<textarea
              id="${value.id}"
              value="${value.answer}"
              rows="1"
              style="
                border-radius: 3px;
                border: 1px solid ${primaryColor};
                height: 20px;
                margin-bottom: -7px;
                max-height: 50px;
                width: 100px;
                max-width: 200px;
              "
            ></textarea>`,
          );
          return;
        }

        if (value.id.startsWith('custom_choices')) {
          const questionItem = apeReportTemplateDataItems.value.find(item => value.id.startsWith(item.question));
          const choices = questionItem?.choices || [];
          report = report.replace(`{${value.id}}`, `
            <select
              id="${value.id}"
              value="${value.answer}"
              style="
                border-radius: 3px;
                border: 1px solid ${primaryColor};
                margin-bottom: -5px;
                max-height: 50px;
                max-width: 200px;
                min-width: 80px;
              "
            >
              ${choices.map(choice => {
                return `<option ${choice}>${choice}</option>`;
              })}
            </select>
          `);
          return;
        }

        if (value.id.startsWith('patient_')) {
          const patient = encounterPatient.value || {};
          const matchingToken = PME_APE_REPORT_PATIENT_KEYS_MAP.find(item => {
            const regex = new RegExp(item.token, 'gi');
            return regex.test(value.id);
          });
          const answer = matchingToken?.format(patient);
          report = report.replace(`{${value.id}}`, answer || '-');
        }

        report = report.replace(`{${value.id}}`, value.answer || '-');
      });

      return report;
    });

    async function init () {
      try {
        loading.value = true;
        const result = await pmeStore.getPmeEncounter({ id: encounterId });
        encounter.value = result.encounter;
        apeReport.value = result.apeReport;
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    function onSaveReport () {
      apeReportValues.value.forEach((item, index) => {
        const value = document.getElementById(item.id)?.value;
        if (value) console.warn(`${item.id}: ${value}`);
      });
    }

    init();

    return {
      apeReport,
      apeReportFieldsModel,
      apeReportTemplate,
      apeReportTemplateData,
      encounter,
      loading,
      encounterPatient,
      onSaveReport,
      apeReportValues,
    };
  },
};
</script>
