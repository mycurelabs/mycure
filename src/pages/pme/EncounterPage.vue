<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="loading"
)
  div.row.items-center.justify-center
    div(style="width: 1100px;")
      q-card.shadow-1
        q-toolbar(style="height: 80px; background: #f2f2f2")
          q-toolbar-title.text-h6.text-primary PME Report {{apeReportCreatedAt}} #[q-chip(dense :color="apeReportStatus.color").text-white {{apeReportStatus.label}}]
            br
            span.text-body1 {{encounterFacility.name}}
        q-toolbar
          q-tabs(
            v-model="tabModel"
            indicator-color="primary"
          )
            q-tab(
              name="live"
              label="Live Edit Mode"
              icon="la la-pen"
              no-caps
            )
            q-tab(
              name="focused"
              label="Focused Mode"
              icon="la la-bullseye"
              no-caps
            )
        q-separator
        q-card-section
          q-tab-panels(v-model="tabModel" animated)
            q-tab-panel(name="live")
              q-scroll-area(style="height: 100vh; margin-top: 0px; padding-top: 0px;")
                div(v-html="apeReportTemplate" style="width: 1000px; padding-bottom: 100px;")
            q-tab-panel(name="focused")
              q-form(ref="focusedModeFormRef" @submit.prevent="onSaveReport")
                div.row
                    div.col-xs-12.col-md-6.q-pa-sm
                      h2.text-h6 Custom Text
                      template(v-for="value in apeReportValues")
                        template(v-if="value.id.startsWith('custom_text')")
                          q-input(
                            v-model="focusedModeModel[value.id]"
                            color="primary"
                            outlined
                            dense
                            :label="value.id"
                          ).q-mb-md
                    div.col-xs-12.col-md-6.q-pa-sm
                      h2.text-h6 Custom Choices
                      template(v-for="value in apeReportValues")
                        template(v-if="value.id.startsWith('custom_choices')")
                          q-select(
                            v-model="focusedModeModel[value.id]"
                            color="primary"
                            outlined
                            dense
                            :label="value.id"
                            :options="getQuestionItem(value.id).choices"
                          ).q-mb-md
              pre focusedModeModel: {{focusedModeModel}}
          pre {{apeReport}}
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
import { usePatientsStore } from '@/stores/patients';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { format } from 'date-fns';
import GenericPage from '@/components/commons/GenericPage';
import pmeHelper from '@/composables/pme-helpers';
import { sdk } from '@/boot/mycure';
export default {
  components: {
    GenericPage,
  },
  setup () {
    const loading = ref(false);
    const q = useQuasar();
    const { PME_APE_REPORT_PATIENT_KEYS_MAP, pmeEncounterStatusMapper } = pmeHelper();
    const primaryColor = q.config.brand.primary;
    const route = useRoute();
    const pmeStore = usePmeStore();
    const patientStore = usePatientsStore();
    const encounterId = route.params.encounter;
    const patientId = route.query.patient;
    const encounter = ref({});
    const encounterPatient = ref({});
    const encounterFacility = computed(() => encounter?.value.facility);
    const tabModel = ref('live');
    const focusedModeModel = ref({});
    const focusedModeFormRef = ref(null);
    const apeReport = ref({});
    const apeReportCreatedAt = computed(() => format(apeReport.value?.createdAt, 'MMM dd, yyyy'));
    const apeReportStatus = computed(() => pmeEncounterStatusMapper(encounter));
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
          const questionItem = getQuestionItem(value.id);
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

    function getQuestionItem (id) {
      const item = apeReportTemplateDataItems.value.find(item => id.startsWith(item.question));
      return item || { choices: [] };
    }

    async function init () {
      try {
        loading.value = true;
        const result = await pmeStore.getPmeEncounter({ id: encounterId });
        const patient = await patientStore.getPatient({ id: patientId });
        encounter.value = result.encounter;
        apeReport.value = result.apeReport;
        encounterPatient.value = patient;
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    async function onSaveReport () {
      try {
        loading.value = true;
        const values = apeReport.value?.values || [];
        const payload = {};

        if (tabModel.value === 'focused') {
          if (!await focusedModeFormRef.value.validate()) return;

          payload.values = values.map(value => {
            const id = value?.id;
            const elem = focusedModeModel?.value?.[id];
            if (elem) return { id, answer: elem };
            return value;
          });

          const normalObject = Object.assign({}, payload);

          console.warn('payload', normalObject);
        }

        if (tabModel.value === 'live') {
          apeReportValues.value.forEach((item, index) => {
            const value = document.getElementById(item.id)?.value;
            if (value) console.warn(`${item.id}: ${value}`);
          });
        }

        await sdk.service('medical-records').update(apeReport.value.id, Object.assign({}, payload));
        init();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    init();

    return {
      apeReport,
      apeReportCreatedAt,
      apeReportFieldsModel,
      apeReportStatus,
      apeReportTemplate,
      apeReportTemplateData,
      apeReportValues,
      encounter,
      encounterPatient,
      encounterFacility,
      focusedModeFormRef,
      focusedModeModel,
      loading,
      tabModel,
      onSaveReport,
      getQuestionItem,
    };
  },
};
</script>
