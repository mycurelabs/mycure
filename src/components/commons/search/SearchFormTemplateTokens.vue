<template lang="pug">
q-select(
  v-model="model"
  label="Search Form Temlate Tokens"
  input-debounce="100"
  style="width: 500px"
  clear-icon="la la-times"
  outlined
  dense
  autofocus
  use-input
  clearable
  :options="formTemplateTokens"
  :loading="loading"
  @filter="onSearch"
  @filter-abort="onAbortSearch"
)
  //- template(v-slot:option="scope")
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
import { ref, watch, toRef, computed } from 'vue';
import usePmeHelpers from '@/composables/pme-helpers';

export default {
  props: {
    defaultValue: {
      type: Object,
      default: undefined,
    },
  },
  setup (props, { emit }) {
    const { FORM_TEMPLATE_TOKENS } = usePmeHelpers();
    const loading = ref(false);
    const model = ref(null);
    const formTemplateTokens = ref([]);
    const formTemplateTokensDefault = computed(() => FORM_TEMPLATE_TOKENS.map(token => ({ label: token.name, value: token.token })));

    if (props.defaultValue) {
      const defaultVal = toRef(props, 'defaultValue');
      model.value = {
        label: defaultVal?.value?.name,
        value: defaultVal?.value,
      };
    }

    watch(model, (val) => {
      console.warn('model', val);
    });

    async function onSearch (val, update, abort) {
      try {
        loading.value = true;
        update(() => {
          if (val === '') {
            formTemplateTokens.value = formTemplateTokensDefault.value;
          } else {
            const needle = val.toLowerCase();
            const result = formTemplateTokensDefault.value.filter(v => v.label.toLowerCase().indexOf(needle) > -1);
            formTemplateTokens.value = result;
          }
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
      if (!val) return;
      emit('select', { label: val?.label, value: val?.value });
    });

    return {
      loading,
      formTemplateTokens,
      model,
      onAbortSearch,
      onSearch,
    };
  },
};
</script>
