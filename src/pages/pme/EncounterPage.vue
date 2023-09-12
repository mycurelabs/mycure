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
          q-btn(
            v-if="printEnabled"
            label="Print"
            color="primary"
            icon="las la-print"
            no-caps
            unelevated
            @click="onPrint"
          ).q-mr-sm
          q-btn(
            v-if="amendEnabled"
            label="Amendments"
            color="primary"
            no-caps
            unelevated
            @click="amendmentsDialog = true"
          )
          q-dialog(v-model="amendmentsDialog")
            q-card(style="width: 500px")
              q-toolbar
                q-toolbar-title Amendments
                q-space
                q-btn(
                  icon="las la-times"
                  round
                  flat
                  @click="amendmentsDialog = false"
                )
              q-separator
              q-card-section.q-pa-none
                q-list(separator)
                  template(v-for="history in amendments")
                    q-item(clickable)
                      q-item-section
                        q-item-label(subtitle) {{history.creationDate}}
                        q-item-label {{history.creatorName}}
        //- NOTE: Bring back when we have more ways to edit the report
        //- q-toolbar
          q-tabs(
            v-model="tabModel"
            indicator-color="primary"
          )
            //- q-tab(
            //-   name="live"
            //-   label="Live Edit Mode"
            //-   icon="la la-pen"
            //-   no-caps
            //- )
            //- q-tab(
            //-   name="focused"
            //-   label="Focused Mode"
            //-   icon="la la-bullseye"
            //-   no-caps
            //- )
            //- q-tab(
            //-   name="signatories"
            //-   label="Signatories"
            //-   icon="las la-signature"
            //-   no-caps
            //-   :disable="!hasEncounterApeReport"
            //- )
        q-separator
        q-card-section
          q-tab-panels(v-model="tabModel" animated)
            q-tab-panel(name="live")
              div.row.justify-center.q-mb-sm
                search-form-templates(
                  ref="searchFormTemplatesRef"
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
                    :diagnostic-orders="encounterDiagnosticOrders"
                  )
              div.row.items-top.q-mt-md
                div.col-xs-12
                  h1.text-primary.text-h6 Signatories
                div.col-xs-12.col-md-6.q-py-sm
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

                div.col-xs-12.col-md-6.q-py-sm
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
                div.col-xs-12.col-md-6.q-py-sm
                  span.block Processed By:
                  span.text-weight-medium.block {{createdByNameFormatted || '-'}}
                div.col-xs-12.col-md-6.q-py-sm
                  span.block Finalized By:
                  span.text-weight-medium.block {{finalizedByNameFormatted || '-'}}
            //- q-tab-panel(name="focused")
              //- ape-report-viewer(
              //-   view="form"
              //-   :ape-report="encounterApeReport"
              //-   :patient="encounterPatient"
              //-   :encounter="encounter"
              //-   :medical-records="encounterMedicalRecords"
              //-   :facility="encounterFacility"
              //- )
            //- q-tab-panel(name="signatories")
            //-   div.row.items-top
            //-     div.col-xs-12.col-md-6.q-pa-sm
            //-       span.block Medical Examiner:
            //-       div(v-if="isEditingExaminer").row.items-center
            //-         div.col-grow
            //-           search-members(
            //-             label="Medical Examiner"
            //-             autofocus
            //-             :roles="medicalExaminerRoles"
            //-             @select="v => selectedExaminer = v"
            //-           )
            //-         div
            //-           q-btn(
            //-             @click="isEditingExaminer = false"
            //-             icon="las la-times"
            //-             color="negative"
            //-             round
            //-             flat
            //-           ).q-ml-sm
            //-       div(v-else).row.items-center.justify-between
            //-         span.text-weight-medium.block {{examinerNameFormatted || '-'}}
            //-         q-btn(
            //-           icon="las la-edit"
            //-           color="primary"
            //-           round
            //-           flat
            //-           @click="isEditingExaminer = true"
            //-         )

            //-     div.col-xs-12.col-md-6.q-pa-sm
            //-       span.block Evaluated By:
            //-       div(v-if="isEditingEvaluator").row.items-center
            //-         div.col-grow
            //-           search-members(
            //-             label="Evaluated By"
            //-             autofocus
            //-             :roles="evaluatorRoles"
            //-             @select="v => selectedReviewer = v"
            //-           )
            //-         div
            //-           q-btn(
            //-             @click="isEditingEvaluator = false"
            //-             icon="las la-times"
            //-             color="negative"
            //-             round
            //-             flat
            //-           ).q-ml-sm
            //-       div(v-else).row.items-center.justify-between
            //-         span.text-weight-medium.block {{reviewerNameFormatted || '-'}}
            //-         q-btn(
            //-           icon="las la-edit"
            //-           color="primary"
            //-           round
            //-           flat
            //-           @click="isEditingEvaluator = true"
            //-         )
            //-     div.col-xs-12.col-md-6.q-pa-sm
            //-       span.block Processed By:
            //-       span.text-weight-medium.block {{createdByNameFormatted || '-'}}
            //-     div.col-xs-12.col-md-6.q-pa-sm
            //-       span.block Finalized By:
            //-       span.text-weight-medium.block {{finalizedByNameFormatted || '-'}}
  //- div.row.items-center.justify-center.q-mb-lg
    div.col-xs-12.col-md-10.q-mb-md
      span.text-h3.text-primary Past Encounters
    div.col-xs-12.col-md-10
      q-card.shadow-1
        q-card-section
