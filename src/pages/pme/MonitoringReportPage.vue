<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="initializing"
)
  q-table(
    v-model:pagination="pagination"
    ref="tableRef"
    icon-first-page="la la-angle-double-left"
    icon-last-page="la la-angle-double-right"
    icon-next-page="la la-angle-right"
    icon-prev-page="la la-angle-left"
    row-key="status"
    color="primary"
    :columns="columns"
    :dense="$q.screen.lt.md"
    :rows-per-page-options="rowsPerPageOption"
    :rows="rows"
    :loading="loading"
    :visible-columns="visibleColumns"
    @request="onPaginate"
    @isRowSelected="onRowSelect"
  ).shadow-1
    //- Title
    template(v-slot:top-left)
      q-toolbar-title
        q-icon(
          size="25px"
          name="las la-chart-bar"
          style="margin-bottom: 5px;"
        ).text-primary.q-mr-sm
        span Monitoring Report
    //- Search and filter
    template(v-slot:top-right)
      search-patients(@select="onPatientSelect").q-mr-sm
      worklist-table-filter-dialog(
        show-filter-date-by
        @filter="onFilter"
      )
      //- export-data(
      //-   :columns="columns"
      //-   :tags="['pme-monitoring-report']"
      //- )

    //- Table body
    template(v-slot:body="props")
      q-tr(:props="props" class="hover:bg-grey-3 cursor-pointer" @click="onRowSelect(props.row)")
        q-td(key="name" :props="props")
          div.row.no-wrap.items-center
            q-avatar(size="22px" color="grey").q-mr-sm
              q-img(v-if="getPicURL(props.row)" :src="getPicURL(props.row)")
              q-icon(v-else name="la la-user-alt" size="22px").text-white
            span {{props.row.name}}
        q-td(key="company" :props="props")
          span {{props.row.company || '-'}}
        q-td(key="exam-type" :props="props")
          div.ellipsis-2-lines {{props.row.examType || '-'}}
            q-tooltip(v-if="props.row.examType") {{props.row.examType}}
        q-td(key="date-of-exam" :props="props")
          span {{props.row.dateOfExam || '-'}}
        q-td(key="due-date" :props="props")
          span {{props.row.dueDate || '-'}}
        q-td(key="release-date" :props="props")
          span {{props.row.releaseDate || '-'}}
        q-td(key="no-of-days" :props="props")
          span {{props.row.noOfDays || '-'}}
        q-td(key="lapses" :props="props")
          span {{props.row.lapses || '-'}}
        q-td(key="status" :props="props")
          template(v-for="status in props.row.status")
            q-badge(:color="status.color").q-mr-sm {{status.label}}
        q-td(key="clinic" :props="props")
          span {{props.row.clinic || '-'}}

    //- No data
    template(v-slot:no-data)
      div(style="height: 200px").row.full-width.justify-center.items-center
        div.col-xs-12.text-center
          q-icon(name="la la-meh" size="60px").text-grey
          h2.text-grey.text-h6 No APE reports found
</template>

<script>
import { computed, onMounted, ref } from 'vue';
import { TABLE_ROWS_PER_PAGE_OPTION } from '@/constants/global';
import { useHelpers } from '@/composables/helpers';
import { usePmeStore } from '@/stores/pme';
import { useUserStore } from '@/stores/current-user';
import DateFilter from '@/components/commons/filters/DateFilter';
import GenericPage from '@/components/commons/GenericPage';
import SearchPatients from '@/components/commons/search/SearchPatients';
import usePmeHelpers from '@/composables/pme-helpers';
import ExportData from '@/components/commons/ExportData';
import WorklistTableFilterDialog from '@/components/pme/WorklistTableFilterDialog';
import { useRouter } from 'vue-router';

