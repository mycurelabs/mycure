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
    q-card-section(v-if="!noSummaryReportConfig")
      div(style="max-height: 400px; overflow-y: auto; outline: 1px solid #ccc;").q-pa-sm
        span.text-h3 Configure Items to hide in Summary Report
        div.row
          template(v-for="(value, field) in configModel.hiddenItemsInPMEReport")
            div.col-xs-6.col-md-3
              q-checkbox(
                v-model="configModel.hiddenItemsInPMEReport[field]"
                :label="`Hide ${toStartCase(field)}`"
              )
    q-card-section
      span.text-h3 EMR Records Configuration
    q-card-section
      div.row
        template(v-for="(config, index) in emrConfig" :key="index")
          div(style="border-left: 1px solid #ccc; padding-left: 30px; margin-bottom: 50px;").col-xs-12.col-md-12
            div.col-xs-12.col-md-12
              div.row
                div.number-circle.row.justify-center.items-center
                  span {{index + 1}}
                span(style="margin-top: 5px;").text-h4.text-primary {{config.name}}
            div.col-xs-12.col-md-12
              template(v-for="(record, recordIndex) in config.records" :key="recordIndex")
                q-separator(v-if="recordIndex !== 0").q-my-md
                div.row
                  div.col-xs-12.col-md-12
                    span.text-h3.text-primary {{record.name}}
                  div.col-xs-12.col-md-12
                    q-toolbar
                      span.text-subtitle1 Record {{recordIndex + 1}}
                      q-space
                      q-btn(
                        icon="las la-trash"
                        color="negative"
                        round
                        outline
                        @click="onRemoveRecord(record, recordIndex)"
                      )
                  div(style="border-left: 2px solid #0099cc; padding-left: 10px; margin-bottom: 10px;").col-xs-12
                    div.row
                      template(v-for="(chunks, chunksIndex) in chunkFields(record)" :key="chunksIndex")
                        div.col-xs-12.col-md-6
                          table(v-if="chunks.length" style="width: 100%").table.table-striped-inverted.mx-2
                            thead.thead.thead-default.grey.lighten-2
                              tr
                                th(align="left").text-weight-medium Field
                                th(align="left").text-weight-medium Visible?
                                th(align="left").text-weight-medium Pre-value
                            tbody
                              tr(v-for="(chunk, chunkIndex) in chunks")
                                td(style="width: 40%") {{ chunk.name }}
                                td(style="width: 20%")
                                  q-checkbox(
                                    color="primary"
                                    :model-value="chunk.enabled"
                                    @update:model-value="(value, event) => onRecordFieldEnabledChange(record, recordIndex, chunk, value)"
                                  )
                                td(style="width: 40%")
                                  q-input(
                                    v-if="showLastTd(config, chunk)"
                                    type="textarea"
                                    rows="1"
                                    placeholder="Write here..."
                                    flat
                                    outline
                                    auto-grow
                                    single-line
                                    hide-details
                                    :model-value="chunk.value"
                                    @update:model-value="(value, event) => onRecordFieldValueChange(record, recordIndex, chunk, value)"
                                  )
            q-btn(
              color="primary"
              outline
              no-caps
              @click="onAddRecord(config, index)"
            ).q-mt-md + Add New

    //- q-card-section
      //- pre {{emrConfig}}
</template>

<script>
import {
  computed,
  ref,
  toRef,
  watch,
} from 'vue';
import {
  cloneDeep,
  isEmpty,
  partition,
  pick,
  startCase,
} from 'lodash';
import { RECORDS_GROUPS, PME_EMR_CONFIG } from './constants';

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
    watch(toRef(props, 'configModel'), (val) => emit('update:configModel', val || {}));
    const noSummaryReportConfig = computed(() => isEmpty(props.configModel?.hiddenItemsInPMEReport));

    function toStartCase (str) {
      return startCase(str);
    }

    const activeTab = ref('vitals');
    const recordGroups = RECORDS_GROUPS;
    const conf = toRef(props, 'configModel');

    const emrConfig = computed(() => {
      const config = conf.value?.records || {};
      const emrConfig = PME_EMR_CONFIG.map(emrConfigRecord => {
        const match = config?.[emrConfigRecord.type];
        const records = match?.map(record => {
          const fields = emrConfigRecord.fields?.map(field => {
            const matchField = record.fields?.find(rField => rField.field === field.field);
            console.warn('matchField', matchField);
            return {
              ...field,
              ...matchField && {
                ...matchField,
                enabled: typeof matchField?.enabled === 'boolean' ? matchField?.enabled : true,
              },
            };
          });
          return { ...record, fields };
        });
        return { ...emrConfigRecord, records };
      });

      return emrConfig || [];
    });

    function chunkFields (record) {
      const withIndex = (fn) => {
        let index = 0;
        return (thing) => fn(thing, index++);
      };

      const fields = record?.fields || [];
      return partition(fields, withIndex((field, i) => i % 2 === 0));
    }

    function onRecordFieldEnabledChange (record, recordIndex, field, value) {
      console.warn('onRecordFieldEnabledChange', field, value);
      if (!conf.value) conf.value = {};
      if (!conf.value.records) conf.value.records = {};
      const records = cloneDeep(conf.value.records?.[record.type]);
      const fieldIndex = records[recordIndex].fields.findIndex(f => f.field === field.field);
      if (fieldIndex === -1) {
        records[recordIndex].fields.push({ ...field, enabled: value });
      } else {
        records[recordIndex].fields[fieldIndex].enabled = value;
      }
      conf.value.records[record.type] = records;
    }

    function onRecordFieldValueChange (record, recordIndex, field, value) {
      if (!conf.value) conf.value = {};
      if (!conf.value.records) conf.value.records = {};
      const records = cloneDeep(conf.value.records?.[record.type]);
      const fieldIndex = records[recordIndex].fields.findIndex(f => f.field === field.field);
      if (fieldIndex === -1) {
        records[recordIndex].fields.push({ ...field, value });
      } else {
        records[recordIndex].fields[fieldIndex].value = value;
      }
      conf.value.records[record.type] = records;
    }

    function onAddRecord (record) {
      if (!conf.value) conf.value = {};
      if (!conf.value.records) conf.value.records = {};
      const config = cloneDeep(conf.value.records);
      const newRecord = pick(record, ['fields', 'type', 'subtype']);
      if (!config[record.type]) config[record.type] = [];
      config[record.type].push(newRecord);
      conf.value.records = config;
    }

    function onRemoveRecord (record, index) {
      if (!conf.value) conf.value = {};
      if (!conf.value.records) conf.value.records = {};
      const config = cloneDeep(conf.value.records);
      config[record.type].splice(index, 1);
      conf.value.records = config;
    }

    function showLastTd (config, chunk) {
      return !chunk?.disableFieldValue && !config?.disableFieldValue;
    }

    return {
      dialog,
      toStartCase,
      noSummaryReportConfig,
      recordGroups,
      emrConfig,
      activeTab,
      chunkFields,
      onRecordFieldEnabledChange,
      onRecordFieldValueChange,
      onAddRecord,
      onRemoveRecord,
      showLastTd,
    };
  },
};
</script>

<style scoped>
.number-circle {
  width: 30px;
  height: 30px;
  border-radius: 100%;
  background: #0099cc;
  margin-right: 5px;
  color: white;
}
</style>
