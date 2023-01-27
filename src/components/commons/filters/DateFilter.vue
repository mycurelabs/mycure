<template lang="pug">
q-select(
  v-model="selectedFilter"
  v-bind="$attrs"
  return-object
  :options="options"
)

q-dialog(v-model="customRangeDialog")
  q-card
    q-card-section
      q-date(v-model="customRange" range)
</template>

<script>
import { ref, watch } from 'vue';
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  format,
} from 'date-fns';
import startOfWeek from 'date-fns/startOfWeek/index';
import endOfWeek from 'date-fns/fp/endOfWeek/index';
export default {
  props: {
    modelValue: Object,
  },
  setup (props, { emit }) {
    const defaultDateFilter = {
      label: 'All',
      value: 'all',
      dates: {
        start: null,
        end: null,
      },
    };
    const selectedFilter = ref(defaultDateFilter);
    const customRange = ref(format(new Date(), 'yyyy/MM/dd'));
    const customRangeDialog = ref(false);
    const dateToday = new Date();
    const options = [
      defaultDateFilter,
      {
        label: `Today (${format(dateToday, 'MMM dd, yyyy')})`,
        value: 'today',
        dates: {
          start: toTimestamp(startOfDay(dateToday)),
          end: toTimestamp(endOfDay(dateToday)),
        },
      },
      {
        label: `Yesterday (${format(subDays(dateToday, 1), 'MMM yyyy')})`,
        value: 'yesteday',
        dates: nDaysAgo(1),
      },
      {
        label: 'This Week',
        value: 'this-week',
        dates: {
          start: toTimestamp(startOfWeek(dateToday)),
          end: toTimestamp(endOfWeek(dateToday)),
        },
      },
      {
        label: `This Month (${format(dateToday, 'MMM yyyy')})`,
        value: 'this-month',
        dates: {
          start: toTimestamp(startOfMonth(dateToday)),
          end: toTimestamp(endOfMonth(dateToday)),
        },
      },
      {
        label: `Last Month (${format(subMonths(dateToday, 1), 'MMM yyyy')})`,
        value: 'last-month',
        dates: nMonthsAgo(30),
      },
      {
        label: 'Last 7 Days',
        value: 'last-7-days',
        dates: nDaysAgo(7),
      },
      {
        label: 'Last 30 Days',
        value: 'last-30-days',
        dates: nDaysAgo(30),
      },
      {
        label: 'Custom Date Range',
        value: 'custom',
      },
    ];

    function nDaysAgo (days) {
      return {
        start: toTimestamp(startOfDay(subDays(dateToday, days))),
        end: toTimestamp(endOfDay(dateToday)),
      };
    }

    function nMonthsAgo (months) {
      return {
        start: toTimestamp(startOfDay(subMonths(dateToday, months))),
        end: toTimestamp(endOfDay(dateToday)),
      };
    }

    function toTimestamp (date) {
      return new Date(date).getTime();
    }

    watch(selectedFilter, (val) => {
      if (val.value === 'custom' && !val.dates) {
        customRangeDialog.value = true;
      }
    });

    watch(customRange, (val) => {
      selectedFilter.value = {
        label: `Date: ${format(new Date(val.from), 'MMM dd, yyyy')} - ${format(new Date(val.to), 'MMM dd, yyyy')}`,
        value: 'custom',
        dates: {
          start: new Date(val.from).getTime(),
          end: new Date(val.to).getTime(),
        },
      };
      customRangeDialog.value = false;
    });

    emit('update:modelValue', selectedFilter);

    return {
      customRange,
      customRangeDialog,
      options,
      selectedFilter,
    };
  },
};
</script>
