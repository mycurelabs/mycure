<template lang="pug">
q-select(
  v-model="model"
  label="Search Patients"
  input-debounce="500"
  style="min-width: 300px"
  clear-icon="las la-times"
  outlined
  dense
  use-input
  clearable
  :options="patients"
  :loading="loading"
  @filter="onSearch"
  @filter-abort="onAbortSearch"
)
  template(v-slot:option="scope")
    q-item(v-bind="scope.itemProps")
      q-item-section(avatar)
        q-avatar(size="30px" color="grey").q-mr-sm
          q-img(v-if="scope.opt.value.picURL" :src="scope.opt.value.picURL")
          q-icon(v-else name="la la-user-alt").text-white
      q-item-section
        q-item-label {{scope.opt.label}}

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
import { ref, computed, watch } from 'vue';
import { useUserStore } from '@/stores/current-user';
import { usePatientsStore } from '@/stores/patients';
import { useHelpers } from '@/composables/helpers';

export default {
  setup (props, { emit }) {
    const userStore = useUserStore();
    const patientsStore = usePatientsStore();
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);
    const patients = ref([]);
    const loading = ref(false);
    const model = ref(null);
    const { formatName } = useHelpers();

    async function onSearch (val, update, abort) {
      try {
        loading.value = true;
        const facility = activeOrganization.value?.id;
        const query = {
          facility,
          archived: false,
        };
        if (val) query.searchText = val;
        const { items } = await patientsStore.getPatients(query);
        update(() => {
          patients.value = items.map(item => {
            return {
              label: formatName(item.name, 'lastName, firstName'),
              value: item,
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

    watch(model, (val) => {
      const patient = val?.value?.patient;
      emit('select', patient);
    });

    return {
      loading,
      patients,
      model,
      onAbortSearch,
      onSearch,
    };
  },
};
</script>
