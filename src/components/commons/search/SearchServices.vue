<template lang="pug">
q-select(
  v-model="model"
  v-bind="$attrs"
  :options="services"
  :loading="loading"
  @filter="onSearch"
  @filter-abort="onAbortSearch"
)
  template(v-slot:option="scope")
    q-item(v-bind="scope.itemProps")
      //- q-item-section(avatar)
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
import { getServices } from '@/services/services';

export default {
  setup (props, { emit }) {
    const userStore = useUserStore();
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);
    const services = ref([]);
    const loading = ref(false);
    const model = ref(null);

    async function onSearch (val, update, abort) {
      try {
        loading.value = true;
        const facility = activeOrganization.value?.id;
        const query = {
          facility,
          type: 'pe',
        };
        if (val) query.searchText = val;
        const { items } = await getServices(query);
        update(() => {
          services.value = items.map(item => {
            return {
              label: item.name,
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
      emit('select', val?.value);
    });

    return {
      loading,
      services,
      model,
      onAbortSearch,
      onSearch,
    };
  },
};
</script>
