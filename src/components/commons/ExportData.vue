
<template lang="pug">
q-btn(
  icon="las la-file-export"
  color="primary"
  outline
  @click="dialog = true"
).q-ml-sm
  q-tooltip(bottom) {{title}}

q-dialog(
  v-model="dialog"
)
  q-card(style="width: 600px; max-width: 100%;")
    q-toolbar(flat)
      q-toolbar-title {{title}}
    q-separator
    q-card-section
      q-tabs(
        v-model="selectedTab"
        indicator-color="primary"
        class="text-primary"
        inline-label
      )
        template(v-for="tab in tabs" :key="tab.name")
          q-tab(
            :name="tab.name"
            :label="tab.label"
            :icon="tab.icon"
            no-caps
          )
    q-card-section
      //- generate empty q-tab-panels based on tabs
      q-tab-panels(v-model="selectedTab" animated)
        template(v-for="tab in tabs" :key="tab.name")
          q-tab-panel(:name="tab.name")
            template(v-if="tab.name === 'export'")
              div.column.q-mb-md
                label.text-weight-medium Export Type
                div
                  template(v-for="type in exportTypes" :key="type.value")
                    q-radio(
                      v-model="exportType"
                      color="primary"
                      :val="type.value"
                      :label="type.name"
                    )
              div.column.q-mb-md
                label.text-weight-medium Date Range
                template(v-for="type in dateRangeTypes" :key="type.value")
                  div.column
                    div.row.items-center
                      div.col
                        q-radio(
                          v-model="dateRangeType"
                          color="primary"
                          :val="type.value"
                          :label="type.label"
                        )
                      div.col
                        span.text-weight-medium.q-ml-sm {{type.date}}

                template(v-if="dateRangeType === 'custom'")
                  span custom date range
              div.column.q-mb-md
                label.q-mb-sm.text-weight-medium Column Types
                q-select(
                  v-model="columnType"
                  label="Select Column(s)"
                  outlined
                  :options="columnTypes"
                ).q-mb-sm
                template(v-if="columnType === 'All Columns'")
                  span {{allColumnsNamesJoined}}
                template(v-if="columnType === 'Custom'")
            template(v-else-if="tab.name === 'history'")
              q-banner(
                dense
                rounded
                icon="las la-info-circle"
              ).bg-primary.text-white Click the download button to download a file, then check your browser's #[b Downloads page].
              q-list
                template(v-for="history in exportRequests" :key="history.id")
                  q-item
                    q-item-section(avatar)
                      q-icon(:color="history.color" :name="history.icon")
                    q-item-section
                      q-item-label {{history.createdAt}}
                      q-item-label(subtitle)
                        span(:class="{ 'text-positive': history.status === 'resolved', 'text-warning': history.status === 'pending' }").text-capitalize {{history.status}}
                          span(v-if="history.finishedAt")  - Finished At {{history.finishedAt}}
                    q-item-section(avatar)
                      q-btn(
                        v-if="history.downloadURL"
                        color="primary"
                        icon="las la-download"
                        target="_blank"
                        round
                        flat
                        :href="history.downloadURL"
                      )
                        q-tooltip(bottom) Download File

</template>