q-footer(
  bordered
).bg-white
  q-toolbar
    q-btn(
      v-if="deleteAllowed"
      label="Delete Report"
      color="negative"
      icon="las la-trash"
      unelevated
      outline
      no-caps
      @click="onDeleteReport"
    ).q-mr-sm
    q-space
    q-btn(
      v-if="forCheckingAllowed"
      label="For Checking"
      icon="las la-arrow-up"
      color="warning"
      unelevated
      no-caps
      @click="onForChecking"
    ).q-mr-sm
    q-btn(
      v-if="finalizedAllowed"
      label="Finalize"
      color="positive"
      icon="las la-check"
      unelevated
      no-caps
      @click="onFinalize"
    ).q-mr-sm
    q-btn(
      label="Save Report"
      icon="las la-save"
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
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/current-user';
import { useQuasarMixins } from '@/composables/quasar-mixins';
import { formatDoctorName as formatDoctorNameUtil } from '@/utils';
import { getAmendments } from '@/services/medical-records';

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
    const tabModel = ref('live');
    const router = useRouter();
    const focusedModeModel = ref({});
    const searchFormTemplatesRef = ref(null);
    const focusedModeFormRef = ref(null);
    const apeReportFieldsModel = ref({});
    const userStore = useUserStore();
    const apeReportViewerLiveEditRef = ref(null);
    const { pmeEncounterStatusMapper } = usePmeHelper();
    const { confirm, showSnack } = useQuasarMixins();

    const currentUser = computed(() => userStore.$state.user);
    const currentUserMembership = computed(() => userStore.$state.userActiveMembership);
    const currentUserRoles = computed(() => {
      const roles = currentUserMembership.value?.roles || [];
      return {
        isSuperAdmin: currentUserMembership.value?.superadmin,
        isPMEStaff: roles.filter(s => s === 'pme_staff').length !== 0,
        isPMESHead: roles.filter(s => s === 'pme_head').length !== 0,
        isPMEDoctor: roles.filter(s => s === 'doctor_pme').length !== 0,
      };
    });

    const encounter = ref({});
    const encounterId = route.params.encounter;
    const encounterApeReport = ref({});
    const encounterFacility = ref({});
    const encounterMedicalRecords = ref([]);
    const encounterPatient = ref({});
    const encounterDiagnosticOrders = ref([]);

    const hasEncounterApeReport = computed(() => {
      return encounterApeReport.value?.id;
    });
    const encounterApeReportId = computed(() => {
      return encounterApeReport.value?.id;
    });

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

    const deleteAllowed = computed(() => {
      const isRoleAllowed = currentUserRoles.value?.isPMESHead ||
        currentUserRoles.value?.isPMEDoctor ||
        currentUserRoles.value?.isSuperAdmin;
      return encounterApeReport.value?.id && isRoleAllowed;
    });

    const forCheckingAllowed = computed(() => {
      return ['classifying'].includes(apeReportStatus.value?.value) &&
        (currentUserRoles.value?.isPMEStaff || currentUserRoles.value?.isPMESHead ||
        currentUserRoles.value?.isPMEDoctor || currentUserRoles.value?.isSuperAdmin);
    });

    const finalizedAllowed = computed(() => {
      return ['classifying', 'checking'].includes(apeReportStatus.value?.value) &&
        (currentUserRoles.value?.isPMEStaff || currentUserRoles.value?.isPMESHead ||
        currentUserRoles.value?.isPMEDoctor || currentUserRoles.value?.isSuperAdmin);
    });

    const readOnly = computed(() => {
      return apeReportStatus.value?.value?.type === 'pending' ||
        (apeReportStatus.value?.value?.type === 'completed' && !amendEnabled.value) ||
        (!currentUserRoles.value?.isPMEStaff && !currentUserRoles.value?.isPMESHead &&
        !currentUserRoles.value?.isPMEDoctor && !currentUserRoles.value?.isSuperAdmin);
    });

    // WATCHERS
    watch(selectedExaminer, async (val) => {
      if (!val?.uid) return;
      if (!encounterApeReport.value?.id) return;
      await sdk.service('medical-records').update(encounterApeReport.value?.id, { examinedBy: val?.uid });
      showSnack({
        color: 'positive',
        message: 'Examiner saved',
      });
      isEditingExaminer.value = false;
    });

    watch(selectedReviewer, async (val) => {
      if (!val?.uid) return;
      if (!encounterApeReport.value?.id) return;
      await sdk.service('medical-records').update(encounterApeReport.value?.id, { reviewedBy: val?.uid });
      showSnack({
        color: 'positive',
        message: 'Reviewer saved',
      });
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

    // METHODS
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

        fetchAmendments();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    async function onSaveReport (status) {
      try {
        loading.value = true;
        const payload = {};

        const result = apeReportViewerLiveEditRef.value?.onSaveReport(); // returns the saved template { values, template }
        const values = result?.values;
        const template = result?.template;
        const report = result?.report;

        payload.values = values;
        payload.template = template;
        payload.report = report;

        if (!values || !template) {
          showSnack({
            message: 'You cannot save a blank report',
            color: 'warning',
          });
          return;
        }

        if (status === 'completed' && !template) {
          showSnack({
            message: 'You cannot finalize a blank report',
            color: 'warning',
          });
          return;
        }

        const existing = await getPmeEncounter({ id: encounterId });

        console.warn('existing', existing?.apeReport);

        if (existing?.apeReport?.id) {
          if (status === 'done') payload.done = true;
          if (status === 'classified') payload.classify = true;
          if (status === 'completed') payload.finalize = true;
          await sdk.service('medical-records').update(encounterApeReport.value?.id, payload);
        } else {
          // TODO: Perform copying of value from medical records to
          // encounter ape report values
          console.warn('payload: create', payload);
          payload.type = 'ape-report';
          payload.encounter = encounter.value?.id;
          payload.patient = encounter?.value?.patient;
          await sdk.service('medical-records').create(payload);
        }

        showSnack({
          color: 'positive',
          message: 'Success',
        });

        init();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    async function onTemplateSelect (template) {
      if (!template) return;
      encounterApeReport.value.templateData = template;
      console.warn('encounterApeReport.value.templateData', encounterApeReport.value.templateData);
    }

    async function onDeleteReport () {
      try {
        const result = await confirm({
          title: 'Delete this encounter?',
          message: 'Are you sure you want to delete this encounter? This action is irreversible.',
        });
        if (!result) return;
        loading.value = true;
        await sdk.service('medical-records').remove(encounterId?.value);
        showSnack({
          color: 'positive',
          message: 'Report delete successfully',
        });
        searchFormTemplatesRef.value?.onReset();
        init();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    async function onForChecking () {
      const result = await confirm({
        title: 'Update report?',
        message: 'Mark report as "For Checking"?',
      });
      if (!result) return;
      await onSaveReport();
      await onSaveReport('classified');
    }

    async function onFinalize () {
      const result = await confirm({
        title: 'Finalized report?',
        message: 'Mark report as "Finalized"?',
      });
      if (!result) return;
      await onSaveReport();
      await onSaveReport('completed');
    }

    async function onDone () {
      const result = await confirm({
        title: 'Update report?',
        message: 'Mark report as "Done"?',
      });
      if (!result) return;
      await onSaveReport();
      await onSaveReport('classified');
    }

    function formatDoctorName (personalDetails) {
      return formatDoctorNameUtil(personalDetails);
    }

    init();

    // New convensions
    const amendmentsDialog = ref(false);
    const amendEnabled = computed(() => {
      return apeReportStatus.value?.value === 'completed' &&
        (currentUserRoles.value?.isPMESHead || currentUserRoles.value?.isSuperAdmin);
    });
    const amendments = ref([]);
    async function fetchAmendments () {
      const items = await getAmendments({ id: encounterApeReportId.value });
      amendments.value = items || [];
    }

    // Print
    const printEnabled = computed(() => {
      return apeReportStatus.value?.value === 'completed';
    });

    function onPrint () {
      router.push({
        name: 'print-pme-report',
        params: {
          encounter: encounterId,
        },
      });
    }

    return {
      amendEnabled,
      amendments,
      amendmentsDialog,
      apeReportCreatedAt,
      apeReportFieldsModel,
      apeReportStatus,
      apeReportViewerLiveEditRef,
      createdByNameFormatted,
      currentUser,
      deleteAllowed,
      encounter,
      encounterApeReport,
      encounterFacility,
      encounterMedicalRecords,
      encounterPatient,
      encounterDiagnosticOrders,
      evaluatorRoles,
      examinerNameFormatted,
      finalizedAllowed,
      finalizedByNameFormatted,
      focusedModeFormRef,
      focusedModeModel,
      forCheckingAllowed,
      formTemplate,
      hasEncounterApeReport,
      isEditingEvaluator,
      isEditingExaminer,
      loading,
      medicalExaminerRoles,
      printEnabled,
      readOnly,
      reviewerNameFormatted,
      searchFormTemplatesRef,
      selectedExaminer,
      selectedReviewer,
      tabModel,
      //
      onDeleteReport,
      onDone,
      onFinalize,
      onForChecking,
      onPrint,
      onSaveReport,
      onTemplateSelect,
    };
  },
};
</script>
