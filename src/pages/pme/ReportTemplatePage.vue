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
  q-card(flat)
    //- q-card-section.q-pa-0
      search-form-template-tokens(@select="onTokenSelect" style="width: 100%")
    q-card-section.q-pa-0
      div.row.items-center.q-gutter-sm
        span.text-medium Tokens:
        q-btn(
          label="Add Tokens"
          color="primary"
          icon="las la-code"
          outline
          no-caps
          @click="tokensDialog = true"
        )
        q-btn(
          label="Custom Text"
          color="primary"
          icon="las la-keyboard"
          outline
          no-caps
          @click="customTextDialog = true"
        )
        q-btn(
          label="Custom Options"
          color="primary"
          icon="las la-caret-square-down"
          outline
          no-caps
          @click="customDropdownDialog = true"
        )
    q-card-section.q-pa-0
      q-editor(
        ref="editorRef"
        v-model="editorTemplate"
        height="60vh"
        :dense="$q.screen.lt.md"
        :toolbar="editorToolbarOptions"
        :fonts="editorFontOptions"
      )
      pre {{rawTemplate}}

  q-dialog(v-model="tokensDialog" position="top")
    q-card
      q-card-section
        search-form-template-tokens(@select="onTokenSelect")

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
    //- div.row
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

//- LOCAL DIALOGS
q-dialog(v-model="customTextDialog")
  q-card(style="width: 500px")
    q-toolbar
      q-toolbar-title Add a Custom Text
      q-btn(
        icon="la la-times"
        flat
        rounded
        @click="customTextDialog = false"
      )
    q-card-section
      q-form(ref="customTextFormRef" @submit.prevent="insertCustomText")
        q-input(
          v-model="customText"
          label="Custom Text"
          outlined
          autofocus
          :rules="[v => !!v || 'This is required']"
        )
    q-separator
    q-card-actions
      q-space
      q-btn(
        label="Submit"
        color="primary"
        unelevated
        no-caps
        @click="insertCustomText"
      )

q-dialog(v-model="customDropdownDialog")
  q-card(style="width: 500px")
    q-toolbar
      q-toolbar-title Add a Custom Dropdown
      q-btn(
        icon="la la-times"
        flat
        rounded
        @click="customDropdownDialog = false"
      )
    q-card-section
      q-form(ref="customDropdownFormRef" @submit.prevent="insertCustomDropdown")
        div.row.q-mt-sm
          p Question
        q-input(
          v-model="dropdownQuestion"
          label="Absence in, Patient Work, etc"
          outlined
          dense
          autofocus
          :rules="[v => !!v || 'This is required']"
        ).q-mb-sm
        q-separator
        div.row.q-mt-sm
          p Add at least one dropdown option
        template(v-for="(opt, index) in dropdownOptions")
          div.row.q-mb-sm
            div.col-grow.q-mr-sm
              q-input(
                v-model="opt.option"
                label="Option"
                outlined
                dense
                :rules="[v => !!v || 'This is required']"
              )
            q-btn(
              icon="la la-times"
              color="negative"
              flat
              round
              @click="removeOption(index)"
            )
        div.column
          q-btn(
            label="Add a new option"
            color="primary"
            icon="la la-plus"
            block
            flat
            no-caps
            @click="addOption"
          )
    q-separator
    q-card-actions
      q-space
      q-btn(
        label="Submit"
        color="primary"
        unelevated
        no-caps
        @click="insertCustomDropdown"
      )

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
// import { fakeAwait } from '@/utils';
import { cloneDeep } from 'lodash';
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
import SearchFormTemplateTokens from '@/components/commons/search/SearchFormTemplateTokens';

