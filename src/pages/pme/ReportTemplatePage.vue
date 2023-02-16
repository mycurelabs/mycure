<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="loading"
)
  q-editor(
    ref="editorRef"
    v-model="templateHtml"
    height="80vh"
  )

  q-drawer(
    v-model="leftDrawer"
    side="left"
    show-if-above
    bordered
    :width="500"
  )
    div.row
      div.col-xs-12.q-pa-md
        span.text-subtitle1 Template Information
      div.col-xs-12.q-pa-md
        q-form
          q-input(
            v-model="name"
            label="Template Name"
            outlined
          ).q-mb-md
          q-input(
            v-model="description"
            type="textarea"
            label="Template Description"
            outlined
          )
    div.row
      div.col-xs-12.q-pa-md
        span.text-subtitle1 Template Tokens
      div.col-xs-12.q-pa-md
        q-btn(
          label="Tokens 1"
          color="primary"
          unelevated
        ).full-width.q-mb-md
        q-btn(
          label="Tokens 2"
          color="primary"
          unelevated
        ).full-width.q-mb-md
        q-btn(
          label="Tokens 3"
          color="primary"
          unelevated
        ).full-width.q-mb-md
    //- div.row
      div.col-xs-12.q-pa-md
        span.text-subtitle1 Template Configurations
      div.col-xs-12.q-pa-md
        q-checkbox(
          label="Hide default clinic header"
        )
      div.col-xs-12.q-pa-md
        q-checkbox(
          label="Hide default patient header"
        )
      div.col-xs-12.q-pa-md
        q-checkbox(
          label="Hide default name header"
        )
    //- div.row
      div.col-xs-12.q-pa-md
        span.text-subtitle1 Signatories Configuration
      div.col-xs-12.q-pa-md
        q-checkbox(
          label="Hide Medical Examiner"
        )
      div.col-xs-12.q-pa-md
        q-checkbox(
          label="Hide Evaluator"
        )
      div.col-xs-12.q-pa-md
        q-checkbox(
          label="Hide Processor"
        )
      div.col-xs-12.q-pa-md
        q-checkbox(
          label="Hide Finalizer"
        )
    div.row
      div.col-xs-12.q-pa-md
        span.text-subtitle1 More Advanced Configurations
      div.col-xs-12.q-pa-md
        q-btn(
          label="Show more configurations"
          color="primary"
          unelevated
        ).full-width.q-mb-md
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
import { getFormTemplate } from '@/services/form-templates';
import { onMounted, ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import GenericPage from '@/components/commons/GenericPage';

export default {
  components: {
    GenericPage,
  },
  setup () {
    const route = useRoute();
    const editorRef = ref(null);
    const leftDrawer = ref(false);
    const loading = ref(false);
    const templateHtml = ref('');
    const reportTemplateId = route.params.reportTemplate;
    const formTemplate = ref({});
    const name = ref('');
    const description = ref('');

    const isUpdating = computed(() => {
      return !!reportTemplateId;
    });

    watch(templateHtml, (val) => {
      if (val.includes('::')) {
        const token = prompt('Type token');
        const edit = editorRef.value;
        setTimeout(() => {
          // edit.runCmd('insertHTML', `&nbsp;<div class="editor_token row inline items-center" contenteditable="false">&nbsp;<span>${token}</span>&nbsp;<i class="q-icon" onclick="this.parentNode.parentNode.removeChild(this.parentNode)">X</i></div>&nbsp;`);
          templateHtml.value = templateHtml.value.replace('::', `&nbsp;<div class="editor_token row inline items-center" contenteditable="false">&nbsp;<span>${token}</span>&nbsp;<i class="q-icon" onclick="this.parentNode.parentNode.removeChild(this.parentNode)">X</i></div>&nbsp;`);
          edit.focus();
        }, 100);
      }
    });

    async function init () {
      try {
        formTemplate.value = await getFormTemplate(reportTemplateId);
        console.warn('formTemplate.value', formTemplate.value);
        name.value = formTemplate.value.name;
        description.value = formTemplate.value.description;
        templateHtml.value = formTemplate.value.template;
      } catch (e) {
        console.error(e);
      }
    }

    onMounted(() => {
      isUpdating.value && init();
    });

    return {
      editorRef,
      formTemplate,
      isUpdating,
      name,
      description,
      leftDrawer,
      loading,
      templateHtml,
    };
  },
};
</script>

<style lang="sass">
.editor_token
  background: #0099cc
  color: white
  padding: 3px
  &, .q-icon
    border-radius: 3px
  .q-icon
    background: #0099aa
</style>
