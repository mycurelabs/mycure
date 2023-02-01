<template lang="pug">
q-btn(
  label="Filters"
  color="primary"
  icon="la la-filter"
  no-caps
  outline
  @click="dialog = true"
)

q-dialog(v-model="dialog")
  q-card
    q-toolbar
      q-toolbar-title Filters
    q-card-section
      p Aliqua qui cupidatat ea est labore officia laborum voluptate dolor aliquip consequat laborum Lorem commodo.
</template>

<script>
import { ref } from 'vue';
export default {
  setup () {
    const dialog = ref(false);

    return {
      dialog,
    };
  },
};
</script>
