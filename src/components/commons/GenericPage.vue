<template lang="pug">
q-linear-progress(
  v-if="loading && !skeleton"
  color="success"
  indeterminate
)
q-page(:padding="padding")
  div.row.justify-center.align-center
    div.col-xs-12.col-md-10
      component(v-if="loading && skeleton" :is="skeletonComponent[skeleton]")
      slot(v-else name="default")
  q-page-sticky(position="bottom-right", :offset="[18, 18]")
    slot(name="fab")
</template>

<script>
import { computed } from 'vue';
import SkeletonTable from '@/components/commons/skeletons/SkeletonTable';
export default {
  components: {
    SkeletonTable,
  },
  props: {
    loading: Boolean,
    padding: Boolean,
    skeleton: {
      type: String,
      default: undefined,
    },
  },
  setup (props, { emit }) {
    const loadingModel = computed({
      get: () => props.loading,
      set: (val) => emit('update:loading', val),
    });

    const skeletonComponent = {
      table: SkeletonTable,
    };

    return {
      loadingModel,
      skeletonComponent,
    };
  },
};
</script>
