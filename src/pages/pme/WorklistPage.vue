<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="initializing"
)
  q-card.shadow-1
    //- q-toolbar.q-gutter-x-sm
    q-toolbar.q-pa-sm
      q-toolbar-title
        q-icon(
          size="25px"
          name="las la-clipboard"
          style="margin-bottom: 5px;"
        ).text-primary.q-mr-sm
        span APE Reports
      search-patients.q-mr-sm
      q-btn(
        label="Filters"
        color="primary"
        icon="la la-filter"
        no-caps
        outline
      )
    //- q-separator
    //- div.row.now-wrap.q-pa-sm
      q-space
      date-filter(
        v-model="filters.filterDate"
        label="Filter Exam Types"
        style="min-width: 250px"
        color="primary"
        dropdown-icon="la la-angle-down"
        dense
        outlined
      ).q-mr-sm
      q-select(
        v-model="filters.filterExamType"
        label="Filter Exam Types"
        style="min-width: 250px"
        color="primary"
        dropdown-icon="la la-angle-down"
        clear-icon="la la-times"
        clearable
        dense
        outlined
        :options="pmeEncounterExamTypes"
      ).q-mr-sm
      q-select(
        v-model="filters.filterStatus"
        label="Filter Status"
        style="min-width: 250px"
        color="primary"
        dropdown-icon="la la-angle-down"
        clear-icon="la la-times"
        clearable
        dense
        outlined
        :options="pmeEncounterStatuses"
      ).q-mr-sm
      q-select(
        v-model="filters.filterBranch"
        label="Filter Branch"
        style="min-width: 250px"
        color="primary"
        dropdown-icon="la la-angle-down"
        clear-icon="la la-times"
        clearable
        dense
        outlined
        :options="activeOrganizationBranches"
      )
    q-separator
    q-table(
      v-model:pagination="pagination"
      ref="tableRef"
      icon-first-page="la la-angle-double-left"
      icon-last-page="la la-angle-double-right"
      icon-next-page="la la-angle-right"
      icon-prev-page="la la-angle-left"
      row-key="status"
      :columns="columns"
      :dense="$q.screen.lt.md"
      :rows-per-page-options="rowsPerPageOption"
      :rows="rows"
      :loading="loading"
      @request="paginate"
    ).shadow-0
      template(v-slot:body-cell-status="props")
        q-td(key="status" :props="props")
          template(v-for="status in props.row.status")
            q-badge(:color="status.color").q-mr-sm {{status.label}}
      template(v-slot:body-cell-exam-type="props")
        q-td(key="exam-type" :props="props")
          div.ellipsis-2-lines {{props.row.examType}}
            q-tooltip {{props.row.examType}}
      template(v-slot:body-cell-package="props")
        q-td(key="package" :props="props")
          div.ellipsis-2-lines {{props.row.package}}
            q-tooltip {{props.row.package}}
      template(v-slot:no-data)
        div(style="height: 200px").row.full-width.justify-center.items-center
          div.col-xs-12.text-center
            q-icon(name="la la-meh" size="60px").text-grey
            h2.text-grey.text-h6 No APE reports found
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue';
import { format } from 'date-fns';
import { TABLE_ROWS_PER_PAGE_OPTION } from '@/constants/global';
import { useHelpers } from '@/composables/helpers';
import { usePmeStore } from '@/stores/pme';
import { useUserStore } from '@/stores/current-user';
import DateFilter from '@/components/commons/filters/DateFilter';
import GenericPage from '@/components/commons/GenericPage';
import SearchPatients from '@/components/commons/search/SearchPatients';
import usePmeHelpers from '@/composables/pme-helpers';

