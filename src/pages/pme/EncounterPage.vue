<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="loading"
)
  div.row.items-center.justify-center.q-mb-lg
    div.col-xs-12.col-md-10
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
            //- q-tab(
            //-   name="focused"
            //-   label="Focused Mode"
            //-   icon="la la-bullseye"
            //-   no-caps
            //- )
            q-tab(
              name="signatories"
              label="Signatories"
              icon="las la-signature"
              no-caps
            )
        q-separator
        q-card-section
          q-tab-panels(v-model="tabModel" animated)
            q-tab-panel(name="live")
              div.row.justify-center.q-mb-sm
                search-form-templates(
                  style="width: 1100px;"
                  outlined
                  :default-value="formTemplate"
                  @select="onTemplateSelect"
                )
              div.row.justify-center
                q-scroll-area(style="height: 100vh; width: 1100px; margin-top: 0px; padding-top: 0px; border: 1px solid lightgrey; border-radius: 5px;")
                  ape-report-viewer(
                    ref="apeReportViewerLiveEditRef"
                    view="paper"
                    :ape-report="encounterApeReport"
                    :current-user="currentUser"
                    :encounter="encounter"
                    :facility="encounterFacility"
                    :form-template="formTemplate"
                    :medical-records="encounterMedicalRecords"
                    :patient="encounterPatient"
                  )
            //- q-tab-panel(name="focused")
              //- ape-report-viewer(
              //-   view="form"
              //-   :ape-report="encounterApeReport"
              //-   :patient="encounterPatient"
              //-   :encounter="encounter"
              //-   :medical-records="encounterMedicalRecords"
              //-   :facility="encounterFacility"
              //- )
            q-tab-panel(name="signatories")
              div.row.items-top
                div.col-xs-12.col-md-6.q-pa-sm
                  span.block Medical Examiner:
                  div(v-if="isEditingExaminer").row.items-center
                    div.col-grow
                      search-members(
                        label="Medical Examiner"
                        autofocus
                        :roles="medicalExaminerRoles"
                        @select="v => selectedExaminer = v"
                      )
                    div
                      q-btn(
                        @click="isEditingExaminer = false"
                        icon="las la-times"
                        color="negative"
                        round
                        flat
                      ).q-ml-sm
                  div(v-else).row.items-center.justify-between
                    span.text-weight-medium.block {{examinerNameFormatted || '-'}}
                    q-btn(
                      icon="las la-edit"
                      color="primary"
                      round
                      flat
                      @click="isEditingExaminer = true"
                    )

                div.col-xs-12.col-md-6.q-pa-sm
                  span.block Evaluated By:
                  div(v-if="isEditingEvaluator").row.items-center
                    div.col-grow
                      search-members(
                        label="Evaluated By"
                        autofocus
                        :roles="evaluatorRoles"
                        @select="v => selectedReviewer = v"
                      )
                    div
                      q-btn(
                        @click="isEditingEvaluator = false"
                        icon="las la-times"
                        color="negative"
                        round
                        flat
                      ).q-ml-sm
                  div(v-else).row.items-center.justify-between
                    span.text-weight-medium.block {{reviewerNameFormatted || '-'}}
                    q-btn(
                      icon="las la-edit"
                      color="primary"
                      round
                      flat
                      @click="isEditingEvaluator = true"
                    )
                div.col-xs-12.col-md-6.q-pa-sm
                  span.block Processed By:
                  span.text-weight-medium.block {{createdByNameFormatted || '-'}}
                div.col-xs-12.col-md-6.q-pa-sm
                  span.block Finalized By:
                  span.text-weight-medium.block {{finalizedByNameFormatted || '-'}}
  //- div.row.items-center.justify-center.q-mb-lg
    div.col-xs-12.col-md-10.q-mb-md
      span.text-h6.text-primary Past Encounters
    div.col-xs-12.col-md-10
      q-card.shadow-1
        q-card-section
q-footer(
  bordered
).bg-white
  q-toolbar
    q-space
    q-btn(
      label="Finalize Report"
      color="positive"
      unelevated
      no-caps
    ).q-mr-sm
    q-btn(
      label="Save Report"
      color="primary"
      unelevated
      no-caps
      @click="onSaveReport"
    )
</template>

<script>
import { computed, ref, watch } from 'vue';
import { format } from 'date-fns';
import { getPmeEncounter } from '@/services/pme';
import { sdk } from '@/boot/mycure';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/current-user';
import { formatDoctorName as formatDoctorNameUtil } from '@/utils';

import ApeReportViewer from '@/components/pme/ApeReportViewer';
import GenericPage from '@/components/commons/GenericPage';
import SearchFormTemplates from '@/components/commons/search/SearchFormTemplates';
import SearchMembers from '@/components/commons/search/SearchMembers.vue';
import usePmeHelper from '@/composables/pme-helpers';

