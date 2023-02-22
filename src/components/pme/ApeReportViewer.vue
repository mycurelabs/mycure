<template lang="pug">
template(v-if="view === 'paper'")
  div(v-html="templatePrefilled" style="width: 990px; padding-bottom: 100px; padding: 10px;")
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
    currentUser: {
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
    formTemplate: {
      type: Object,
      default: undefined,
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
    console.warn('encounterApeReport.value', encounterApeReport.value);
    const encounterMedicalRecords = toRef(props, 'medicalRecords');
    const apeFormTemplate = toRef(props, 'formTemplate');

    const apeReportCreatedAt = computed(() => format(encounterApeReport.value?.createdAt || new Date(), 'MMM dd, yyyy'));
    const apeReportStatus = computed(() => pmeEncounterStatusMapper(props.encounter));
    const apeReportValues = computed(() => encounterApeReport.value?.values || []);
    const apeReportTemplateData = computed(() => encounterApeReport.value?.templateData);
    const apeReportTemplateDataItems = computed(() => encounterApeReport.value?.templateData?.items || []);

    const selectedApeReportTemplate = computed(() => apeFormTemplate?.value?.template || apeReportTemplateData?.value?.template);

    const tokenDataSourceMap = {
      'current-user': toRef(props, 'currentUser'),
      'medical-records': encounterMedicalRecords,
      clinic: encounterFacility,
      encounter: apeEncounter,
      patient: encounterPatient,
    };

    const templatePrefilled = computed(() => {
      let report = selectedApeReportTemplate.value;
      const values = apeReportValues.value || [];

      console.warn('values', values);

      if (!report) return '';
      values.forEach((value, index) => {
        /** For Custom Texts Only */
        if (value.id.startsWith('custom_text')) {
          // console.warn('Custom Text', value.answer);
          const label = generateLabelFromId(value.id);
          const element = `<textarea id="${value.id}" placeholder="${label}" rows="1" style="border-radius: 3px; border: 1px solid ${primaryColor}; height: 20px; margin-bottom: -7px; max-height: 50px; width: 80px; max-width: 200px;">${value.answer}</textarea>`;
          // const element = `<input id="${value.id}" value="${value.answer}" placeholder="${label}" rows="1" style="border-radius: 3px; border: 1px solid ${primaryColor}; margin-bottom: -7px; max-height: 50px; width: 80px; max-width: 200px;" />`;
          report = report.replace(`{${value.id}}`, element);
          return;
        }

        /** For Custom Dropdowns */
        if (value.id.startsWith('custom_choices')) {
          const questionItem = getQuestionItem(value.id);
          const choices = questionItem?.choices || [];
          const label = generateLabelFromId(value.id);
          const element = `
            <select id="${value.id}" placeholder="${label}" style="border-radius: 3px; border: 1px solid ${primaryColor}; margin-bottom: -5px; max-height: 50px; max-width: 200px; width: 80px;">
              ${choices.map(choice => {
                if (choice === value.answer) return `<option ${choice} selected>${choice}</option>`;
                return `<option ${choice}>${choice}</option>`;
              })}
            </select>
          `;
          report = report.replace(`{${value.id}}`, element);
          return;
        }

        /** For Dental Note Result Table */
        if (value.id.startsWith('dental_note_result_table')) {
          // Answer is always an HTML table
          report = report.replace(`{${value.id}}`, value.answer);
          return;
        }

        /**
         * ===================================
         * Other input types with
         * data source to be parsed.
         * E.g. Patient Data, Medical Records
         * ===================================
         */

        /**
         * Get Token Object
         * The Token Object contains the matched token,
         * data formatter, and other options necessary
         * for rendering content/value or input components
         * for the html template.
         */
        const mapKey = generateKeyFromToken(value.id);
        const matchedToken = TEMPLATE_TOKENS_MAP.get(mapKey);

        /** If there's no matched Token Object, just display the current value */
        if (!matchedToken) {
          report = report.replace(`{${value.id}}`, `<span>${value.answer}</span>`);
          return;
        }

        /**
         * Identify Data Source
         * The Data Source will provide the data for the matched Token Object.
         * Example of this is Patient Data for Patient Token Objects.
         */
        const dataSource = tokenDataSourceMap[matchedToken.dataSource];
        // if (matchedToken.dataSource === 'current-user') {
        //   console.warn('dataSource', dataSource.value);
        // }

        /**
         * Readonly Token Objects
         * When a Token Object is readonly, there will be no input components
         * to be rendered. Either just format the Data Source or display them
         * as is.
         */
        if (matchedToken?.readonly) {
          let answer = value.answer;

          /**
           * Patient Data requires special handling because the data being used
           * are PII.
           */
          if (matchedToken.dataSource === 'patient') {
            answer = matchedToken.format(dataSource?.value);
            report = report.replace(`{${value.id}}`, answer);
            return;
          }

          /** Display the formatted answer */
          answer = matchedToken.format(dataSource?.value);
          report = report.replace(`{${value.id}}`, answer);
          return;
        }

        /**
         * All writable Tokens
         */
        if (!matchedToken?.readonly) {
          const label = generateLabelFromId(value.id);
          let element = `<input id="${value.id}" value="${value.answer}" placeholder="${label}" style="border-radius: 3px; border: 1px solid ${primaryColor}; margin-bottom: -3px; width: 120px; max-width: 200px;" />`;
          switch (matchedToken?.inputType) {
            case 'textarea': {
              element = `<textarea id="${value.id}" placeholder="${label}" rows="1" style="border-radius: 3px; border: 1px solid ${primaryColor}; height: 20px; margin-bottom: -3px; height: 35px; max-height: 35px; width: 120px; max-width: 300px;">${value.answer}</textarea>`;
            }
          }
          report = report.replace(`{${value.id}}`, element);
        }
      });

      return report;
    });

    function onSaveReport () {
      const values = encounterApeReport.value?.values || [];
      const data = values.map(value => {
        const element = document.getElementById(value.id);
        const answer = element?.value || value.answer || '';
        return {
          id: value.id,
          answer,
        };
      });
      return data;
    }

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

    return {
      apeEncounter,
      apeReportCreatedAt,
      apeReportStatus,
      apeReportTemplateData,
      apeReportTemplateDataItems,
      apeReportValues,
      encounterApeReport,
      encounterFacility,
      encounterMedicalRecords,
      encounterPatient,
      focusedModeModel,
      selectedApeReportTemplate,
      templatePrefilled,
      // methods
      getQuestionItem,
      onSaveReport,
      generateLabelFromId,
    };
  },
};
</script>
