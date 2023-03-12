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
          name="las la-users"
          style="margin-bottom: 5px;"
        ).text-primary.q-mr-sm
        span Group Packages

    //- Search and filter
    template(v-slot:top-right)
      q-input(
        v-model="searchText"
        label="Search Company Name"
        style="min-width: 300px"
        clear-icon="las la-times"
        debounce="500"
        outlined
        dense
        use-input
        clearable
      ).q-mr-sm
        template(v-slot:loading)
          q-spinner(
            color="primary"
            size="20"
          )
        template(v-slot:prepend)
          q-icon(name="la la-search")

      q-btn(
        label="Add"
        color="primary"
        icon="la la-plus"
        outline
        no-caps
        :to="{ name: 'group-package-create' }"
      )

    //- Table body
    template(v-slot:body="props")
      q-tr(:props="props" class="hover:bg-grey-3 cursor-pointer" @click="onRowSelect(props.row)")
        q-td(key="company" :props="props")
          span {{props.row.company || '-'}}
        q-td(key="groups" :props="props")
          span {{props.row.groups || '-'}}
        q-td(key="status" :props="props")
          span {{props.row.completedTotal}}/{{props.row.statusTotal}}
        q-td(key="start-date" :props="props")
          span {{props.row.startDate || '-'}}
        q-td(key="end-date" :props="props")
          span {{props.row.endDate || '-'}}

    //- No data
    template(v-slot:no-data)
      div(style="height: 200px").row.full-width.justify-center.items-center
        div.col-xs-12.text-center
          q-icon(name="la la-meh" size="60px").text-grey
          h2.text-grey.text-h6 No Group Packages

</template>

<script>
import { computed, onMounted, ref } from 'vue';
import { format, isWithinInterval } from 'date-fns';
import { getInsuranceContracts } from '@/services/insurance-contracts';
import { size } from 'lodash';
import { TABLE_ROWS_PER_PAGE_OPTION } from '@/constants/global';
import { useHelpers } from '@/composables/helpers';
import { useRouter } from 'vue-router';
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
    // Helpers
    const router = useRouter();
    const { tableColumnBuilder } = useHelpers();
    const {
      groupPackageMapper,
    } = usePmeHelpers();
    // Stores
    const userStore = useUserStore();
    // Refs
    const initializing = ref(false);
    const loading = ref(false);
    const rowsPerPageOption = ref(TABLE_ROWS_PER_PAGE_OPTION);
    const searchText = ref('');
    const tableRef = ref(null);
    const totalItems = ref(0);
    const pagination = ref({
      page: 0,
      rowsPerPage: rowsPerPageOption.value[0],
      rowsNumber: 0,
    });
    const groupPackages = ref([]);
    // Computed
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);
    const rows = computed(() => {
      if (!groupPackages.value?.length) return [];
      const packages = groupPackageMapper(groupPackages.value);
      return packages.map(pkg => {
        const contracts = pkg?.contracts || [];
        const completedContracts = contracts.filter((contract) => {
          const hasPendingQueues = !!contract.latestEncounter?.pendingQueues?.length;
          const hasApeReportWithinInterval = contract.apeReports?.some(report => {
            if (!report.finalizedAt) return false;
            return isWithinInterval(new Date(report.finalizedAt), {
              start: contract.startAt,
              end: contract.expiresAt,
            });
          });
          return !hasPendingQueues && hasApeReportWithinInterval;
        });
        const completedTotal = size(completedContracts);
        return {
          company: pkg.name,
          groups: pkg.label,
          startDate: format(pkg.startAt, 'MMM d, yyyy'),
          endDate: format(pkg.expiresAt, 'MMM dd, yyyy'),
          completedTotal: completedTotal || 0,
          statusTotal: contracts.length || 0,
          $data: pkg,
        };
      });
    });

    const columns = tableColumnBuilder([
      {
        name: 'company',
        field: 'company',
        label: 'Company',
      },
      {
        name: 'groups',
        field: 'groups',
        label: 'Groups',
      },
      {
        name: 'status',
        field: 'status',
        label: 'Status',
      },
      {
        name: 'start-date',
        field: 'startDate',
        label: 'Start Date',
      },
      {
        name: 'end-date',
        field: 'endDate',
        label: 'End Date',
      },
    ]);

    const visibleColumns = ref(columns.map(column => column.name));

    async function init (paginationOpts) {
      try {
        loading.value = true;
        const page = paginationOpts?.page || 1;
        const rowsPerPage = paginationOpts?.rowsPerPage || rowsPerPageOption.value[0];
        const query = {
          facility: activeOrganization.value.id,
          $limit: rowsPerPage,
          $skip: (page - 1) * rowsPerPage,
        };

        const { total, items } = await getInsuranceContracts(query);
        groupPackages.value = items;
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

    // Event functions
    function onPaginate (props) {
      const { page, rowsPerPage } = props.pagination;
      init({ page, rowsPerPage });
    }

    function onRowSelect (row) {
      console.warn('row', row);
      router.push({
        name: 'group-package',
        params: {
          insurer: row.$data.insurer,
        },
        query: {
          label: row.$data.label,
        },
      });
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
      searchText,
      tableRef,
      totalItems,
      visibleColumns,
      // methods
      init,
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