export default {
  components: {
    DateFilter,
    GenericPage,
    SearchPatients,
  },
  setup () {
    const pmeStore = usePmeStore();
    const initializing = ref(false);
    const loading = ref(false);
    const userStore = useUserStore();
    const { formatName, tableColumnBuilder } = useHelpers();
    const pmeEncounters = computed(() => pmeStore.$state.pmeEncounters);
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);
    const totalItems = ref(0);
    const rowsPerPageOption = ref(TABLE_ROWS_PER_PAGE_OPTION);
    const tableRef = ref(null);
    const activeOrganizationBranches = computed(() => userStore.$state.userActiveOrganizationBranches?.map(branch => ({ value: branch.id, label: branch.name })));
    const {
      PME_ENCOUNTER_EXAM_TYPES,
      PME_ENCOUNTER_STATUS_TYPES,
      pmeEncounterStatusQueryBuilder,
      pmeWorklistMapper,
    } = usePmeHelpers();
    const pmeEncounterStatuses = PME_ENCOUNTER_STATUS_TYPES;
    const pmeEncounterExamTypes = PME_ENCOUNTER_EXAM_TYPES;
    const filters = ref({
      filterPatient: null,
      filterDate: null,
      filterStatus: null,
      filterExamType: null,
      filterBranch: null,
    });

    const columns = tableColumnBuilder([
      {
        name: 'date',
        field: 'date',
        label: 'Date',
        format: (val) => {
          return format(new Date(val), 'MM/dd/yy hh:mm a');
        },
      },
      {
        name: 'name',
        field: 'name',
        label: 'Name',
        format: (val) => {
          return formatName(val, 'lastName, firstName');
        },
      },
      {
        name: 'exam-type',
        field: 'examType',
        label: 'Exam Type',
        // format: (val) => {
        //   if (!val?.length) return '-';
        //   return val.join(', ');
        // },
      },
      {
        name: 'package',
        field: 'package',
        label: 'Package',
        // format: (val) => {
        //   return val.map(item => item.name).join(', ');
        // },
      },
      {
        name: 'hmo',
        field: 'hmo',
        label: 'HMO',
        format: (val) => {
          return val.map(company => company.name)?.join(', ') || '-';
        },
      },
      {
        name: 'tags',
        field: 'tags',
        label: 'Tags',
        style: 'max-width: 150px; white-space: normal;',
        format: (val) => {
          return val?.join(', ') || '-';
        },
      },
      {
        name: 'status',
        field: 'status',
        label: 'Status',
        align: 'right',
        style: 'max-width: 190px; white-space: normal;',
      },
    ]);

    const rows = computed(() => {
      if (!pmeEncounters.value?.length) return [];
      return pmeEncounters.value.map(pmeWorklistMapper);
    });

    const pagination = ref({
      page: 0,
      rowsPerPage: rowsPerPageOption.value[0],
      rowsNumber: 0,
    });

    async function init (paginationOpts) {
      try {
        loading.value = true;
        const page = paginationOpts?.page || 1;
        const rowsPerPage = paginationOpts?.rowsPerPage || rowsPerPageOption.value[0];
        let query = {
          facility: activeOrganization.value.id,
          $limit: rowsPerPage,
          $skip: (page - 1) * rowsPerPage,
        };

        // Date Filter
        if (filters.value?.filterDate?.dates?.start) {
          const start = filters.value?.filterDate?.dates?.start;
          const end = filters.value?.filterDate?.dates?.end;
          query.createdAt = {
            $gte: start,
            $lte: end,
          };
        }

        // Status Filter
        if (filters.value?.filterStatus?.value) {
          const status = filters.value?.filterStatus?.value;
          const q = pmeEncounterStatusQueryBuilder(status, query);
          console.warn('q', q);
          query = q;
        }

        // Exam Type Filter
        if (filters.value?.filterExamType?.value) {
          query.tags = filters.value?.filterExamType?.value;
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

    function paginate (props) {
      const { page, rowsPerPage } = props.pagination;
      init({ page, rowsPerPage });
    }

    watch(filters, () => {
      init();
    }, { deep: true, immediate: false });

    onMounted(() => {
      tableRef.value.requestServerInteraction();
    });

    return {
      activeOrganizationBranches,
      columns,
      filters,
      initializing,
      loading,
      tableRef,
      pagination,
      pmeEncounterExamTypes,
      rowsPerPageOption,
      pmeEncounterStatuses,
      totalItems,
      rows,
      // methods
      init,
      paginate,
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
