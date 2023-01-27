<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="initializing"
)
  q-card
    q-toolbar.q-gutter-x-sm
      q-toolbar-title APE Reports
      q-input(
        label="Search by Patients"
        style="min-width: 300px"
        color="primary"
        dense
        outlined
      )
    q-separator
    q-toolbar.q-gutter-x-sm
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
    //- TODO: Try to use QMarkupTable https://quasar.dev/vue-components/markup-table
    q-table(
      icon-first-page="la la-angle-double-left"
      icon-last-page="la la-angle-double-right"
      icon-prev-page="la la-angle-left"
      icon-next-page="la la-angle-right"
      :dense="$q.screen.lt.md"
      :rows="rows"
      :columns="columns"
      :rows-per-page-options="[20, 50, 100]"
    ).shadow-0
      //- template(v-slot:body="props")
        q-tr(:key="props.row.index")
          template(v-for="col in props.cols")
            td(v-if="col.name === 'status'" style="max-width: 200px; background: red;") {{col.value}}
      template(v-slot:no-data)
        div(style="height: 200px").row.full-width.justify-center.items-center
          div.col-xs-12.text-center
            q-icon(name="la la-meh" size="60px").text-grey
            h2.text-grey.text-h6 No APE reports found

</template>

<script>
import { computed, ref, watch } from 'vue';
import { usePmeStore } from '@/stores/pme';
import { useUserStore } from '@/stores/current-user';
import usePmeHelpers from '@/composables/pme-helpers';
import GenericPage from '@/components/commons/GenericPage';
import DateFilter from '@/components/commons/filters/DateFilter';
import { format } from 'date-fns';
import { useHelpers } from '@/composables/helpers';

export default {
  components: {
    DateFilter,
    GenericPage,
  },
  setup () {
    const pmeStore = usePmeStore();
    const initializing = ref(false);
    const userStore = useUserStore();
    const { formatName } = useHelpers();
    const pmeEncounters = computed(() => pmeStore.$state.pmeEncounters);
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);
    const activeOrganizationBranches = computed(() => {
      return userStore.$state.userActiveOrganizationBranches?.map(branch => ({ value: branch.id, label: branch.name }));
    });
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
    });
    const columns = [
      {
        name: 'name',
        field: 'name',
        label: 'Name',
        align: 'left',
        format: (val) => {
          return formatName(val, 'lastName, firstName');
        },
      },
      {
        name: 'date',
        field: 'date',
        label: 'Date',
        align: 'left',
        format: (val) => {
          return format(new Date(val), 'MM/dd/yy hh:mm a');
        },
      },
      {
        name: 'exam-type',
        field: 'examType',
        label: 'Exam Type',
        align: 'left',
        format: (val) => {
          if (!val?.length) return '-';
          return val.join(', ');
        },
      },
      {
        name: 'status',
        field: 'status',
        label: 'Status',
        align: 'left',
        format: (val) => {
          return pmeEncounterStatusMapper(val);
        },
      },
      {
        name: 'package',
        field: 'package',
        label: 'Package',
        align: 'left',
      },
      {
        name: 'hmo',
        field: 'hmo',
        label: 'HMO',
        align: 'left',
      },
      {
        name: 'tags',
        field: 'tags',
        label: 'Tags',
        align: 'left',
      },
    ];
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

    async function init (firstLoad, filters) {
      try {
        let query = {
          facility: activeOrganization.value.id,
        };

        // Date Filter
        if (filters?.filterDate?.dates?.start) {
          const start = filters?.filterDate?.dates?.start;
          const end = filters?.filterDate?.dates?.end;
          query.createdAt = {
            $gte: start,
            $lte: end,
          };
        }

        // Status Filter
        if (filters?.filterStatus?.value) {
          const status = filters?.filterStatus?.value;
          const q = pmeEncounterStatusQueryBuilder(status, query);
          console.warn('q', q);
          query = q;
        }

        // Exam Type Filter
        if (filters?.filterExamType?.value) {
          query.tags = filters?.filterExamType?.value;
        }

        await pmeStore.getPmeEncounters(query);
      } catch (e) {
        console.error(e);
      } finally {
        initializing.value = false;
      }
    }

    watch(filters, (val) => {
      init(false, val);
    }, { deep: true });

    // if (!apeReports.value.length) init(true);
    // else init();
    // init();
    return {
      activeOrganizationBranches,
      columns,
      filters,
      initializing,
      pmeEncounterExamTypes,
      pmeEncounterStatuses,
      rows,
    };
  },
};
</script>
