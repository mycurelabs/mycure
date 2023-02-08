<template lang="pug">
template(v-if="view === 'paper'")
  div(v-html="templatePrefilled" style="width: 990px; padding-bottom: 100px; padding: 10px;")
  //- pre {{apeReportTemplateDataItems}}
template(v-if="view === 'form'")
  q-form(ref="focusedModeFormRef" @submit.prevent="onSaveReport")
    div.row
      div.col-xs-12
        h2.text-h6 Custom Text
      template(v-for="value in apeReportValues")
        template(v-if="value.id.startsWith('custom_text')")
          div.col-xs-12.col-md-4.q-pa-sm
            q-input(
              v-model="focusedModeModel[value.id]"
              color="primary"
              outlined
              dense
              :label="generateLabelFromId(value.id)"
            ).q-mb-md
    div.row
      div.col-xs-12
        h2.text-h6 Custom Choices
      template(v-for="value in apeReportValues")
        template(v-if="value.id.startsWith('custom_choices')")
          div.col-xs-12.col-md-4.q-pa-sm
            q-select(
              v-model="focusedModeModel[value.id]"
              color="primary"
              outlined
              dense
              :label="generateLabelFromId(value.id)"
              :options="getQuestionItem(value.id).choices"
            ).q-mb-md
</template>

<script>
import { computed, ref, toRef } from 'vue';
import { useQuasar } from 'quasar';
import { format } from 'date-fns';
import { capitalized } from '@/utils';
import pmeHelper from '@/composables/pme-helpers';
export default {
  props: {
    patient: {
      type: Object,
      default: () => ({}),
    },
    encounter: {
      type: Object,
      default: () => ({}),
    },
    facility: {
      type: Object,
      default: () => ({}),
    },
    apeReport: {
      type: Object,
      default: () => ({}),
    },
    medicalRecords: {
      type: Array,
      default: () => ([]),
    },
    view: {
      type: String,
      default: 'paper',
    },
  },
  setup (props) {
    const q = useQuasar();
    const {
      TEMPLATE_TOKENS_MAP,
      pmeEncounterStatusMapper,
    } = pmeHelper();

    const primaryColor = q.config.brand.primary;

    const focusedModeModel = ref({});

    const apeEncounter = toRef(props, 'encounter');
    const encounterFacility = toRef(props, 'facility');
    const encounterPatient = toRef(props, 'patient');
    const encounterApeReport = toRef(props, 'apeReport');
    const encounterMedicalRecords = toRef(props, 'medicalRecords');

    const apeReportCreatedAt = computed(() => format(encounterApeReport.value?.createdAt || new Date(), 'MMM dd, yyyy'));
    const apeReportStatus = computed(() => pmeEncounterStatusMapper(props.encounter));
    const apeReportValues = computed(() => encounterApeReport.value?.values || []);
    const apeReportTemplateData = computed(() => encounterApeReport.value?.templateData);
    const apeReportTemplate = computed(() => apeReportTemplateData.value?.template);
    const apeReportTemplateDataItems = computed(() => encounterApeReport.value?.templateData?.items || []);

    const tokenDataSourceMap = {
      patient: encounterPatient,
      'medical-records': encounterMedicalRecords,
      clinic: encounterFacility,
      encounter: apeEncounter,
    };

    console.warn(tokenDataSourceMap);

    const templatePrefilled = computed(() => {
      let report = apeReportTemplate.value;
      const values = encounterApeReport.value?.values || [];

      if (!report) return '';
      values.forEach((value, index) => {
        if (value.id.startsWith('custom_text')) {
          const label = generateLabelFromId(value.id);
          const element = `<textarea id="${value.id}" placeholder="${label}" value="${value.answer}" rows="1" style="border-radius: 3px; border: 1px solid ${primaryColor}; height: 20px; margin-bottom: -7px; max-height: 50px; width: 80px; max-width: 200px;"></textarea>`;
          report = report.replace(`{${value.id}}`, element);
          return;
        }

        if (value.id.startsWith('custom_choices')) {
          const questionItem = getQuestionItem(value.id);
          const choices = questionItem?.choices || [];
          const label = generateLabelFromId(value.id);
          const element = `<select id="${value.id}" placeholder="${label}" value="${value.answer}" style="border-radius: 3px; border: 1px solid ${primaryColor}; margin-bottom: -5px; max-height: 50px; max-width: 200px; width: 80px;">${choices.map(choice => `<option ${choice}>${choice}</option>`)}</select>`;
          report = report.replace(`{${value.id}}`, element);
          return;
        }

        const mapKey = generateKeyFromToken(value.id);
        const matchedToken = TEMPLATE_TOKENS_MAP.get(mapKey);

        if (!matchedToken) {
          report = report.replace(`{${value.id}}`, value.answer);
          return;
        }

        const dataSource = tokenDataSourceMap[matchedToken.dataSource];

        if (matchedToken.token === 'patient_encounter_created_at') {
          console.warn('======================');
          console.warn('matchedToken', matchedToken);
          console.warn('dataSource', dataSource.value);
          console.warn('======================');
        }

        if (matchedToken?.readonly) {
          let answer = value.answer;

          if (matchedToken.dataSource === 'patient') {
            answer = matchedToken.format(dataSource.value);
            report = report.replace(`{${value.id}}`, answer);
            return;
          }

          // if (!value.answer) answer = matchedToken.format(dataSource.value);
          answer = matchedToken.format(dataSource.value);
          report = report.replace(`{${value.id}}`, answer);
        }

        if (!matchedToken?.readonly) {
          const label = generateLabelFromId(value.id);
          const element = `<textarea id="${value.id}" placeholder="${label}" value="${value.answer}" rows="1" style="border-radius: 3px; border: 1px solid ${primaryColor}; height: 20px; margin-bottom: -7px; max-height: 50px; width: 80px; max-width: 200px;"></textarea>`;
          report = report.replace(`{${value.id}}`, element);
        }
      });

      return report;
    });

    function generateLabelFromId (id) {
      if (!id) return '';
      const idWords = id.split('_');
      idWords.shift();
      idWords.shift();
      idWords.pop();
      return idWords.map(word => capitalized(word)).join(' ');
    }

    function generateKeyFromToken (id) {
      if (!id) return null;
      const idWords = id.split('_');
      if (!idWords.length) return null;
      idWords.pop();
      return idWords.join('_');
    }

    function getQuestionItem (id) {
      const item = apeReportTemplateDataItems.value.find(item => {
        return id.startsWith(item.question);
      });
      return item || { choices: [] };
    }

    function onSaveReport () {}

    return {
      apeEncounter,
      apeReportCreatedAt,
      apeReportStatus,
      apeReportTemplate,
      apeReportTemplateData,
      apeReportTemplateDataItems,
      apeReportValues,
      encounterApeReport,
      encounterFacility,
      encounterMedicalRecords,
      encounterPatient,
      focusedModeModel,
      templatePrefilled,
      // methods
      getQuestionItem,
      onSaveReport,
      generateLabelFromId,
    };
  },
};
</script>
