<template lang="pug">
q-header(bordered).text-black.bg-white
  q-toolbar
    q-btn(
      icon="la la-arrow-left"
      dense
      flat
      round
      @click="goBack"
    )
    q-toolbar-title {{isUpdating ? 'Update' : 'Create'}} Group Report

q-drawer(
  v-model="leftDrawer"
  side="left"
  show-if-above
  bordered
  :width="400"
)
  div.row
    div.col-xs-12.q-pa-md
      span.text-subtitle1 Package Details
    div.col-xs-12.q-pa-md
      q-form(ref="mainFormRef")
        q-input(
          v-model="contractLabel"
          label="Label"
          outlined
          readonly
        ).q-mb-md
        q-input(
          v-model="contractInsurerName"
          label="Company"
          outlined
          readonly
        ).q-mb-md
        q-input(
          v-model="contractStartDate"
          label="Date"
          outlined
          readonly
        ).q-mb-md
        q-input(
          v-model="contractExpiryDate"
          label="Select Package"
          outlined
          readonly
        ).q-mb-md

q-toolbar.bg-white
  q-space
  q-tabs(
    v-model="selectedTab"
    indicator-color="primary"
    active-color="primary"
    no-caps
    inline-label
  )
    q-tab(name="patients" icon="la la-user-injured" label="Patients")
    q-tab(name="reports" icon="la la-clipboard" label="Reports")
  q-space

generic-page(
  skeleton="table"
  padding
  :loading="loading"
)
  q-tab-panels(
    v-model="selectedTab"
    animated
  )
    q-tab-panel(name="patients" style="padding: 1px;")
      q-table(
        v-model:pagination="pagination"
        ref="tableRef"
        color="primary"
        :columns="patientColumns"
        :dense="$q.screen.lt.md"
        :rows="patientRows"
        :loading="loading"
        :visible-columns="visiblePatientColumns"
      ).shadow-1
        //- Title
        template(v-slot:top-left)
          q-toolbar-title
            q-icon(
              size="25px"
              name="las la-users"
              style="margin-bottom: 5px;"
            ).text-primary.q-mr-sm
            span Patients

        //- Search and filter
        template(v-slot:top-right)
          q-btn(
            v-if="hasSelectedPatients"
            label="Generate AR"
            color="primary"
            unelevated
            no-caps
            @click="generateAr"
          )

        //- Table body
        template(v-slot:body="props")
          q-tr(:props="props" class="hover:bg-grey-3 cursor-pointer")
            q-td(key="checkbox" :props="props")
              q-checkbox(
                v-model="selectedPatients[props.row.id]"
                :disable="props.row.status.id !== 'done'"
              )
            q-td(key="id" :props="props")
              span {{props.row.id || '-'}}
            q-td(key="name" :props="props")
              span {{props.row.name || '-'}}
            q-td(key="date-of-birth" :props="props")
              span {{props.row.dateOfBirth}}
            q-td(key="sex" :props="props")
              span {{props.row.sex || '-'}}
            q-td(key="status" :props="props")
              q-badge(:color="props.row.status.color").q-mr-sm {{props.row.status.label}}

        //- No data
        template(v-slot:no-data)
          div(style="height: 200px").row.full-width.justify-center.items-center
            div.col-xs-12.text-center
              q-icon(name="la la-meh" size="60px").text-grey
              h2.text-grey.text-h6 No Patients

    q-tab-panel(name="reports" style="padding: 1px;")
      q-table(
        v-model:pagination="pagination"
        ref="tableRef"
        color="primary"
        :columns="reportColumns"
        :dense="$q.screen.lt.md"
        :rows="reportRows"
        :loading="loading"
        :visible-columns="visibleReportColumns"
        @isRowSelected="onReportRowSelect"
      ).shadow-1
        //- Title
        template(v-slot:top-left)
          q-toolbar-title
            q-icon(
              size="25px"
              name="las la-clipboard"
              style="margin-bottom: 5px;"
            ).text-primary.q-mr-sm
            span Reports

        //- Search and filter
        template(v-slot:top-right)

        //- Table body
        template(v-slot:body="props")
          q-tr(:props="props" class="hover:bg-grey-3 cursor-pointer" @click="onReportRowSelect(props.row)")
            q-td(key="id" :props="props")
              span {{props.row.id || '-'}}
            q-td(key="issue-date" :props="props")
              span {{props.row.issueDate || '-'}}
            q-td(key="patient-count" :props="props")
              span {{props.row.patientCount || '-'}}

        //- No data
        template(v-slot:no-data)
          div(style="height: 200px").row.full-width.justify-center.items-center
            div.col-xs-12.text-center
              q-icon(name="la la-meh" size="60px").text-grey
              h2.text-grey.text-h6 No Reports

