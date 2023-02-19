<template lang="pug">
q-header(bordered).text-black.bg-white
  q-toolbar
    q-btn(
      icon="la la-arrow-left"
      dense
      flat
      round
      @click="goBack"
    )
    q-toolbar-title {{isUpdating ? 'Update' : 'Create'}} Report Template
      q-chip(v-if="isArchived" color="warning") Archived
    q-space
    q-btn(
      v-if="isUpdating"
      icon="la la-cog"
      color="primary"
      label="More Options"
      dense
      unelevated
      outline
      no-caps
    )
      q-menu(anchor="bottom end" self="top right")
        q-list(style="width: 200px")
          template(v-if="isArchived")
            q-item(clickable v-close-popup @click="onUnarchive")
              q-item-section(avatar)
                q-icon(name="las la-archive").text-positive
              q-item-section Unarchive
          template(v-else)
            q-item(clickable v-close-popup @click="onArchive")
              q-item-section(avatar)
                q-icon(name="las la-archive").text-warning
              q-item-section Archive
          q-item(clickable v-close-popup @click="onDelete")
            q-item-section(avatar)
              q-icon(name="las la-trash").text-negative
            q-item-section Delete

q-banner(v-if="isArchived" inline-actions class="bg-warning text-white")
  span.text-black This Form Template is archived
  template(v-slot:action)
    q-btn(
      label="Unarchive"
      color="black"
      flat
      no-caps
      @click="onUnarchive"
    )

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
    div.row
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
    div.row
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
import { fakeAwait } from '@/utils';
import {
  getFormTemplate,
  archiveFormTemplate,
  unarchiveFormTemplate,
  removeFormTemplate,
} from '@/services/form-templates';
import { onMounted, ref, watch, computed } from 'vue';
import { useQuasarMixins } from '@/composables/quasar-mixins';
import { useRoute, useRouter } from 'vue-router';
import GenericPage from '@/components/commons/GenericPage';

export default {
  components: {
    GenericPage,
  },
  setup () {
    const { confirm } = useQuasarMixins();
    const route = useRoute();
    const router = useRouter();
    const editorRef = ref(null);
    const leftDrawer = ref(false);
    const loading = ref(false);
    const templateHtml = ref('');
    const reportTemplateId = route.params.reportTemplate;
    const formTemplate = ref({});
    const name = ref('');
    const description = ref('');
    const isArchived = computed(() => formTemplate.value?.hiddenAt);

    const isUpdating = computed(() => {
      return !!reportTemplateId;
    });

    watch(templateHtml, async (val) => {
      if (val?.includes('::')) {
        await fakeAwait(100);
        const token = prompt('Type token');
        const edit = editorRef.value;
        await fakeAwait(100);
        // edit.runCmd('insertHTML', `&nbsp;<div class="editor_token row inline items-center" contenteditable="false">&nbsp;<span>${token}</span>&nbsp;<i class="q-icon" onclick="this.parentNode.parentNode.removeChild(this.parentNode)">X</i></div>&nbsp;`);
        templateHtml.value = templateHtml.value.replace('::', `&nbsp;<div class="editor_token row inline items-center" contenteditable="false">&nbsp;<span>${token}</span>&nbsp;<i class="q-icon" onclick="this.parentNode.parentNode.removeChild(this.parentNode)">X</i></div>&nbsp;`);
        edit.focus();
      }
    });

    async function init () {
      try {
        formTemplate.value = await getFormTemplate(reportTemplateId);
        console.warn('formTemplate.value', formTemplate.value?.hiddenAt);
        name.value = formTemplate.value.name;
        description.value = formTemplate.value.description;
        templateHtml.value = formTemplate.value.template || '';
      } catch (e) {
        console.error(e);
      }
    }

    async function onArchive () {
      try {
        const result = await confirm({
          title: 'Archive this report?',
          message: 'Are you sure you want to archive this report?',
        });
        if (!result) return;
        loading.value = true;
        await archiveFormTemplate(reportTemplateId);
        init();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    async function onUnarchive () {
      try {
        const result = await confirm({
          title: 'Unarchive this report?',
          message: 'Are you sure you want to unarchive this report?',
        });
        if (!result) return;
        loading.value = true;
        await unarchiveFormTemplate(reportTemplateId);
        init();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    async function onDelete () {
      try {
        const result = await confirm({
          title: 'Delete this report?',
          message: 'Are you sure you want to delete this report? This action is irreversible.',
        });
        if (!result) return;
        loading.value = true;
        await removeFormTemplate(reportTemplateId);
        goBack();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    function goBack () {
      router.push({ name: 'pme-report-templates' });
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
      isArchived,
      leftDrawer,
      loading,
      templateHtml,
      //
      goBack,
      onArchive,
      onDelete,
      onUnarchive,
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
