<template lang="pug">
template(v-if="view === 'paper'")
  //- pre {{formTemplate}}
  //- pre {{encounterApeReport}}
  //- pre {{selectedApeReportTemplate}}
  //- pre {{templatePrefilled}}
  div(v-html="templatePrefilled" style="width: 990px; padding-bottom: 100px; padding: 10px;")#paper-view
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
import { computed, onMounted, ref, toRef } from 'vue';
import { useQuasar } from 'quasar';
import { format } from 'date-fns';
import { capitalized } from '@/utils';
import pmeHelper, {
  replaceMedicalHistoryGroupUIValue,
  replaceDiagnosticGroupUIValue,
} from '@/composables/pme-helpers';
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
    diagnosticOrders: {
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
    const encounterMedicalRecords = toRef(props, 'medicalRecords');
    const encounterDiagnosticOrders = toRef(props, 'diagnosticOrders');
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
      const regex = /(?<=\{)\w+(?=\})/g;
      let report = selectedApeReportTemplate.value || [];
      const tokens = selectedApeReportTemplate.value?.match(regex) || [];
      const values = apeReportValues.value || [];

      const tokensWithAnswer = tokens.map(token => {
        const id = token;
        const found = values.find(value => value.id === token);
        const answer = found?.answer || '';
        return {
          id,
          answer,
        };
      });

      const defaultDisplay = `
        <h3 align="center" style="color: grey;">No Report Template Selected</h3>
        <p align="center" style="color: grey;">Seach for a report template and select it to view the report.</p>
      `;

      if (!report?.length) return defaultDisplay;

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

      /**
       * Iterate through all of the tokens
       * and apply necessary logic for each
       * to display value or display the
       * appropriate input element.
       */
      tokensWithAnswer.forEach((value) => {
        /** For Custom Texts Only */
        if (value.id.startsWith('custom_text')) {
          const label = generateLabelFromId(value.id);
          const element = `<textarea id="${value.id}" placeholder="${label}" rows="1" style="border-radius: 3px; border: 1px solid ${primaryColor}; height: 20px; margin-bottom: -7px; max-height: 50px; width: 80px; max-width: 200px;">${value.answer}</textarea>`;
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

        if (matchedToken.dataSource === 'clinic') {
          console.warn('dataSource', dataSource);
        }

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
         * All writable tokens
         */
        if (!matchedToken?.readonly) {
          const label = generateLabelFromId(value.id);

          // NOTE: What's the priority? The value from the encounter or the value from the data source?
          let answer = value.answer;
          if (matchedToken.dataSource === 'medical-records') {
            answer = matchedToken.format(dataSource?.value);
          }

          let element = `<input id="${value.id}" value="${answer}" placeholder="${label}" style="border-radius: 3px; border: 1px solid ${primaryColor}; margin-bottom: -3px; width: 120px; max-width: 200px;" />`;
          switch (matchedToken?.inputType) {
            case 'textarea': {
              element = `<textarea id="${value.id}" placeholder="${label}" rows="1" style="border-radius: 3px; border: 1px solid ${primaryColor}; height: 20px; margin-bottom: -3px; height: 35px; max-height: 35px; width: 120px; max-width: 300px;">${answer}</textarea>`;
            }
          }
          report = report.replace(`{${value.id}}`, element);
        }
      });

      return report;
    });

    function onSaveReport () {
      const regex = /(?<=\{)\w+(?=\})/g;
      const tokens = selectedApeReportTemplate.value?.match(regex) || [];
      const values = encounterApeReport.value?.values || tokens.map(token => ({ id: token, answer: '' }));

      const data = tokens.map(token => {
        const id = token;
        const found = values.find(value => {
          console.warn('token', token);
          console.warn('value.id', value.id);
          return value.id === token;
        });
        console.warn('found', found);
        const element = document.getElementById(found?.id);
        const answer = element?.value || found?.answer || '';
        return {
          id,
          answer,
        };
      });

      return {
        values: data,
        template: apeFormTemplate?.value?.id,
        report: apeFormTemplate.value?.template,
      };
    }

    function generateLabelFromId (id) {
      if (!id) return '';
      const idWords = id.split('_');
      idWords.shift(); // remove the word 'custom'
      idWords.shift(); // remove the word 'text' or 'choices'
      idWords.pop(); // remove the id at the end of the token e.g. foo_bar_1kj63, remove the '1kj63'
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
