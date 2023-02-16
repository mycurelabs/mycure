<template lang="pug">
q-btn(
  label="Filters"
  color="primary"
  icon="la la-filter"
  no-caps
  outline
  @click="dialog = true"
)

q-dialog(v-model="dialog" persistent)
  q-card(style="width: 700px")
    q-toolbar
      q-toolbar-title
        q-icon(name="la la-filter").text-primary
        | Filters
      q-btn(
        round
        flat
        @click="dialog = false"
      )
        q-icon(name="la la-close")
    q-separator
    q-card-section
      div.row.items-center.justify-center.q-mb-md
        div.col-xs-12.col-md-6
          span Filter by Date:
        div.col-xs-12.col-md-6
          date-filter(
            v-model="filterDate"
            label="Filter Exam Types"
            color="primary"
            dropdown-icon="la la-angle-down"
            style="width: 100%"
            dense
            outlined
          )
      div.row.items-center.justify-center.q-mb-md
        div.col-xs-12.col-md-6
          span Filter by Exam Type:
        div.col-xs-12.col-md-6
          q-select(
            v-model="filterExamType"
            label="Filter Exam Types"
            style="width: 100%"
            color="primary"
            dropdown-icon="la la-angle-down"
            clear-icon="la la-times"
            clearable
            dense
            outlined
            :options="pmeEncounterExamTypes"
          )
      div.row.items-center.justify-center.q-mb-md
        div.col-xs-12.col-md-6
          span Filter by Status:
        div.col-xs-12.col-md-6
          q-select(
            v-model="filterStatus"
            label="Filter Status"
            color="primary"
            dropdown-icon="la la-angle-down"
            clear-icon="la la-times"
            clearable
            dense
            outlined
            :options="pmeEncounterStatuses"
          )
      div.row.items-center.justify-center.q-mb-md
        div.col-xs-12.col-md-6
          span Filter by Branch:
        div.col-xs-12.col-md-6
          q-select(
            v-model="filterBranch"
            label="Filter Branch"
            color="primary"
            dropdown-icon="la la-angle-down"
            clear-icon="la la-times"
            clearable
            dense
            outlined
            :options="activeOrganizationBranches"
          )
      //- div.row.items-center.justify-center.q-mb-md
        div.col-xs-12
          pre filterBranch {{filterBranch}}
          pre filterDate {{filterDate}}
          pre filterExamType {{filterExamType}}
          pre filterStatus {{filterStatus}}
    q-separator
    q-card-actions
      q-space
      q-btn(
        label="Submit Filters"
        color="primary"
        unelevated
        no-caps
        @click="onSubmitFilters"
      )
</template>

<script>
import { computed, ref } from 'vue';
import usePmeHelpers from '@/composables/pme-helpers';
import DateFilter from '@/components/commons/filters/DateFilter';
import { useUserStore } from '@/stores/current-user';
export default {
  components: {
    DateFilter,
  },
  emits: ['filter'],
  setup (props, { emit }) {
    const userStore = useUserStore();
    const {
      PME_ENCOUNTER_EXAM_TYPES,
      PME_ENCOUNTER_STATUS_TYPES,
    } = usePmeHelpers();
    const dialog = ref(false);
    const filterBranch = ref(null);
    const filterDate = ref(null);
    const filterExamType = ref(null);
    const filterStatus = ref(null);
    const pmeEncounterStatuses = PME_ENCOUNTER_STATUS_TYPES;
    const pmeEncounterExamTypes = PME_ENCOUNTER_EXAM_TYPES;
    const activeOrganizationBranches = computed(() => userStore.$state.userActiveOrganizationBranches?.map(branch => ({ value: branch.id, label: branch.name })));

    function onSubmitFilters () {
      emit('filter', {
        filterBranch: filterBranch.value,
        filterDate: filterDate.value,
        filterExamType: filterExamType.value,
        filterStatus: filterStatus.value,
      });
      dialog.value = false;
    }

    return {
      activeOrganizationBranches,
      dialog,
      filterBranch,
      filterDate,
      filterExamType,
      filterStatus,
      pmeEncounterExamTypes,
      pmeEncounterStatuses,
      // methods
      onSubmitFilters,
    };
  },
};
</script>