export default {
  components: {
    DateFilter,
    GenericPage,
    SearchPatients,
    WorklistTableFilterDialog,
    ExportData,
  },
  setup () {
    // Helpers
    const router = useRouter();
    const { tableColumnBuilder } = useHelpers();
    const {
      pmeEncounterStatusQueryBuilder,
      monitoringReportMapper,
    } = usePmeHelpers();
    // Stores
    const pmeStore = usePmeStore();
    const userStore = useUserStore();
    // Refs
    const initializing = ref(false);
    const loading = ref(false);
    const tableRef = ref(null);
    const totalItems = ref(0);
    const selectedPatient = ref(null);
    const rowsPerPageOption = ref(TABLE_ROWS_PER_PAGE_OPTION);
    const pagination = ref({
      page: 0,
      rowsPerPage: rowsPerPageOption.value[0],
      rowsNumber: 0,
    });
    // Computed
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);
    const pmeEncounters = computed(() => pmeStore.$state.pmeEncounters);
    const rows = computed(() => {
      if (!pmeEncounters.value?.length) return [];
      return pmeEncounters.value.map(monitoringReportMapper);
    });

    const columns = tableColumnBuilder([
      {
        name: 'name',
        field: 'name',
        label: 'Name',
      },
      {
        name: 'company',
        field: 'company',
        label: 'Company',
      },
      {
        name: 'exam-type',
        field: 'examType',
        label: 'Exam Type',
      },
      {
        name: 'date-of-exam',
        field: 'dateOfExam',
        label: 'Date of Exam',
      },
      {
        name: 'due-date',
        field: 'dueDate',
        label: 'Due Date',
      },
      {
        name: 'release-date',
        field: 'releaseDate',
        label: 'Release Date',
      },
      {
        name: 'no-of-days',
        field: 'noOfDays',
        label: 'No. of Days',
      },
      {
        name: 'lapses',
        field: 'lapses',
        label: 'Lapses',
      },
      {
        name: 'status',
        field: 'status',
        label: 'Status',
        align: 'right',
        style: 'max-width: 190px; white-space: normal;',
      },
      {
        name: 'clinic',
        field: 'clinic',
        label: 'Clinic',
      },
    ]);

    const visibleColumns = ref(columns.map(column => column.name));

    async function init (paginationOpts, selectedFilters) {
      try {
        loading.value = true;
        const page = paginationOpts?.page || 1;
        const rowsPerPage = paginationOpts?.rowsPerPage || rowsPerPageOption.value[0];
        let query = {
          facility: activeOrganization.value.id,
          $limit: rowsPerPage,
          $skip: (page - 1) * rowsPerPage,
          APEReportFinalizedAt: { $exists: true },
        };

        // Selected patient
        if (selectedPatient.value) {
          query.patient = selectedPatient.value.id; ;
        }

        // Date Filter
        // if (selectedFilters?.filterDate?.dates?.start && !selectedFilters?.finalizationDateType) {
        //   const start = selectedFilters?.filterDate?.dates?.start;
        //   const end = selectedFilters?.filterDate?.dates?.end;
        //   query.createdAt = {
        //     $gte: start,
        //     $lte: end,
        //   };
        // }

        // Filter Date By
        if (selectedFilters?.finalizationDateType) {
          const start = selectedFilters?.filterDate?.dates?.start;
          const end = selectedFilters?.filterDate?.dates?.end;
          if (selectedFilters?.finalizationDateType === 'Date Release' && selectedFilters?.filterDate?.dates?.start) {
            query.APEReportFinalizedAt = {
              $gte: start,
              $lte: end,
            };
          } else if (selectedFilters?.filterDate?.dates?.start) {
            query.createdAt = {
              $gte: start,
              $lte: end,
            };
          }
        }

        // Status Filter
        if (selectedFilters?.filterStatus?.value) {
          const status = selectedFilters?.filterStatus?.value;
          const q = pmeEncounterStatusQueryBuilder(status, query);
          query = q;
        }

        // Exam Type Filter
        if (selectedFilters?.filterExamType?.value) {
          query.tags = selectedFilters?.filterExamType?.value;
        }

        const { total } = await pmeStore.getPmeEncounters(query);

        totalItems.value = total;
        pagination.value.page = page;
        pagination.value.rowsPerPage = rowsPerPage;
        pagination.value.rowsNumber = total;
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
        initializing.value = false;
      }
    }

    function getPicURL (row) {
      return row.$data?.patient?.picURL;
    }

    // Event functions
    function onPaginate (props) {
      const { page, rowsPerPage } = props.pagination;
      init({ page, rowsPerPage });
    }

    function onRowSelect (row) {
      console.warn('row', row);
      router.push({
        name: 'pme-encounter',
        params: {
          encounter: row.$data.id,
        },
        query: {
          patient: row.$data.patient.id,
        },
      });
    }

    function onPatientSelect (patient) {
      selectedPatient.value = patient;
      init();
    }

    function onFilter (filters) {
      init(null, filters);
    }

    onMounted(() => {
      tableRef.value.requestServerInteraction();
    });

    return {
      columns,
      initializing,
      loading,
      pagination,
      rows,
      rowsPerPageOption,
      tableRef,
      totalItems,
      visibleColumns,
      // methods
      init,
      getPicURL,
      onFilter,
      onPatientSelect,
      onPaginate,
      onRowSelect,
    };
  },
};
</script>

<style lang="css" scoped>
.wrap-content {
  word-wrap: break-word;
  white-space: normal !important;
  font-weight: bold;
}
</style>
