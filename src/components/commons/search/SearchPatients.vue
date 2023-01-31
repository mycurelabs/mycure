<template lang="pug">
q-select(
  v-model="searchString"
  label="Search Patients"
  input-debounce="500"
  style="min-width: 400px"
  clear-icon="la la-times"
  clearable
  outlined
  dense
  use-input
  :options="patients"
  :loading="loading"
  @filter="onSearch"
  @filter-abort="onAbortSearch"
)
  template(v-slot:loading)
    q-spinner(
      color="primary"
      size="20"
    )
  template(v-slot:prepend)
    q-icon(name="la la-search")
  template(v-slot:no-option)
    q-item
      q-item-section.text-grey No results
</template>

<script>
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/current-user';
import { usePatientsStore } from '@/stores/patients';
import { useHelpers } from '@/composables/helpers';

export default {
  setup () {
    const userStore = useUserStore();
    const patientsStore = usePatientsStore();
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);
    const patients = ref([]);
    const loading = ref(false);
    const searchString = ref('');
    const { formatName } = useHelpers();

    async function onSearch (val, update, abort) {
      try {
        loading.value = true;
        const facility = activeOrganization.value?.id;
        const query = {
          facility,
        };
        const { items } = await patientsStore.getPatients(query);
        update(() => {
          patients.value = items.map(item => {
            return {
              label: formatName(item.name, 'lastName, firstName'),
              value: item.uid,
            };
          });
        }, (ref) => {
          if (val !== '' && ref.options.length > 0) {
            ref.setOptionIndex(-1); // reset optionIndex in case there is something selected
            ref.moveOptionSelection(1, true); // focus the first selectable option and do not update the input-value
          }
        });
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    function onAbortSearch () {}

    return {
      loading,
      patients,
      searchString,
      onAbortSearch,
      onSearch,
    };
  },
};
</script>
