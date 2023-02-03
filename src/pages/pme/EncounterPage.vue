<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="loading"
)
  div.row.items-center.justify-center
    div.col-xs-12.col-md-12
      q-card.shadow-1
        q-card-section
          div(v-html="apeReportTemplate")
          //- component(:is="apeReportTemplateComponent")
          //- input(v-model="apeReportFieldsModel.custom_text_1_0")
          pre {{apeReportFieldsModel}}
          pre {{apeReportTemplate}}

q-footer(
  bordered
).bg-white
  q-toolbar
    q-space
    q-btn(
      label="Save Report"
      color="primary"
      unelevated
      no-caps
    )
</template>

<script>
import { computed, ref, h } from 'vue';
import GenericPage from '@/components/commons/GenericPage';
import { useRoute } from 'vue-router';
import { usePmeStore } from '@/stores/pme';
export default {
  components: {
    GenericPage,
  },
  setup () {
    const loading = ref(false);
    // const router = useRouter();
    const route = useRoute();
    const pmeStore = usePmeStore();
    const encounterId = route.params.encounter;
    const encounter = ref({});
    const apeReport = ref({});
    const apeReportFieldsModel = ref({});
    const apeReportTemplate = computed(() => {
      let report = apeReport.value?.report;
      const values = apeReport.value?.values || [];
      if (!report) return '';
      values.forEach((value, index) => {
        if (value.answer) {
          report = report.replace(`{${value.id}}`, value.answer);
        } else {
          apeReportFieldsModel.value[value.id] = ref('');
          report = report.replace(`{${value.id}}`, `<input value="${apeReportFieldsModel.value[value.id]}" />`);
        }
      });
      return report;
    });

    const apeReportTemplateComponent = computed(() => {
      return h(apeReportTemplate.value, {});
    });

    async function init () {
      try {
        loading.value = true;
        const result = await pmeStore.getPmeEncounter({ id: encounterId });
        encounter.value = result.encounter;
        apeReport.value = result.apeReport;
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    init();

    return {
      apeReport,
      apeReportTemplateComponent,
      apeReportFieldsModel,
      apeReportTemplate,
      encounter,
      loading,
    };
  },
};
</script>
