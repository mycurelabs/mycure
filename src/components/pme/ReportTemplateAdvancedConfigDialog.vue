<template lang="pug">
q-dialog(
  v-model="dialog"
  persistent
  maximized
  transition-show="slide-up"
  transition-hide="slide-down"
)
  q-card
    q-toolbar
      q-toolbar-title.text-primary Advanced Configuration
      q-space
      q-btn(
        icon="las la-times"
        round
        flat
        @click="dialog = !dialog"
      )
        q-tooltip Close
    q-separator
    q-card-section
      span.text-h6 Configure Items to hide in Summary Report
      div.row
        template(v-for="(value, field) in configModel.hiddenItemsInPMEReport")
          div.col-xs-6.col-md-3
            q-checkbox(
              v-model="configModel.hiddenItemsInPMEReport[field]"
              :label="`Hide ${toStartCase(field)}`"
            )
    q-card-section
      span.text-h6 EMR Records Configuration
    q-card-section
      pre {{configModel}}
</template>

<script>
import { toRef, ref, watch } from 'vue';
import { startCase } from 'lodash';

export default {
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    configModel: {
      type: Object,
      default: () => ({}),
    },
  },
  setup (props, { emit }) {
    const dialog = ref(false);
    watch(toRef(props, 'modelValue'), (val) => (dialog.value = val));
    watch(dialog, (val) => emit('update:modelValue', val));
    watch(toRef(props, 'configModel'), (val) => emit('update:configModel', val));

    function toStartCase (str) {
      return startCase(str);
    }

    return {
      dialog,
      toStartCase,
    };
  },
};
</script>