export default {
  components: {
    ApeReportViewer,
    GenericPage,
    SearchFormTemplates,
    SearchMembers,
  },
  setup () {
    const loading = ref(false);
    const route = useRoute();
    const tabModel = ref('signatories');
    const focusedModeModel = ref({});
    const focusedModeFormRef = ref(null);
    const apeReportFieldsModel = ref({});
    const userStore = useUserStore();
    const apeReportViewerLiveEditRef = ref(null);
    const { pmeEncounterStatusMapper } = usePmeHelper();

    const currentUser = computed(() => userStore.$state.user);

    const encounter = ref({});
    const encounterId = route.params.encounter;
    const encounterApeReport = ref({});
    const encounterFacility = ref({});
    const encounterMedicalRecords = ref([]);
    const encounterPatient = ref({});

    const selectedExaminer = ref(null);
    const selectedReviewer = ref(null);

    const examinerDetails = computed(() => selectedExaminer.value || encounterApeReport.value?.examinedByData);
    const examinerNameFormatted = computed(() => formatDoctorName(examinerDetails.value));

    const reviwerDetails = computed(() => selectedReviewer.value || encounterApeReport.value?.reviewedByData);
    const reviewerNameFormatted = computed(() => formatDoctorName(reviwerDetails.value));

    const createdByDetails = computed(() => encounterApeReport.value?.createdByDetails);
    const createdByNameFormatted = computed(() => formatDoctorName(createdByDetails.value));

    const finalizedByDetails = computed(() => encounterApeReport.value?.finalizedByData);
    const finalizedByNameFormatted = computed(() => formatDoctorName(finalizedByDetails.value));

    const medicalExaminerRoles = ['doctor_pme'];
    const evaluatorRoles = ['doctor_pme'];

    const isEditingEvaluator = ref(true);
    const isEditingExaminer = ref(true);

    watch(selectedExaminer, (val) => {
      console.warn('val', val);
      isEditingExaminer.value = false;
    });

    watch(selectedReviewer, (val) => {
      console.warn('val', val);
      isEditingEvaluator.value = false;
    });

    watch(examinerNameFormatted, (val) => {
      if (val) {
        isEditingExaminer.value = false;
      }
    });

    watch(reviewerNameFormatted, (val) => {
      if (val) {
        isEditingEvaluator.value = false;
      }
    });

    const apeReportCreatedAt = computed(() => format(encounterApeReport.value?.createdAt || new Date(), 'MMM dd, yyyy'));
    const apeReportStatus = computed(() => pmeEncounterStatusMapper(encounter.value));
    const formTemplate = computed({
      get () {
        const template = encounterApeReport.value?.templateData;
        return template;
      },
      set (newValue) {
        formTemplate.value = newValue;
      },
    });

    async function init () {
      try {
        loading.value = true;
        const result = await getPmeEncounter({ id: encounterId });
        encounter.value = result.encounter;
        encounterApeReport.value = result.apeReport;
        console.warn('encounterApeReport.value', encounterApeReport.value);
        encounterFacility.value = result.facility;
        encounterMedicalRecords.value = result.medicalRecords;
        encounterPatient.value = result.patient;
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    async function onSaveReport () {
      try {
        loading.value = true;
        const payload = {};

        if (tabModel.value === 'live') {
          const { values, template } = apeReportViewerLiveEditRef.value?.onSaveReport();
          payload.values = values;
          payload.template = template;
          console.warn('data', payload);
        }

        if (tabModel.value === 'focused') {
          //
        }

        await sdk.service('medical-records').update(encounterApeReport.value?.id, payload);
        init();
      } catch (e) {
        console.error(e);
      }
    }

    async function onTemplateSelect (template) {
      if (!template) return;
      encounterApeReport.value.templateData = template;
      console.warn('encounterApeReport.value.templateData', encounterApeReport.value.templateData);
    }

    function formatDoctorName (personalDetails) {
      console.warn('personalDetails', personalDetails);
      return formatDoctorNameUtil(personalDetails);
    }

    init();

    return {
      apeReportCreatedAt,
      apeReportFieldsModel,
      apeReportStatus,
      apeReportViewerLiveEditRef,
      createdByNameFormatted,
      currentUser,
      encounter,
      encounterApeReport,
      encounterFacility,
      encounterMedicalRecords,
      encounterPatient,
      evaluatorRoles,
      examinerNameFormatted,
      finalizedByNameFormatted,
      focusedModeFormRef,
      focusedModeModel,
      formTemplate,
      isEditingEvaluator,
      isEditingExaminer,
      loading,
      medicalExaminerRoles,
      reviewerNameFormatted,
      selectedExaminer,
      selectedReviewer,
      tabModel,
      //
      onSaveReport,
      onTemplateSelect,
    };
  },
};
</script>
