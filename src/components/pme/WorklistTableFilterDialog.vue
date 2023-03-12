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
            label="Filter Dates"
            color="primary"
            dropdown-icon="la la-angle-down"
            style="width: 100%"
            dense
            outlined
            @selected="dateSelected"
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
      div.row.items-center.justify-center.q-mb-md
        div.col-xs-12.col-md-6
          span Filter by Template:
        div.col-xs-12.col-md-6
          search-form-templates(
            style="width: 100%"
            dropdown-icon="la la-angle-down"
            @select="templateSelected"
          )
    q-separator
    q-card-actions
      q-space
      q-btn(
        label="Clear Filters"
        color="primary"
        flat
        no-caps
        @click="clearFilters"
      )
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
import { useUserStore } from '@/stores/current-user';
import DateFilter from '@/components/commons/filters/DateFilter';
import SearchFormTemplates from '@/components/commons/search/SearchFormTemplates.vue';
import usePmeHelpers from '@/composables/pme-helpers';
export default {
  components: {
    DateFilter,
    SearchFormTemplates,
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
    const filterTemplate = ref(null);
    const filterStatus = ref(null);
    const filterCount = ref(0);
    const pmeEncounterStatuses = PME_ENCOUNTER_STATUS_TYPES;
    const pmeEncounterExamTypes = PME_ENCOUNTER_EXAM_TYPES;
    const activeOrganizationBranches = computed(() => userStore.$state.userActiveOrganizationBranches?.map(branch => ({ value: branch.id, label: branch.name })));

    function onSubmitFilters () {
      const filters = {
        filterBranch: filterBranch.value,
        filterDate: filterDate.value,
        filterExamType: filterExamType.value,
        filterStatus: filterStatus.value,
      };
      emit('filter', filters);
      dialog.value = false;
    }

    function clearFilters () {
      filterBranch.value = null;
      filterDate.value = null;
      filterExamType.value = null;
      filterStatus.value = null;
    }

    function dateSelected (val) {
      filterDate.value = val;
    }

    function templateSelected (val) {
      filterTemplate.value = val;
    }

    return {
      activeOrganizationBranches,
      dialog,
      filterBranch,
      filterCount,
      filterTemplate,
      filterDate,
      filterExamType,
      filterStatus,
      pmeEncounterExamTypes,
      pmeEncounterStatuses,
      // methods
      clearFilters,
      dateSelected,
      templateSelected,
      onSubmitFilters,
    };
  },
};
</script>
