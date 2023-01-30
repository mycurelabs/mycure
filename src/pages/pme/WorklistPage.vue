<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="initializing"
)
  q-card
    q-toolbar.q-gutter-x-sm
      q-toolbar-title APE Reports
      search-patients
    q-separator
    div.row.now-wrap.q-pa-sm.q-gutter-sm
      date-filter(
        v-model="filters.filterDate"
        label="Filter Exam Types"
        style="min-width: 200px"
        color="primary"
        dropdown-icon="la la-angle-down"
        dense
        outlined
      )
      q-select(
        v-model="filters.filterExamType"
        label="Filter Exam Types"
        style="min-width: 200px"
        color="primary"
        dropdown-icon="la la-angle-down"
        dense
        outlined
        :options="pmeEncounterExamTypes"
      )
      q-select(
        v-model="filters.filterStatus"
        label="Filter Status"
        style="min-width: 200px"
        color="primary"
        dropdown-icon="la la-angle-down"
        dense
        outlined
        :options="pmeEncounterStatuses"
      )
      q-select(
        v-model="filters.filterBranch"
        label="Filter Branch"
        style="min-width: 200px"
        color="primary"
        dropdown-icon="la la-angle-down"
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
      :columns="columns"
      :dense="$q.screen.lt.md"
      :rows-per-page-options="rowsPerPageOption"
      :rows="rows"
      :loading="loading"
      @request="paginate"
    ).shadow-0
      template(v-slot:no-data)
        div(style="height: 200px").row.full-width.justify-center.items-center
          div.col-xs-12.text-center
            q-icon(name="la la-meh" size="60px").text-grey
            h2.text-grey.text-h6 No APE reports found

</template>

<script>
import { computed, onMounted, ref } from 'vue';
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
      pmeEncounterStatusMapper,
    } = usePmeHelpers();
    const pmeEncounterStatuses = PME_ENCOUNTER_STATUS_TYPES;
    const pmeEncounterExamTypes = PME_ENCOUNTER_EXAM_TYPES;
    const filters = ref({
      filterPatient: null,
      filterDate: null,
      filterStatus: null,
      filterExamType: null,
      filterBranch: null,
      filterPagination: null,
    });

    const columns = tableColumnBuilder([
      {
        name: 'name',
        field: 'name',
        label: 'Name',
        format: (val) => {
          return formatName(val, 'lastName, firstName');
        },
      },
      {
        name: 'date',
        field: 'date',
        label: 'Date',
        format: (val) => {
          return format(new Date(val), 'MM/dd/yy hh:mm a');
        },
      },
      {
        name: 'exam-type',
        field: 'examType',
        label: 'Exam Type',
        format: (val) => {
          if (!val?.length) return '-';
          return val.join(', ');
        },
      },
      {
        name: 'status',
        field: 'status',
        label: 'Status',
        format: (val) => {
          return pmeEncounterStatusMapper(val);
        },
      },
      {
        name: 'package',
        field: 'package',
        label: 'Package',
      },
      {
        name: 'hmo',
        field: 'hmo',
        label: 'HMO',
      },
      {
        name: 'tags',
        field: 'tags',
        label: 'Tags',
      },
    ]);

    const rows = computed(() => {
      if (!pmeEncounters.value?.length) return [];
      return pmeEncounters.value.map(item => {
        // const name = formatName(item.patient?.name);
        // const date = format(new Date(item.createdAt), 'MM/dd/yy hh:mm a');
        return {
          name: item.patient?.name,
          date: item.createdAt,
          examType: item.tags,
          status: item,
          package: 'package',
          hmo: 'hml',
          tags: 'asf',
        };
      });
    });

    const pagination = ref({
      page: 0,
      rowsPerPage: rowsPerPageOption.value[0],
      rowsNumber: 0,
    });

    async function init ({ page, rowsPerPage }) {
      try {
        loading.value = true;
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