//- DIALOGS
q-dialog(v-model="selectedReportDialog" persistent)
  q-card(style="width: 1100px; max-width: 80vw;")
    q-toolbar
      q-toolbar-title Encounters for {{selectedReport.id}}
      q-space
      q-btn(
        icon="la la-times"
        round
        flat
        @click="selectedReportDialog = false"
      )
    q-separator
    q-card-section
      table(style="width: 100%;")
        thead
          tr(align="left")
            th PID
            th Patient
            th Exam Type
            th Package
            th
        tbody
          template(v-for="encounter in selectedReport.encounters")
            tr(style="padding: 10px;")
              td {{encounter.patientId}}
              td {{encounter.patientName}}
              td {{encounter.examType}}
              td {{encounter.package}}
              td(align="right")
                q-btn(
                  v-if="encounter.encounterId"
                  label="View Encounter"
                  color="primary"
                  flat
                  no-caps
                  @click="viewReportEncounter(encounter)"
                )
</template>

<script>
import { generateId } from '@/utils';
import { format, isWithinInterval } from 'date-fns';
import { getInsuranceContracts } from '@/services/insurance-contracts';
import { onMounted, ref, computed } from 'vue';
import { TABLE_ROWS_PER_PAGE_OPTION } from '@/constants/global';
import { useHelpers } from '@/composables/helpers';
import { useQuasarMixins } from '@/composables/quasar-mixins';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/current-user';
import { groupBy, size } from 'lodash';
import GenericPage from '@/components/commons/GenericPage';
import mycure from 'src/boot/mycure';