<script>
import { computed, onMounted, ref } from 'vue';
import { format, getTime, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { sdk } from '@/boot/mycure';

const today = new Date();
const yesterday = subDays(today, 1);
const startOfToday = startOfDay(today);
const endOfToday = endOfDay(today);
const startOfYesterday = startOfDay(yesterday);
const endOfYesterday = endOfDay(yesterday);
const startOfLast7Days = startOfDay(subDays(today, 7));
const endOfLast7Days = endOfDay(subDays(today, 1));
const startOfCurrentMonth = startOfMonth(today);
const endOfCurrentMonth = endOfMonth(today);
const startOfPreviousMonth = startOfMonth(subMonths(today, 1));
const endOfPreviousMonth = endOfMonth(subMonths(today, 1));
const DEFAULT_FIELDS_COUNT = 5;
import { useUserStore } from '@/stores/current-user';

function initDateRangeTypes () {
  return [
    {
      label: 'Today',
      value: 'today',
      date: format(today, 'MMM dd'),
      from: getTime(startOfToday),
      to: getTime(endOfToday),
    },
    {
      label: 'Yesterday',
      value: 'yesterday',
      date: format(yesterday, 'MMM dd'),
      from: getTime(startOfYesterday),
      to: getTime(endOfYesterday),
    },
    {
      label: 'Last 7 days',
      value: 'last-7',
      date: `${format(startOfLast7Days, 'MMM dd')} - ${format(endOfLast7Days, 'MMM dd')}`,
      from: getTime(startOfLast7Days),
      to: getTime(endOfLast7Days),
    },
    {
      label: 'This month',
      value: 'current-month',
      date: `${format(startOfCurrentMonth, 'MMM dd')} - ${format(endOfCurrentMonth, 'MMM dd')}`,
      from: getTime(startOfCurrentMonth),
      to: getTime(endOfCurrentMonth),
    },
    {
      label: 'Last month',
      value: 'prev-month',
      date: `${format(startOfPreviousMonth, 'MMM dd')} - ${format(endOfPreviousMonth, 'MMM dd')}`,
      from: getTime(startOfPreviousMonth),
      to: getTime(endOfPreviousMonth),
    },
    // {
    //   label: 'All',
    //   value: 'all',
    //   from: null,
    //   to: null,
    // },
    {
      label: 'Custom',
      value: 'custom',
      from: null,
      to: null,
    },
  ];
}

export default {
  props: {
    title: {
      type: String,
      default: 'Export Data',
    },
    columns: {
      type: Array,
      default: () => ([]),
    },
    tags: {
      type: Array,
      default: () => ([]),
    },
    accountOwner: {
      type: String,
      default: undefined,
    },
    organizationOwner: {
      type: String,
      default: undefined,
    },
    service: {
      type: String,
      default: undefined,
    },
    query: {
      type: Object,
      default: () => ({}),
    },
    dateFilter: {
      type: Object,
      default: () => ({}),
    },
    dateToFilter: {
      type: String,
      default: 'createdAt',
    },
    itemFormatter: {
      type: String,
      default: undefined,
    },
  },
  setup (props) {
    const dialog = ref(false);
    const selectedTab = ref('history');
    const tabs = [
      {
        name: 'export',
        icon: 'las la-file-export',
        label: 'Export',
      },
      {
        name: 'history',
        icon: 'las la-history',
        label: 'History',
      },
    ];
    const exportType = ref('xlsx');
    const exportTypes = [
      {
        name: 'Microsoft Excel',
        value: 'xlsx',
      },
      {
        name: 'Comma Separated Value (CSV)',
        value: 'csv',
      },
      {
        name: 'JSON',
        value: 'json',
      },
    ];
    const dateRangeType = ref('today');
    const dateRangeTypes = initDateRangeTypes();
    const defaultFieldsCount = DEFAULT_FIELDS_COUNT;
    const columnType = ref('All Columns');
    const columnTypes = [
      'All Columns',
      'Custom',
    ];
    const columnsFormatted = props.columns.map(column => ({
      name: column.label,
      key: column.field,
    }));
    const allColumnsNamesJoined = columnsFormatted.map(column => column.name).join(', ');

    // History
    onMounted(() => {
      loadHistory();
    });

    const loadingExportRequests = ref(false);
    const userStore = useUserStore();
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);
    const exportRequests = ref([]);

    async function loadHistory () {
      try {
        loadingExportRequests.value = true;
        const { items } = await sdk.service('export-requests').find({
          tags: {
            $in: [`${activeOrganization.value?.id}::${props.tags?.[0]}`],
          },
          $sort: {
            createdAt: -1,
          },
        });
        exportRequests.value = items?.map(item => {
          return {
            ...item,
            createdAt: format(item.createdAt, 'MMM dd, yyyy hh:mm a'),
            finishedAt: format(item.finishedAt, 'MMM dd, yyyy hh:mm a'),
            icon: parseIcon(item.exportType),
            color: parseColor(item),
          };
        }) || [];
      } catch (e) {
        console.error(e);
      } finally {
        loadingExportRequests.value = false;
      }
    }

    function parseIcon (type) {
      switch (type) {
        case 'csv': return 'las la-file-csv';
        case 'json': return 'las la-file-code';
        case 'xlsx':
        default: return 'las la-file-excel';
      }
    }

    function parseColor (item) {
      switch (item?.exportType) {
        case 'csv': return 'blue';
        case 'json': return 'yellow';
        case 'xlsx':
        default: return 'green';
      }
    }

    return {
      dialog,
      selectedTab,
      tabs,
      exportType,
      exportTypes,
      dateRangeType,
      dateRangeTypes,
      defaultFieldsCount,
      columnTypes,
      columnType,
      columnsFormatted,
      allColumnsNamesJoined,
      exportRequests,
    };
  },
};
</script>
