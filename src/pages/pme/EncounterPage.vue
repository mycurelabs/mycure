<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="loading"
)
  div.row.items-center.justify-center
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
              div.row.justify-center
                q-scroll-area(style="height: 100vh; width: 1100px; margin-top: 0px; padding-top: 0px; border: 1px solid lightgrey; border-radius: 5px;")
                  ape-report-viewer(
                    view="paper"
                    :ape-report="encounterApeReport"
                    :encounter="encounter"
                    :facility="encounterFacility"
                    :medical-records="encounterMedicalRecords"
                    :patient="encounterPatient"
                  )
            q-tab-panel(name="focused")
              //- ape-report-viewer(
              //-   view="form"
              //-   :ape-report="encounterApeReport"
              //-   :patient="encounterPatient"
              //-   :encounter="encounter"
              //-   :medical-records="encounterMedicalRecords"
              //-   :facility="encounterFacility"
              //- )
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
import { format } from 'date-fns';
import { getPmeEncounter } from '@/services/pme';
import { sdk } from '@/boot/mycure';
import { useRoute } from 'vue-router';

import ApeReportViewer from '@/components/pme/ApeReportViewer';
import GenericPage from '@/components/commons/GenericPage';
import usePmeHelper from '@/composables/pme-helpers';

export default {
  components: {
    ApeReportViewer,
    GenericPage,
  },
  setup () {
    const loading = ref(false);
    const route = useRoute();
    const tabModel = ref('live');
    const focusedModeModel = ref({});
    const focusedModeFormRef = ref(null);
    const apeReportFieldsModel = ref({});
    const { pmeEncounterStatusMapper } = usePmeHelper();

    const encounter = ref({});
    const encounterApeReport = ref({});
    const encounterFacility = ref({});
    const encounterMedicalRecords = ref([]);
    const encounterPatient = ref({});

    const apeReportCreatedAt = computed(() => format(encounterApeReport.value?.createdAt || new Date(), 'MMM dd, yyyy'));
    const apeReportStatus = computed(() => pmeEncounterStatusMapper(encounter));

    const encounterId = route.params.encounter;

    async function init () {
      try {
        loading.value = true;
        const result = await getPmeEncounter({ id: encounterId });
        console.warn('result', result);
        encounter.value = result.encounter;
        encounterApeReport.value = result.apeReport;
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
        // const values = encounterApeReport.value?.values || [];
        const payload = {};

        if (tabModel.value === 'focused') {
          // if (!await focusedModeFormRef.value.validate()) return;

          // payload.values = values.map(value => {
          //   const id = value?.id;
          //   const elem = focusedModeModel?.value?.[id];
          //   if (elem) return { id, answer: elem };
          //   return value;
          // });

          // const normalObject = Object.assign({}, payload);

          // console.warn('payload', normalObject);
        }

        if (tabModel.value === 'live') {
          //
        }

        await sdk.service('medical-records').update(encounterApeReport.value.id, Object.assign({}, payload));
        init();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    init();

    return {
      apeReportCreatedAt,
      apeReportFieldsModel,
      apeReportStatus,
      encounter,
      encounterApeReport,
      encounterFacility,
      encounterMedicalRecords,
      encounterPatient,
      focusedModeFormRef,
      focusedModeModel,
      loading,
      tabModel,
      onSaveReport,
    };
  },
};
</script>