export default {
  components: {
    GenericPage,
  },
  setup () {
    const { showSnack, confirm } = useQuasarMixins();
    const { tableColumnBuilder } = useHelpers();
    const route = useRoute();
    const router = useRouter();
    const insurerId = route.params.insurer;
    const label = route.query.label;
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);
    const contractData = computed(() => insuranceContracts.value?.[0] || {});
    const contractExpiryDate = computed(() => format(contractData.value.expiresAt || new Date(), 'MMM dd, yyyy'));
    const contractInsurerName = computed(() => contractData.value.insurerOrg?.name);
    const contractLabel = label;
    const contractStartDate = computed(() => format(contractData.value.startAt || new Date(), 'MMM dd, yyyy'));
    const initializing = ref(false);
    const insuranceContracts = ref([]);
    const leftDrawer = ref(false);
    const loading = ref(false);
    const rowsPerPageOption = ref(TABLE_ROWS_PER_PAGE_OPTION);
    const searchText = ref('');
    const selectedPatients = ref({});
    const selectedReport = ref({});
    const selectedReportDialog = ref(false);
    const selectedTab = ref('patients');
    const tableRef = ref(null);
    const totalItems = ref(0);
    const userStore = useUserStore();
    const pagination = ref({
      page: 0,
      rowsPerPage: rowsPerPageOption.value[0],
      rowsNumber: 0,
    });
    const hasSelectedPatients = computed(() => {
      const values = Object.values(selectedPatients.value);
      return values.some(value => value);
    });

    const isUpdating = computed(() => {
      return !!insurerId;
    });

    const patientRows = computed(() => insuranceContracts.value.map(contract => {
      const patient = contract?.insured || {};
      const name = patient.name || {};
      const dateOfBirth = patient.dateOfBirth ? format(patient.dateOfBirth, 'MMM dd, yyyy') : '-';
      const sex = patient.sex || '';
      const status = getStatus(contract);
      selectedPatients.value[patient.id] = false;
      return {
        id: patient.id,
        name: `${name.lastName}, ${name.firstName}`,
        dateOfBirth,
        sex: `${sex.charAt(0).toUpperCase()}${sex.substring(1, sex.length)}`,
        status,
        $data: contract,
      };
    }));
    const patientColumns = tableColumnBuilder([
      {
        name: 'checkbox',
        label: 'Select',
        style: 'max-width: 50px; white-space: normal;',
      },
      {
        name: 'id',
        field: 'id',
        label: 'Id',
      },
      {
        name: 'name',
        field: 'name',
        label: 'Name',
      },
      {
        name: 'date-of-birth',
        field: 'dateOfBirth',
        label: 'Birthday',
      },
      {
        name: 'sex',
        field: 'sex',
        label: 'Sex',
      },
      {
        name: 'status',
        field: 'status',
        label: 'Status',
      },
    ]);
    const visiblePatientColumns = ref(patientColumns.map(column => column.name));

    const reportRows = computed(() => {
      const reports = [];
      const apeReports = insuranceContracts.value.flatMap(item => item.apeReports);
      const apeReportsGrouped = groupBy(apeReports, 'deliveryAcknowldgement');
      for (const key in apeReportsGrouped) {
        const apeReports = apeReportsGrouped[key];
        const firstReport = apeReports?.[0] || {};
        const item = {
          id: key,
          issueDate: format(firstReport.deliveredAt, 'MMM dd, yyyy'),
          patientCount: size(apeReports.filter(report => report.deliveryAcknowldgement === key)),
        };
        reports.push(item);
      }
      return reports;
    });
    const reportColumns = tableColumnBuilder([
      {
        name: 'id',
        field: 'id',
        label: 'Id',
      },
      {
        name: 'issue-date',
        field: 'issueDate',
        label: 'Issue Date',
      },
      {
        name: 'patient-count',
        field: 'patientCount',
        label: 'Patient Count',
      },
    ]);
    const visibleReportColumns = ref(reportColumns.map(column => column.name));

    async function init () {
      try {
        loading.value = true;
        const query = {
          insurer: insurerId,
          label,
          facility: activeOrganization.value.id,
        };
        const { total, items } = await getInsuranceContracts(query);
        console.warn(total, items);
        insuranceContracts.value = items;
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    async function generateAr () {
      try {
        const result = await confirm({
          title: 'Confirm',
          message: 'Do you want to generate a report?',
        });
        if (!result) return;
        loading.value = true;
        const selectedPatientsIds = Object.keys(selectedPatients.value);
        const selectedContracts = patientRows.value?.filter(item => selectedPatientsIds.includes(item.id));
        const apeReports = selectedContracts.flatMap(contract => contract.apeReports);
        const apeReportsIds = apeReports?.map(report => report.id);
        const payload = {
          deliveryAcknowldgement: generateId(),
          deliveredAt: Date.now(),
        };
        await mycure.service('medical-records').update({ id: { $in: apeReportsIds } }, payload);
        showSnack({
          message: 'Success!',
          color: 'positive',
        });
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    function getStatus (contract) {
      // delivered
      const status = {
        id: 'delivered',
        color: 'green',
        label: 'Delivered',
      };

      // Encounter within date range of contract
      const hasApeEncounter = contract?.latestEncounter?.createdAt
        ? isWithinInterval(contract.latestEncounter.createdAt, {
          start: contract.startAt,
          end: contract.expiresAt,
        })
        : false;

      const apeReport = contract?.apeReports?.length
        ? contract.apeReports.find(report => {
          if (!report.finalizedAt) return false;
          return isWithinInterval(new Date(report.finalizedAt), {
            start: contract.startAt,
            end: contract.expiresAt,
          });
        })
        : [];

      if (!hasApeEncounter || !apeReport) {
        // 'in-progress';
        status.id = 'in-progress';
        status.label = 'In Progress';
        status.color = 'warning';
        return status;
      }
      /**
       * According to old code 'deliveryAcknowldgement'
       * is a known typo in the schema
       */
      if (!apeReport?.deliveryAcknowldgement) {
        // done
        status.id = 'done';
        status.label = 'Done';
        status.color = 'positive';
        return status;
      }

      return status;
    }

    function onReportRowSelect (row) {
      const id = row.id;
      const contracts = insuranceContracts.value.filter(contract => {
        const apeReports = contract.apeReports;
        return apeReports.some(report => report.deliveryAcknowldgement === id);
      });
      const encounters = contracts.map(contract => {
        const patient = contract.insured || {};
        const patientName = patient.name || {};
        const latestEncounter = contract.latestEncounter || {};
        const latestEncounterTags = latestEncounter.tags || [];
        return {
          encounterId: latestEncounter.id,
          patientId: patient.id || '-',
          patientName: `${patientName.lastName}, ${patientName.firstName}`,
          examType: latestEncounterTags.join(', ') || '-',
          package: latestEncounter.invoice?.$populated?.peItem?.$populated?.service?.name || '-',
        };
      });
      selectedReport.value = {
        id,
        encounters,
      };
      selectedReportDialog.value = true;
    }

    function viewReportEncounter (encounter) {
      router.push({
        name: 'pme-encounter',
        params: {
          encounter: encounter.encounterId,
        },
        query: {
          patient: encounter.patientId,
        },
      });
    }

    function goBack () {
      router.push({ name: 'pme-group-packages' });
    }

    onMounted(() => init());

    return {
      contractExpiryDate,
      contractInsurerName,
      contractLabel,
      contractStartDate,
      hasSelectedPatients,
      initializing,
      isUpdating,
      leftDrawer,
      loading,
      pagination,
      patientColumns,
      patientRows,
      reportColumns,
      reportRows,
      searchText,
      selectedPatients,
      selectedReport,
      selectedReportDialog,
      selectedTab,
      tableRef,
      totalItems,
      visiblePatientColumns,
      visibleReportColumns,
      //
      generateAr,
      goBack,
      viewReportEncounter,
      onReportRowSelect,
    };
  },
};
</script>