export default {
  components: {
    GenericPage,
    SearchFormTemplateTokens,
  },
  setup () {
    const { q, confirm, showSnack } = useQuasarMixins();
    const editorRef = ref(null);
    const leftDrawer = ref(false);
    const loading = ref(false);
    const route = useRoute();
    const router = useRouter();
    const tokensDialog = ref(false);
    const customDropdownFormRef = ref(null);
    const customDropdownDialog = ref(false);
    const dropdownQuestion = ref('');
    const dropdownOptions = ref([{ option: '' }]);
    const customTextDialog = ref(false);
    const customText = ref('');
    const customTextFormRef = ref(null);

    // Report models
    const description = ref('');
    const formTemplate = ref({});
    const name = ref('');
    const reportTemplateId = route.params.reportTemplate;
    const editorTemplate = ref('');
    const rawTemplate = ref('');

    const isArchived = computed(() => formTemplate.value?.hiddenAt);
    const isUpdating = computed(() => {
      return !!reportTemplateId;
    });

    const editorFontOptions = {
      arial: 'Arial',
      arial_black: 'Arial Black',
      comic_sans: 'Comic Sans MS',
      courier_new: 'Courier New',
      impact: 'Impact',
      lucida_grande: 'Lucida Grande',
      times_new_roman: 'Times New Roman',
      verdana: 'Verdana',
    };

    const editorToolbarOptions = [
      [
        {
          label: q.lang.editor.align,
          icon: q.iconSet.editor.align,
          fixedLabel: true,
          list: 'only-icons',
          options: ['left', 'center', 'right', 'justify'],
        },
        {
          label: q.lang.editor.align,
          icon: q.iconSet.editor.align,
          fixedLabel: true,
          options: ['left', 'center', 'right', 'justify'],
        },
      ],
      ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
      ['token', 'hr', 'link', 'custom_btn'],
      ['print', 'fullscreen'],
      [
        {
          label: q.lang.editor.formatting,
          icon: q.iconSet.editor.formatting,
          list: 'no-icons',
          options: [
            'p',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'code',
          ],
        },
        {
          label: q.lang.editor.fontSize,
          icon: q.iconSet.editor.fontSize,
          fixedLabel: true,
          fixedIcon: true,
          list: 'no-icons',
          options: [
            'size-1',
            'size-2',
            'size-3',
            'size-4',
            'size-5',
            'size-6',
            'size-7',
          ],
        },
        {
          label: q.lang.editor.defaultFont,
          icon: q.iconSet.editor.font,
          fixedIcon: true,
          list: 'no-icons',
          options: [
            'default_font',
            'arial',
            'arial_black',
            'comic_sans',
            'courier_new',
            'impact',
            'lucida_grande',
            'times_new_roman',
            'verdana',
          ],
        },
        'removeFormat',
      ],
      ['quote', 'unordered', 'ordered', 'outdent', 'indent'],
      ['undo', 'redo'],
      ['viewsource'],
    ];

    watch(editorTemplate, async (val) => {
      if (val?.includes('::')) {
        tokensDialog.value = true;
      }

      updateRawTemplate();
    });

    function updateRawTemplate () {
      const elements = document.getElementsByClassName('ape-report-editor-tokens');
      let template = cloneDeep(editorTemplate.value);
      if (elements.length) {
        for (let i = 0; i < elements.length; i++) {
          const elem = elements.item(i);
          const elementId = elem.id;
          const stringElem = elem.outerHTML;
          template = template.replace(stringElem, `{${elementId}}`);
        };
      }
      rawTemplate.value = template;
    }

    async function init () {
      try {
        formTemplate.value = await getFormTemplate(reportTemplateId);
        console.warn('formTemplate.value', formTemplate.value);
        name.value = formTemplate.value.name;
        description.value = formTemplate.value.description;
        // TODO: Pass ApeReport as well
        setTokenToChip(formTemplate.value.template || '');
      } catch (e) {
        console.error(e);
      }
    }

    function onTokenSelect ({ label, value }) {
      const edit = editorRef.value;

      if (value === 'custom_text' || value === 'custom_choices') {
        edit.runCmd('insertHTML', setChipToToken({ label, value }));
        return;
      }

      if (editorTemplate.value.includes('::')) {
        editorTemplate.value = editorTemplate.value.replace('::', setChipToToken({ label, value }));
      } else {
        edit.runCmd('insertHTML', setChipToToken({ label, value }));
      }

      edit.focus();
      tokensDialog.value = false;
    }

    async function insertCustomText () {
      if (!await customTextFormRef.value.validate()) return;
      onTokenSelect({ label: customText.value, value: 'custom_text' });
      customTextFormRef.value.resetValidation();
      customText.value = '';
      customTextDialog.value = false;
    }

    async function insertCustomDropdown () {
      if (!await customDropdownFormRef.value.validate()) return;
      if (dropdownOptions.value?.some(item => !item.option)) {
        showSnack({
          message: 'Add at least one option',
          color: 'warning',
        });
        return;
      }
      // TODO: save the options
      onTokenSelect({ label: 'Custom Dropdown', value: 'custom_dropdown' });
      customDropdownDialog.value = false;
    }

    function setTokenToChip (template) {
      // TODO: Create separate logic for handling ApeReport#items (custom choices)
      // TODO: Find where to get ApeReport#values (see old implementation)
      // const tokens = template;
      editorTemplate.value = template || '';
    }

    function setChipToToken ({ label, value }) {
      return `<span class="ape-report-editor-tokens row inline items-center" contenteditable="false" id="${value}">${label}</span>&nbsp;`;
    }

    function addOption () {
      dropdownOptions.value.push({ option: '' });
    }

    function removeOption (index) {
      dropdownOptions.value.splice(index, 1);
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
      customDropdownDialog,
      customDropdownFormRef,
      customText,
      customTextDialog,
      customTextFormRef,
      description,
      dropdownOptions,
      dropdownQuestion,
      editorFontOptions,
      editorRef,
      editorTemplate,
      editorToolbarOptions,
      formTemplate,
      isArchived,
      isUpdating,
      leftDrawer,
      loading,
      name,
      rawTemplate,
      tokensDialog,
      //
      addOption,
      goBack,
      insertCustomDropdown,
      insertCustomText,
      onArchive,
      onDelete,
      onTokenSelect,
      onUnarchive,
      removeOption,
    };
  },
};
</script>

<style lang="sass">
.ape-report-editor-tokens
  background: #0099cc
  color: white
  padding: 3px
  &, .q-icon
    border-radius: 3px
  .q-icon
    background: #0099aa
</style>
